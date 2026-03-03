"""API router for publications, distributors, and article placements.

Three-list Venn diagram recommendation engine:
  A = Inventory (NewsUSA)  → import-csv
  B = Gumshoe (AI-cited)   → import-sources
  C = Strategy (curated)   → import-strategy

Endpoints:
  POST /publications/import-csv            — Import distributor CSV (List A)
  POST /publications/import-network        — Import distributor network CSV (List A — umbrella-priced)
  POST /publications/import-sources        — Import Gumshoe citations (List B)
  POST /publications/import-strategy       — Import strategy targets (List C)
  GET  /publications/tiers                 — 7-tier Venn breakdown with counts + color codes
  GET  /publications/recommend             — Recommend by tier (replaces old score sort)
  GET  /publications/                      — List/filter publications
  GET  /publications/{pub_id}              — Get single publication
  POST /distributors/                      — Create distributor
  GET  /distributors/                      — List distributors with pub counts
  POST /publications/groups               — Create a publication group
  GET  /publications/groups               — List groups
  POST /publications/groups/{id}/members  — Add publications to a group
  POST /articles/{run_id}/publications    — Assign publications to an article run
  GET  /articles/{run_id}/publications    — Get publications for an article run
"""

import csv
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query

from app.models.publications import (
    TIER_COLORS,
    TIER_LABELS,
    ArticlePublication,
    ArticlePublicationCreate,
    CSVImportRequest,
    CSVImportResult,
    Distributor,
    DistributorCreate,
    GroupMemberAdd,
    GroupType,
    NetworkImportRequest,
    NetworkImportResult,
    PlacementStatus,
    PlacementStatusUpdate,
    Publication,
    PublicationCitation,
    PublicationGroup,
    PublicationGroupCreate,
    SourcesImportRequest,
    SourcesImportResult,
    StrategyImportRequest,
    StrategyImportResult,
)
from app.services.publication_scoring import get_viability_engine
from app.storage import supabase_publications as sb_pub

logger = logging.getLogger(__name__)

router = APIRouter()

# Path to customers directory (same as gumshoe_parser)
CUSTOMERS_DIR = Path(__file__).parent.parent.parent.parent / "customers"

# ---------------------------------------------------------------------------
# In-memory stores (Supabase persistence when available)
# ---------------------------------------------------------------------------
_distributors: dict[str, Distributor] = {}          # slug → Distributor
_publications: dict[str, Publication] = {}          # str(id) → Publication
_pub_by_url: dict[str, str] = {}                    # url → pub id (NewsUSA dedup)
_pub_by_domain: dict[str, str] = {}                 # domain → first pub id (cross-list linking)
_pub_by_name: dict[str, str] = {}                   # normalized name → pub id (network dedup)
_citations: list[PublicationCitation] = []           # raw citation rows
_groups: dict[str, PublicationGroup] = {}            # slug → PublicationGroup
_group_members: dict[str, set[str]] = {}            # group_slug → set of pub_ids
_article_publications: dict[str, list[ArticlePublication]] = {}  # run_id → placements
_placements_by_pub: dict[str, list[ArticlePublication]] = {}    # pub_id → placements

_loaded_from_db = False


def load_from_supabase() -> dict[str, int]:
    """Populate in-memory stores from Supabase. Returns counts per table."""
    global _loaded_from_db
    if _loaded_from_db:
        return {}

    counts: dict[str, int] = {}

    # Distributors
    for row in sb_pub.load_all_distributors():
        slug = row["slug"]
        _distributors[slug] = Distributor(
            id=row["id"], name=row["name"], slug=slug,
            website=row.get("website", ""), description=row.get("description", ""),
        )
    counts["distributors"] = len(_distributors)

    # Publications
    for row in sb_pub.load_all_publications():
        pid = str(row["id"])
        pub = Publication(
            id=row["id"],
            distributor_id=row.get("distributor_id"),
            name=row["name"],
            url=row.get("url", ""),
            domain=row.get("domain", ""),
            domain_authority=row.get("domain_authority"),
            domain_rating=row.get("domain_rating"),
            ai_score=row.get("ai_score"),
            ai_tier=row.get("ai_tier", ""),
            common_crawl=row.get("common_crawl", ""),
            price_usd=row.get("price_usd"),
            turnaround=row.get("turnaround", ""),
            region=row.get("region", ""),
            dofollow=row.get("dofollow", False),
            publication_type=row.get("publication_type", "news"),
            category=row.get("category", ""),
            citation_count=row.get("citation_count", 0),
            source_lists=row.get("source_lists") or [],
            recommendation_tier=row.get("recommendation_tier"),
            metadata=row.get("metadata") or {},
            viability_score=row.get("viability_score"),
            validated_hits=row.get("validated_hits", 0),
            total_attempts=row.get("total_attempts", 0),
            success_rate=row.get("success_rate", 0.0),
        )
        _publications[pid] = pub
        if pub.url:
            _pub_by_url[pub.url] = pid
        if pub.domain and pub.domain not in _pub_by_domain:
            _pub_by_domain[pub.domain] = pid
        name_key = pub.name.strip().lower()
        if name_key and name_key not in _pub_by_name:
            _pub_by_name[name_key] = pid
    counts["publications"] = len(_publications)

    # Citations
    for row in sb_pub.load_all_citations():
        _citations.append(PublicationCitation(
            id=row["id"],
            publication_id=row["publication_id"],
            source_url=row.get("source_url", ""),
            domain=row.get("domain", ""),
            model=row.get("model", ""),
            persona=row.get("persona", ""),
            question=row.get("question", ""),
            topics=row.get("topics") or [],
            answer_id=row.get("answer_id", ""),
            prompt_id=row.get("prompt_id", ""),
        ))
    counts["citations"] = len(_citations)

    # Groups
    for row in sb_pub.load_all_groups():
        slug = row["slug"]
        _groups[slug] = PublicationGroup(
            id=row["id"], name=row["name"], slug=slug,
            group_type=GroupType(row["group_type"]),
            description=row.get("description", ""),
            metadata=row.get("metadata") or {},
        )
        if slug not in _group_members:
            _group_members[slug] = set()
    counts["groups"] = len(_groups)

    # Group members
    member_count = 0
    for row in sb_pub.load_all_group_members():
        gid = row["group_id"]
        pid = str(row["publication_id"])
        # Find group slug by id
        for slug, g in _groups.items():
            if str(g.id) == gid:
                if slug not in _group_members:
                    _group_members[slug] = set()
                _group_members[slug].add(pid)
                member_count += 1
                break
    counts["group_members"] = member_count

    # Article publications (placements)
    for row in sb_pub.load_all_article_publications():
        run_id = str(row["article_run_id"])
        pub_id = str(row["publication_id"])
        ap = ArticlePublication(
            id=row["id"],
            article_run_id=row["article_run_id"],
            publication_id=row["publication_id"],
            status=PlacementStatus(row.get("status", "planned")),
            published_url=row.get("published_url", ""),
            published_at=row.get("published_at"),
        )
        if run_id not in _article_publications:
            _article_publications[run_id] = []
        _article_publications[run_id].append(ap)
        if pub_id not in _placements_by_pub:
            _placements_by_pub[pub_id] = []
        _placements_by_pub[pub_id].append(ap)
    counts["article_publications"] = sum(len(v) for v in _article_publications.values())

    # Recompute PVI scores from loaded data
    _recompute_all_viability()

    _loaded_from_db = True
    if any(v > 0 for v in counts.values()):
        logger.info(f"Loaded publications data from Supabase: {counts}")
    return counts


# ---------------------------------------------------------------------------
# Classification helpers
# ---------------------------------------------------------------------------

_TYPE_EXACT: dict[str, str] = {
    "youtube.com": "video", "vimeo.com": "video", "dailymotion.com": "video",
    "reddit.com": "forum", "quora.com": "forum",
    "medium.com": "blog", "substack.com": "blog",
    "trustpilot.com": "review", "bbb.org": "review", "consumeraffairs.com": "review", "sitejabber.com": "review",
    "en.wikipedia.org": "reference", "wikipedia.org": "reference", "investopedia.com": "reference",
    "twitter.com": "social", "x.com": "social", "facebook.com": "social", "linkedin.com": "social",
    "msn.com": "aggregator", "news.google.com": "aggregator",
}

_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "precious_metals": ["bullion", "gold", "silver", "coin", "mint", "precious", "metal", "numismatic"],
    "financial_news": ["forbes", "barron", "cnbc", "bloomberg", "reuters", "wsj", "marketwatch", "fortune", "thestreet", "benzinga"],
    "investment": ["invest", "morningstar", "fidelity", "schwab", "vanguard", "nerdwallet", "bankrate", "kiplinger"],
    "consumer_review": ["trustpilot", "bbb", "consumeraffairs", "sitejabber"],
    "technology": ["techcrunch", "wired", "venturebeat", "arstechnica"],
}


def _classify_publication_type(domain: str) -> str:
    """Auto-classify publication type from domain."""
    if domain in _TYPE_EXACT:
        return _TYPE_EXACT[domain]
    if domain.endswith(".gov"):
        return "government"
    if domain.endswith(".edu"):
        return "academic"
    return "news"


def _classify_category(domain: str) -> str:
    """Auto-classify industry/specialty category from domain patterns."""
    domain_lower = domain.lower()
    for cat, keywords in _CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in domain_lower:
                return cat
    return ""


def _compute_tier(pub: Publication) -> int:
    """Compute recommendation tier from source_lists membership.

    Tier 1 = A∩B∩C, Tier 2 = A∩B, Tier 3 = A∩C, Tier 4 = B∩C,
    Tier 5 = C only, Tier 6 = B only, Tier 7 = A only (or none).
    """
    in_a = "newsusa" in pub.source_lists
    in_b = "gumshoe" in pub.source_lists
    in_c = "strategy" in pub.source_lists

    if in_a and in_b and in_c:
        return 1
    if in_a and in_b:
        return 2
    if in_a and in_c:
        return 3
    if in_b and in_c:
        return 4
    if in_c:
        return 5
    if in_b:
        return 6
    return 7  # A only, or uncategorized


def _recompute_all_tiers() -> None:
    """Recompute recommendation_tier for all publications."""
    for pub in _publications.values():
        pub.recommendation_tier = _compute_tier(pub)


def _recompute_viability_for_pub(pub_id: str) -> float | None:
    """Recompute PVI for a single publication. Returns the new score."""
    pub = _publications.get(pub_id)
    if not pub:
        return None
    engine = get_viability_engine()
    placements = _placements_by_pub.get(pub_id, [])
    is_gumshoe = "gumshoe" in pub.source_lists
    breakdown = engine.compute_viability(pub, placements, is_gumshoe)
    pub.viability_score = breakdown.viability_score
    pub.validated_hits = breakdown.validated_hits
    pub.total_attempts = breakdown.total_attempts
    pub.success_rate = breakdown.success_rate
    return breakdown.viability_score


def _recompute_all_viability() -> dict:
    """Recompute PVI for all publications. Returns summary stats."""
    engine = get_viability_engine()
    scored = 0
    for pub_id, pub in _publications.items():
        placements = _placements_by_pub.get(pub_id, [])
        is_gumshoe = "gumshoe" in pub.source_lists
        breakdown = engine.compute_viability(pub, placements, is_gumshoe)
        pub.viability_score = breakdown.viability_score
        pub.validated_hits = breakdown.validated_hits
        pub.total_attempts = breakdown.total_attempts
        pub.success_rate = breakdown.success_rate
        scored += 1
    return {"scored": scored, "total": len(_publications)}


def _get_or_create_domain_pub(domain: str, name: str = "") -> Publication:
    """Get existing publication for a domain, or create one (no distributor)."""
    if domain in _pub_by_domain:
        return _publications[_pub_by_domain[domain]]

    pub_id = uuid4()
    pub = Publication(
        id=pub_id,
        name=name or domain,
        domain=domain,
        publication_type=_classify_publication_type(domain),
        category=_classify_category(domain),
    )
    pid_str = str(pub_id)
    _publications[pid_str] = pub
    _pub_by_domain[domain] = pid_str
    name_key = (name or domain).strip().lower()
    if name_key and name_key not in _pub_by_name:
        _pub_by_name[name_key] = pid_str
    return pub


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def _safe_int(val: str) -> int | None:
    if not val or not val.strip():
        return None
    try:
        return int(float(val.strip().replace(",", "")))
    except (ValueError, TypeError):
        return None


def _safe_float(val: str) -> float | None:
    if not val or not val.strip():
        return None
    try:
        return float(val.strip())
    except (ValueError, TypeError):
        return None


def _extract_domain(url: str) -> str:
    """Extract bare domain from URL."""
    if not url:
        return ""
    return re.sub(r"^https?://(?:www\.)?", "", url).split("/")[0]


# ---------------------------------------------------------------------------
# Import endpoints — three lists
# ---------------------------------------------------------------------------


@router.post("/publications/import-csv", response_model=CSVImportResult)
async def import_csv(request: CSVImportRequest) -> CSVImportResult:
    """Import distributor publication CSV (List A — Inventory).

    Idempotent — re-importing updates scores/prices without creating duplicates (matched on url).
    Auto-creates tier-based publication groups from the AI_Tier column.
    """
    csv_path = CUSTOMERS_DIR / request.customer_slug / request.filename
    if not csv_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"CSV not found: {csv_path.relative_to(CUSTOMERS_DIR.parent)}",
        )

    dist_slug = _slugify(request.distributor_name)
    if dist_slug not in _distributors:
        _distributors[dist_slug] = Distributor(name=request.distributor_name, slug=dist_slug)
    distributor = _distributors[dist_slug]

    imported = 0
    updated = 0
    tier_groups_seen: set[str] = set()

    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            url = (row.get("URL") or "").strip()
            name = (row.get("Publication") or "").strip()
            if not name:
                continue

            domain = _extract_domain(url)
            ai_tier = (row.get("AI_Tier") or "").strip()
            dofollow_raw = (row.get("DoFollow") or "").strip().lower()

            # Dedup by URL first, then by domain
            existing_id = _pub_by_url.get(url) if url else None
            if not existing_id and domain:
                existing_id = _pub_by_domain.get(domain)

            if existing_id and existing_id in _publications:
                pub = _publications[existing_id]
                pub.distributor_id = distributor.id
                pub.name = name
                pub.domain = domain
                pub.domain_authority = _safe_int(row.get("DA", ""))
                pub.domain_rating = _safe_int(row.get("DR", ""))
                pub.ai_score = _safe_float(row.get("AI_Score", ""))
                pub.ai_tier = ai_tier
                pub.common_crawl = (row.get("CommonCrawl") or "").strip()
                pub.price_usd = _safe_int(row.get("Price", ""))
                pub.turnaround = (row.get("TAT") or "").strip()
                pub.region = (row.get("Region1") or "").strip()
                pub.dofollow = dofollow_raw in ("yes", "true", "1")
                if not pub.publication_type or pub.publication_type == "news":
                    pub.publication_type = _classify_publication_type(domain)
                if not pub.category:
                    pub.category = _classify_category(domain)
                if "newsusa" not in pub.source_lists:
                    pub.source_lists.append("newsusa")
                if url and url not in _pub_by_url:
                    _pub_by_url[url] = existing_id
                updated += 1
            else:
                pub_id = uuid4()
                pub = Publication(
                    id=pub_id,
                    distributor_id=distributor.id,
                    name=name,
                    url=url,
                    domain=domain,
                    domain_authority=_safe_int(row.get("DA", "")),
                    domain_rating=_safe_int(row.get("DR", "")),
                    ai_score=_safe_float(row.get("AI_Score", "")),
                    ai_tier=ai_tier,
                    common_crawl=(row.get("CommonCrawl") or "").strip(),
                    price_usd=_safe_int(row.get("Price", "")),
                    turnaround=(row.get("TAT") or "").strip(),
                    region=(row.get("Region1") or "").strip(),
                    dofollow=dofollow_raw in ("yes", "true", "1"),
                    publication_type=_classify_publication_type(domain),
                    category=_classify_category(domain),
                    source_lists=["newsusa"],
                )
                _publications[str(pub_id)] = pub
                if url:
                    _pub_by_url[url] = str(pub_id)
                if domain and domain not in _pub_by_domain:
                    _pub_by_domain[domain] = str(pub_id)
                name_key = name.strip().lower()
                if name_key and name_key not in _pub_by_name:
                    _pub_by_name[name_key] = str(pub_id)
                imported += 1

            # Auto-create tier groups
            if ai_tier:
                tier_groups_seen.add(ai_tier)
                tier_slug = _slugify(ai_tier)
                if tier_slug not in _groups:
                    _groups[tier_slug] = PublicationGroup(
                        name=ai_tier, slug=tier_slug, group_type=GroupType.TIER,
                        description=f"Auto-created from {request.distributor_name} AI_Tier column",
                    )
                    _group_members[tier_slug] = set()
                _group_members[tier_slug].add(str(pub.id))

    _recompute_all_tiers()

    # Persist to Supabase
    sb_pub.upsert_distributor(distributor)
    all_pubs = list(_publications.values())
    persisted_pubs = sb_pub.upsert_publications_batch(all_pubs)
    for slug in tier_groups_seen:
        tier_slug = _slugify(slug)
        if tier_slug in _groups:
            sb_pub.upsert_group(_groups[tier_slug])
            sb_pub.set_group_members(str(_groups[tier_slug].id), _group_members.get(tier_slug, set()))

    logger.info(f"CSV import: {imported} new, {updated} updated from {request.distributor_name} ({persisted_pubs} persisted)")
    return CSVImportResult(
        distributor_id=str(distributor.id), distributor_name=distributor.name,
        publications_imported=imported, publications_updated=updated,
        groups_created=sorted(tier_groups_seen),
    )


@router.post("/publications/import-sources", response_model=SourcesImportResult)
async def import_sources(request: SourcesImportRequest) -> SourcesImportResult:
    """Import Gumshoe sources CSV (List B — AI-cited).

    Creates domain-level publications for new domains, adds citation rows,
    and increments citation_count. Idempotent on re-import (citations are additive).
    """
    csv_path = CUSTOMERS_DIR / request.customer_slug / request.filename
    if not csv_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Sources CSV not found: {csv_path.relative_to(CUSTOMERS_DIR.parent)}",
        )

    domains_imported = 0
    domains_updated = 0
    citations_created = 0
    domain_citation_counts: dict[str, int] = {}

    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            source_url = (row.get("url") or "").strip()
            domain = (row.get("domain") or "").strip()
            if not domain:
                continue

            # Track citation count per domain
            domain_citation_counts[domain] = domain_citation_counts.get(domain, 0) + 1

            # Get or create publication for this domain
            is_new = domain not in _pub_by_domain
            pub = _get_or_create_domain_pub(domain)

            if is_new:
                domains_imported += 1
            elif "gumshoe" not in pub.source_lists:
                domains_updated += 1

            if "gumshoe" not in pub.source_lists:
                pub.source_lists.append("gumshoe")

            # Auto-classify if not already set
            if not pub.category:
                pub.category = _classify_category(domain)

            # Store topics in metadata for category enrichment
            topics_raw = (row.get("topics") or "").strip()
            if topics_raw:
                topic_list = [t.strip() for t in topics_raw.split(";") if t.strip()]
            else:
                topic_list = []

            # Create citation record
            citation = PublicationCitation(
                publication_id=pub.id,
                source_url=source_url,
                domain=domain,
                model=(row.get("model") or "").strip(),
                persona=(row.get("persona") or "").strip(),
                question=(row.get("question") or "").strip(),
                topics=topic_list,
                answer_id=(row.get("Answer ID") or "").strip(),
                prompt_id=(row.get("Prompt ID") or "").strip(),
            )
            _citations.append(citation)
            citations_created += 1

    # Update citation counts on publications
    for domain, count in domain_citation_counts.items():
        if domain in _pub_by_domain:
            pub = _publications[_pub_by_domain[domain]]
            pub.citation_count = count

    _recompute_all_tiers()

    # Persist to Supabase
    all_pubs = list(_publications.values())
    sb_pub.upsert_publications_batch(all_pubs)
    sb_pub.insert_citations_batch(_citations)

    logger.info(
        f"Sources import: {domains_imported} new domains, {domains_updated} updated, "
        f"{citations_created} citations from {request.filename}"
    )
    return SourcesImportResult(
        domains_imported=domains_imported, domains_updated=domains_updated,
        citations_created=citations_created, total_publications=len(_publications),
    )


@router.post("/publications/import-strategy", response_model=StrategyImportResult)
async def import_strategy(request: StrategyImportRequest) -> StrategyImportResult:
    """Import curated strategy recommendation list (List C).

    Tags domains as strategic targets. Creates publications for new domains.
    """
    created = 0
    tagged = 0

    for domain_raw in request.domains:
        domain = domain_raw.strip().lower()
        if not domain:
            continue

        is_new = domain not in _pub_by_domain
        pub = _get_or_create_domain_pub(domain)

        if is_new:
            created += 1

        if "strategy" not in pub.source_lists:
            pub.source_lists.append("strategy")
            tagged += 1

    _recompute_all_tiers()

    # Persist to Supabase
    all_pubs = list(_publications.values())
    sb_pub.upsert_publications_batch(all_pubs)

    total_strategy = sum(1 for p in _publications.values() if "strategy" in p.source_lists)

    logger.info(f"Strategy import: {tagged} domains tagged, {created} new")
    return StrategyImportResult(
        domains_tagged=tagged, domains_created=created, total_strategy=total_strategy,
    )


@router.post("/publications/import-network", response_model=NetworkImportResult)
async def import_network(request: NetworkImportRequest) -> NetworkImportResult:
    """Import a distributor's guaranteed placement network (List A — Network subset).

    For outlets included in a flat-rate umbrella deal (e.g. NewsUSA $5,500/article).
    Sets price_usd=0 (included), tags source_lists with both 'newsusa' and
    'newsusa-network', and assigns all outlets to a 'NewsUSA Network' publication group.

    Deduplicates by normalized outlet name (since network CSVs lack URLs).
    Idempotent — re-importing updates metadata without creating duplicates.
    """
    csv_path = CUSTOMERS_DIR / request.customer_slug / request.filename
    if not csv_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Network CSV not found: {csv_path.relative_to(CUSTOMERS_DIR.parent)}",
        )

    dist_slug = _slugify(request.distributor_name)
    if dist_slug not in _distributors:
        _distributors[dist_slug] = Distributor(name=request.distributor_name, slug=dist_slug)
    distributor = _distributors[dist_slug]

    # Ensure "NewsUSA Network" publication group exists
    network_group_slug = "newsusa-network"
    if network_group_slug not in _groups:
        _groups[network_group_slug] = PublicationGroup(
            name="NewsUSA Network",
            slug=network_group_slug,
            group_type=GroupType.BUDGET,
            description=(
                "Outlets included in NewsUSA's guaranteed placement network. "
                "Covered under flat-rate umbrella pricing — no per-placement cost."
            ),
            metadata={"umbrella_price": 5500, "distributor": "newsusa"},
        )
        _group_members[network_group_slug] = set()

    imported = 0
    updated = 0
    skipped = 0
    network_pub_ids: set[str] = set()

    # US state → region mapping for richer region field
    state_to_region = {
        "AK": "Alaska", "AL": "Alabama", "AR": "Arkansas", "AZ": "Arizona",
        "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DC": "District of Columbia",
        "DE": "Delaware", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii",
        "IA": "Iowa", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana",
        "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "MA": "Massachusetts",
        "MD": "Maryland", "ME": "Maine", "MI": "Michigan", "MN": "Minnesota",
        "MO": "Missouri", "MS": "Mississippi", "MT": "Montana", "NC": "North Carolina",
        "ND": "North Dakota", "NE": "Nebraska", "NH": "New Hampshire", "NJ": "New Jersey",
        "NM": "New Mexico", "NV": "Nevada", "NY": "New York", "OH": "Ohio",
        "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "PR": "Puerto Rico",
        "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
        "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VA": "Virginia",
        "VI": "US Virgin Islands", "VT": "Vermont", "WA": "Washington",
        "WI": "Wisconsin", "WV": "West Virginia", "WY": "Wyoming",
    }

    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("Publication") or "").strip()
            if not name:
                skipped += 1
                continue

            name_key = name.strip().lower()
            state = (row.get("State") or "").strip()
            city = (row.get("City") or "").strip()
            dma = (row.get("DMA") or "").strip()
            dma_rank = _safe_int(row.get("DMA_Rank", ""))
            reach = _safe_int(row.get("Reach", ""))
            aev = _safe_float(row.get("AEV", ""))
            dist_date = (row.get("Distribution_Date") or "").strip()
            da = _safe_int(row.get("DA", ""))
            pub_type = (row.get("Publication_Type") or "news").strip()
            region = state_to_region.get(state, state)

            meta = {}
            if city:
                meta["city"] = city
            if state:
                meta["state"] = state
            if dma:
                meta["dma"] = dma
            if dma_rank is not None:
                meta["dma_rank"] = dma_rank
            if reach is not None:
                meta["reach"] = reach
            if aev is not None:
                meta["aev"] = aev
            if dist_date:
                meta["distribution_date"] = dist_date
            meta["pricing_model"] = "network-included"

            # Dedup: check by name first, then by URL/domain
            existing_id = _pub_by_name.get(name_key)

            if existing_id and existing_id in _publications:
                pub = _publications[existing_id]
                pub.distributor_id = distributor.id
                if da is not None:
                    pub.domain_authority = da
                pub.region = region
                pub.price_usd = 0
                pub.publication_type = pub_type
                if "newsusa" not in pub.source_lists:
                    pub.source_lists.append("newsusa")
                if "newsusa-network" not in pub.source_lists:
                    pub.source_lists.append("newsusa-network")
                pub.metadata.update(meta)
                network_pub_ids.add(existing_id)
                updated += 1
            else:
                pub_id = uuid4()
                pub = Publication(
                    id=pub_id,
                    distributor_id=distributor.id,
                    name=name,
                    domain_authority=da,
                    price_usd=0,
                    region=region,
                    publication_type=pub_type,
                    source_lists=["newsusa", "newsusa-network"],
                    metadata=meta,
                )
                pid_str = str(pub_id)
                _publications[pid_str] = pub
                _pub_by_name[name_key] = pid_str
                network_pub_ids.add(pid_str)
                imported += 1

    # Update group membership
    _group_members[network_group_slug] = (
        _group_members.get(network_group_slug, set()) | network_pub_ids
    )

    _recompute_all_tiers()

    # Persist
    sb_pub.upsert_distributor(distributor)
    all_pubs = list(_publications.values())
    sb_pub.upsert_publications_batch(all_pubs)
    group = _groups[network_group_slug]
    sb_pub.upsert_group(group)
    sb_pub.set_group_members(str(group.id), _group_members[network_group_slug])

    logger.info(
        f"Network import: {imported} new, {updated} updated, {skipped} skipped "
        f"from {request.distributor_name} ({len(network_pub_ids)} in network group)"
    )
    return NetworkImportResult(
        distributor_id=str(distributor.id),
        distributor_name=distributor.name,
        publications_imported=imported,
        publications_updated=updated,
        publications_skipped=skipped,
        group_name="NewsUSA Network",
        group_id=str(group.id),
        total_network=len(_group_members[network_group_slug]),
    )


# ---------------------------------------------------------------------------
# Tiers & Recommendations
# ---------------------------------------------------------------------------


@router.get("/publications/tiers")
async def get_tiers(
    category: str | None = Query(None, description="Filter by category"),
    publication_type: str | None = Query(None, description="Filter by publication type"),
) -> dict[str, Any]:
    """7-tier Venn diagram breakdown with counts, colors, and top publications per tier."""
    pubs = list(_publications.values())
    if category:
        pubs = [p for p in pubs if p.category == category]
    if publication_type:
        pubs = [p for p in pubs if p.publication_type == publication_type]

    tiers: dict[int, list[Publication]] = {i: [] for i in range(1, 8)}
    for pub in pubs:
        tier = pub.recommendation_tier or 7
        tiers[tier].append(pub)

    result_tiers = []
    for tier_num in range(1, 8):
        tier_pubs = tiers[tier_num]
        # Sort: viability first within tier, then legacy signals as tiebreakers
        tier_pubs.sort(key=lambda p: (p.viability_score or 0, p.ai_score or 0, p.citation_count), reverse=True)

        result_tiers.append({
            "tier": tier_num,
            "label": TIER_LABELS[tier_num],
            "color": TIER_COLORS[tier_num],
            "count": len(tier_pubs),
            "top": [_pub_summary(p) for p in tier_pubs[:10]],
        })

    # Category breakdown across all publications
    categories: dict[str, int] = {}
    for pub in pubs:
        cat = pub.category or "uncategorized"
        categories[cat] = categories.get(cat, 0) + 1

    # Publication type breakdown
    types: dict[str, int] = {}
    for pub in pubs:
        types[pub.publication_type] = types.get(pub.publication_type, 0) + 1

    return {
        "total_publications": len(pubs),
        "tiers": result_tiers,
        "categories": dict(sorted(categories.items(), key=lambda x: x[1], reverse=True)),
        "publication_types": dict(sorted(types.items(), key=lambda x: x[1], reverse=True)),
    }


@router.get("/publications/recommend")
async def recommend_publications(
    tier: int | None = Query(None, ge=1, le=7, description="Filter by specific tier"),
    max_tier: int = Query(4, ge=1, le=7, description="Include tiers up to this number (lower=better)"),
    category: str | None = Query(None, description="Filter by category"),
    publication_type: str | None = Query(None, description="Filter by publication type"),
    max_price: int | None = Query(None, description="Maximum price USD"),
    region: str | None = Query(None, description="Filter by region"),
    min_citations: int | None = Query(None, description="Minimum citation count"),
    limit: int = Query(50, ge=1, le=500, description="Max results"),
) -> list[dict[str, Any]]:
    """Recommend publications by tier, with optional filters.

    Default returns Tiers 1-4 (actionable tiers), sorted by tier then by
    citation_count (Tier 4) or ai_score (others).
    """
    results = []
    for pub in _publications.values():
        t = pub.recommendation_tier or 7
        if tier is not None and t != tier:
            continue
        if tier is None and t > max_tier:
            continue
        if category and pub.category != category:
            continue
        if publication_type and pub.publication_type != publication_type:
            continue
        if max_price is not None and pub.price_usd is not None and pub.price_usd > max_price:
            continue
        if region and pub.region and region.lower() not in pub.region.lower():
            continue
        if min_citations is not None and pub.citation_count < min_citations:
            continue
        results.append(pub)

    # Sort by tier (ascending), then viability within tier, then legacy signals
    def _sort_key(p: Publication) -> tuple:
        t = p.recommendation_tier or 7
        v = -(p.viability_score or 0)
        if t in (4, 6):
            return (t, v, -(p.citation_count or 0), -(p.ai_score or 0))
        return (t, v, -(p.ai_score or 0), -(p.citation_count or 0))

    results.sort(key=_sort_key)
    return [_pub_to_dict(p) for p in results[:limit]]


# ---------------------------------------------------------------------------
# Publications CRUD
# ---------------------------------------------------------------------------


@router.get("/publications/groups")
async def list_groups(
    group_type: str | None = Query(None, description="Filter by group type"),
) -> list[dict[str, Any]]:
    groups = list(_groups.values())
    if group_type:
        groups = [g for g in groups if g.group_type.value == group_type]
    return [
        {
            "id": str(g.id),
            "name": g.name,
            "slug": g.slug,
            "group_type": g.group_type.value,
            "description": g.description,
            "metadata": g.metadata,
            "member_count": len(_group_members.get(g.slug, set())),
            "created_at": g.created_at.isoformat(),
        }
        for g in sorted(groups, key=lambda g: g.name)
    ]


@router.get("/publications/")
async def list_publications(
    ai_tier: str | None = Query(None, description="Filter by AI tier"),
    min_score: float | None = Query(None, description="Minimum AI score"),
    region: str | None = Query(None, description="Filter by region"),
    max_price: int | None = Query(None, description="Maximum price USD"),
    dofollow: bool | None = Query(None, description="Filter by dofollow"),
    distributor: str | None = Query(None, description="Filter by distributor slug"),
    recommendation_tier: int | None = Query(None, ge=1, le=7, description="Filter by tier"),
    publication_type: str | None = Query(None, description="Filter by type"),
    category: str | None = Query(None, description="Filter by category"),
    source_list: str | None = Query(None, description="Filter by list membership: newsusa, gumshoe, strategy"),
    limit: int = Query(100, ge=1, le=1000, description="Max results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
) -> dict[str, Any]:
    pubs = list(_publications.values())

    if ai_tier:
        pubs = [p for p in pubs if p.ai_tier == ai_tier]
    if min_score is not None:
        pubs = [p for p in pubs if p.ai_score is not None and p.ai_score >= min_score]
    if region:
        pubs = [p for p in pubs if p.region and region.lower() in p.region.lower()]
    if max_price is not None:
        pubs = [p for p in pubs if p.price_usd is not None and p.price_usd <= max_price]
    if dofollow is not None:
        pubs = [p for p in pubs if p.dofollow == dofollow]
    if distributor:
        dist = _distributors.get(distributor)
        if dist:
            pubs = [p for p in pubs if p.distributor_id == dist.id]
    if recommendation_tier is not None:
        pubs = [p for p in pubs if p.recommendation_tier == recommendation_tier]
    if publication_type:
        pubs = [p for p in pubs if p.publication_type == publication_type]
    if category:
        pubs = [p for p in pubs if p.category == category]
    if source_list:
        pubs = [p for p in pubs if source_list in p.source_lists]

    total = len(pubs)
    pubs.sort(key=lambda p: (p.recommendation_tier or 7, -(p.viability_score or 0), -(p.ai_score or 0), -(p.citation_count or 0)))
    page = pubs[offset : offset + limit]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "publications": [_pub_to_dict(p) for p in page],
    }


@router.patch("/articles/{run_id}/publications/{placement_id}")
async def update_placement_status(
    run_id: str, placement_id: str, request: PlacementStatusUpdate,
) -> dict[str, Any]:
    """Update a placement's status. Triggers PVI recompute on terminal states."""
    placements = _article_publications.get(run_id, [])
    ap = next((p for p in placements if str(p.id) == placement_id), None)
    if not ap:
        raise HTTPException(status_code=404, detail=f"Placement {placement_id} not found in run {run_id}")

    ap.status = request.status
    if request.published_url:
        ap.published_url = request.published_url
    published_at_str = None
    if request.status == PlacementStatus.PUBLISHED:
        ap.published_at = datetime.now(timezone.utc)
        published_at_str = ap.published_at.isoformat()

    # Persist
    sb_pub.update_article_publication_status(
        str(ap.id), request.status.value, ap.published_url, published_at_str,
    )

    # Recompute PVI on terminal states
    pub_id = str(ap.publication_id)
    if request.status in (PlacementStatus.PUBLISHED, PlacementStatus.REJECTED):
        _recompute_viability_for_pub(pub_id)
        pub = _publications.get(pub_id)
        if pub:
            sb_pub.upsert_publication(pub)

    return {
        "id": str(ap.id),
        "status": ap.status.value,
        "published_url": ap.published_url,
        "published_at": ap.published_at.isoformat() if ap.published_at else None,
        "viability_score": _publications.get(pub_id, Publication(name="")).viability_score,
    }


@router.post("/publications/recompute-viability")
async def recompute_all_viability() -> dict[str, Any]:
    """Bulk recompute PVI scores for all publications."""
    stats = _recompute_all_viability()

    # Persist updated scores
    all_pubs = list(_publications.values())
    persisted = sb_pub.upsert_publications_batch(all_pubs)

    return {
        "scored": stats["scored"],
        "total": stats["total"],
        "persisted": persisted,
    }


@router.get("/publications/{pub_id}/viability")
async def get_publication_viability(pub_id: str) -> dict[str, Any]:
    """Detailed PVI breakdown for a single publication."""
    pub = _publications.get(pub_id)
    if not pub:
        raise HTTPException(status_code=404, detail=f"Publication {pub_id} not found")

    engine = get_viability_engine()
    placements = _placements_by_pub.get(pub_id, [])
    is_gumshoe = "gumshoe" in pub.source_lists
    breakdown = engine.compute_viability(pub, placements, is_gumshoe)

    return {
        "publication_id": pub_id,
        "name": pub.name,
        "domain": pub.domain,
        "recommendation_tier": pub.recommendation_tier,
        "viability_score": breakdown.viability_score,
        "confidence": breakdown.confidence,
        "empirical_score": breakdown.empirical_score,
        "reputation_score": breakdown.reputation_score,
        "empirical_weight": breakdown.empirical_weight,
        "reputation_weight": breakdown.reputation_weight,
        "success_rate": breakdown.success_rate,
        "validated_hits": breakdown.validated_hits,
        "total_attempts": breakdown.total_attempts,
        "gumshoe_confirmed": breakdown.gumshoe_confirmed,
        "gumshoe_bonus": breakdown.gumshoe_bonus,
        "reputation_components": {
            "da_normalized": breakdown.da_normalized,
            "dr_normalized": breakdown.dr_normalized,
            "ai_normalized": breakdown.ai_normalized,
            "cit_normalized": breakdown.cit_normalized,
        },
        "is_gumshoe": breakdown.is_gumshoe,
        "source_lists": breakdown.source_lists,
    }


@router.get("/publications/{pub_id}")
async def get_publication(pub_id: str) -> dict[str, Any]:
    pub = _publications.get(pub_id)
    if not pub:
        raise HTTPException(status_code=404, detail=f"Publication {pub_id} not found")

    result = _pub_to_dict(pub)
    result["groups"] = [
        {"slug": slug, "name": _groups[slug].name, "group_type": _groups[slug].group_type.value}
        for slug, members in _group_members.items()
        if pub_id in members and slug in _groups
    ]
    # Include citation details
    pub_citations = [c for c in _citations if str(c.publication_id) == pub_id]
    models: dict[str, int] = {}
    personas: dict[str, int] = {}
    for c in pub_citations:
        models[c.model] = models.get(c.model, 0) + 1
        if c.persona:
            personas[c.persona] = personas.get(c.persona, 0) + 1
    result["citation_breakdown"] = {
        "total": len(pub_citations),
        "by_model": dict(sorted(models.items(), key=lambda x: x[1], reverse=True)),
        "by_persona": dict(sorted(personas.items(), key=lambda x: x[1], reverse=True)),
    }
    return result


# ---------------------------------------------------------------------------
# Distributors
# ---------------------------------------------------------------------------


@router.post("/distributors/", response_model=dict[str, Any])
async def create_distributor(request: DistributorCreate) -> dict[str, Any]:
    slug = _slugify(request.name)
    if slug in _distributors:
        raise HTTPException(status_code=409, detail=f"Distributor '{slug}' already exists")
    dist = Distributor(name=request.name, slug=slug, website=request.website, description=request.description)
    _distributors[slug] = dist
    sb_pub.upsert_distributor(dist)
    return _dist_to_dict(dist)


@router.get("/distributors/")
async def list_distributors() -> list[dict[str, Any]]:
    results = []
    for dist in _distributors.values():
        pub_count = sum(1 for p in _publications.values() if p.distributor_id == dist.id)
        d = _dist_to_dict(dist)
        d["publication_count"] = pub_count
        results.append(d)
    return results


# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------


@router.post("/publications/groups", response_model=dict[str, Any])
async def create_group(request: PublicationGroupCreate) -> dict[str, Any]:
    slug = _slugify(request.name)
    if slug in _groups:
        raise HTTPException(status_code=409, detail=f"Group '{slug}' already exists")
    group = PublicationGroup(
        name=request.name, slug=slug, group_type=request.group_type,
        description=request.description, metadata=request.metadata,
    )
    _groups[slug] = group
    _group_members[slug] = set()
    sb_pub.upsert_group(group)
    return {
        "id": str(group.id), "name": group.name, "slug": group.slug,
        "group_type": group.group_type.value, "description": group.description,
        "member_count": 0, "created_at": group.created_at.isoformat(),
    }


@router.post("/publications/groups/{group_id}/members")
async def add_group_members(group_id: str, request: GroupMemberAdd) -> dict[str, Any]:
    group = None
    group_slug = None
    for slug, g in _groups.items():
        if str(g.id) == group_id or slug == group_id:
            group = g
            group_slug = slug
            break
    if not group or not group_slug:
        raise HTTPException(status_code=404, detail=f"Group {group_id} not found")
    if group_slug not in _group_members:
        _group_members[group_slug] = set()
    added = 0
    for pub_id in request.publication_ids:
        pub_id_str = str(pub_id)
        if pub_id_str in _publications:
            _group_members[group_slug].add(pub_id_str)
            added += 1
    sb_pub.set_group_members(str(group.id), _group_members[group_slug])
    return {
        "group_id": str(group.id), "group_name": group.name,
        "members_added": added, "total_members": len(_group_members[group_slug]),
    }


# ---------------------------------------------------------------------------
# Article Publications
# ---------------------------------------------------------------------------


@router.post("/articles/{run_id}/publications")
async def assign_article_publications(
    run_id: str, request: ArticlePublicationCreate,
) -> dict[str, Any]:
    if run_id not in _article_publications:
        _article_publications[run_id] = []
    created = []
    for pub_id in request.publication_ids:
        pub_id_str = str(pub_id)
        if pub_id_str not in _publications:
            continue
        existing = [ap for ap in _article_publications[run_id] if str(ap.publication_id) == pub_id_str]
        if existing:
            continue
        ap = ArticlePublication(article_run_id=UUID(run_id), publication_id=pub_id, status=request.status)
        _article_publications[run_id].append(ap)
        if pub_id_str not in _placements_by_pub:
            _placements_by_pub[pub_id_str] = []
        _placements_by_pub[pub_id_str].append(ap)
        sb_pub.upsert_article_publication(ap)
        created.append(str(ap.id))
    return {
        "run_id": run_id,
        "placements_created": len(created),
        "total_placements": len(_article_publications[run_id]),
    }


@router.get("/articles/{run_id}/publications")
async def get_article_publications(run_id: str) -> list[dict[str, Any]]:
    placements = _article_publications.get(run_id, [])
    results = []
    for ap in placements:
        pub = _publications.get(str(ap.publication_id))
        result: dict[str, Any] = {
            "id": str(ap.id), "article_run_id": str(ap.article_run_id),
            "publication_id": str(ap.publication_id), "status": ap.status.value,
            "published_url": ap.published_url,
            "published_at": ap.published_at.isoformat() if ap.published_at else None,
            "created_at": ap.created_at.isoformat(),
        }
        if pub:
            result["publication"] = {
                "name": pub.name, "url": pub.url, "ai_score": pub.ai_score,
                "ai_tier": pub.ai_tier, "price_usd": pub.price_usd,
                "recommendation_tier": pub.recommendation_tier,
            }
        results.append(result)
    return results


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------


def _pub_summary(pub: Publication) -> dict[str, Any]:
    """Compact summary for tier listings."""
    return {
        "id": str(pub.id),
        "name": pub.name,
        "domain": pub.domain,
        "ai_score": pub.ai_score,
        "citation_count": pub.citation_count,
        "price_usd": pub.price_usd,
        "publication_type": pub.publication_type,
        "category": pub.category,
        "source_lists": pub.source_lists,
        "viability_score": pub.viability_score,
    }


def _pub_to_dict(pub: Publication) -> dict[str, Any]:
    dist_name = None
    if pub.distributor_id:
        for d in _distributors.values():
            if d.id == pub.distributor_id:
                dist_name = d.name
                break
    return {
        "id": str(pub.id),
        "distributor_id": str(pub.distributor_id) if pub.distributor_id else None,
        "distributor_name": dist_name,
        "name": pub.name,
        "url": pub.url,
        "domain": pub.domain,
        "domain_authority": pub.domain_authority,
        "domain_rating": pub.domain_rating,
        "ai_score": pub.ai_score,
        "ai_tier": pub.ai_tier,
        "common_crawl": pub.common_crawl,
        "price_usd": pub.price_usd,
        "turnaround": pub.turnaround,
        "region": pub.region,
        "dofollow": pub.dofollow,
        "publication_type": pub.publication_type,
        "category": pub.category,
        "citation_count": pub.citation_count,
        "source_lists": pub.source_lists,
        "recommendation_tier": pub.recommendation_tier,
        "tier_label": TIER_LABELS.get(pub.recommendation_tier or 7, ""),
        "tier_color": TIER_COLORS.get(pub.recommendation_tier or 7, ""),
        "viability_score": pub.viability_score,
        "validated_hits": pub.validated_hits,
        "total_attempts": pub.total_attempts,
        "success_rate": pub.success_rate,
        "created_at": pub.created_at.isoformat(),
    }


def _dist_to_dict(dist: Distributor) -> dict[str, Any]:
    return {
        "id": str(dist.id), "name": dist.name, "slug": dist.slug,
        "website": dist.website, "description": dist.description,
        "created_at": dist.created_at.isoformat(),
    }
