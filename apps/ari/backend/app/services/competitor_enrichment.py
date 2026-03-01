"""Competitor enrichment via Brave Answers + domain resolution + Supabase caching."""

import json
import logging
import re
from datetime import datetime, timezone, timedelta

import httpx

from app.config import get_settings
from app.models.lite_report import CompetitorInfo, DiscoveryResult

logger = logging.getLogger(__name__)

# Cache TTL: 30 days
_CACHE_TTL_DAYS = 30


def _get_supabase_client():
    """Get a Supabase client (sync)."""
    settings = get_settings()
    if not settings.has_supabase():
        return None
    try:
        from supabase import create_client
        return create_client(settings.supabase_url, settings.supabase_key)
    except Exception:
        return None


async def _load_cached_competitors(domain: str) -> list[CompetitorInfo] | None:
    """Check snapshot_competitors cache. Returns list if fresh cache exists, else None."""
    sb = _get_supabase_client()
    if not sb:
        return None

    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=_CACHE_TTL_DAYS)).isoformat()
        result = (
            sb.schema("fancyrobot").table("snapshot_competitors")
            .select("competitors")
            .eq("domain", domain.lower())
            .gte("enriched_at", cutoff)
            .order("enriched_at", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            cached = result.data[0]["competitors"]
            if isinstance(cached, str):
                cached = json.loads(cached)
            return [CompetitorInfo(**c) for c in cached]
    except Exception as e:
        logger.debug(f"Competitor cache lookup failed (non-fatal): {e}")

    return None


async def _save_cached_competitors(domain: str, company_name: str, industry: str, competitors: list[CompetitorInfo]):
    """Write enriched competitor list to snapshot_competitors cache + create entities."""
    sb = _get_supabase_client()
    if not sb:
        return

    try:
        sb.schema("fancyrobot").table("snapshot_competitors").upsert({
            "domain": domain.lower(),
            "company_name": company_name,
            "industry": industry,
            "competitors": [c.model_dump() for c in competitors],
        }, on_conflict="domain").execute()
    except Exception as e:
        logger.debug(f"Competitor cache write failed (non-fatal): {e}")

    # Create human_os entities for competitors that have domains
    try:
        from app.storage.supabase_entities import find_or_create_entity
        for comp in competitors:
            if comp.domain:
                await find_or_create_entity(
                    domain=comp.domain,
                    name=comp.name,
                    entity_type="company",
                    industry=industry,
                )
    except Exception as e:
        logger.debug(f"Competitor entity creation failed (non-fatal): {e}")


async def _brave_answers_competitors(company_name: str, domain: str, industry: str) -> list[dict]:
    """Call Brave Answers chat/completions to get competitor names with context.

    Returns list of dicts: [{"name": "...", "reason": "..."}, ...]
    """
    settings = get_settings()
    if not settings.has_brave_answers():
        return []

    prompt = (
        f"Who are the top 5 direct competitors to {company_name} ({domain}) "
        f"in the {industry} industry? "
        f"For each competitor, give the company name and their primary website domain. "
        f"Format each as: CompanyName (domain.com)"
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.search.brave.com/res/v1/chat/completions",
                json={
                    "model": "brave",
                    "stream": False,
                    "messages": [{"role": "user", "content": prompt}],
                },
                headers={
                    "X-Subscription-Token": settings.brave_answers_api_key,
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        choices = data.get("choices", [])
        if not choices:
            return []

        text = choices[0].get("message", {}).get("content", "")
        parsed = _parse_competitors_from_answer(text)

        # Filter out the target company itself
        target_domain = domain.lower().removeprefix("www.")
        target_name = company_name.lower()
        return [
            c for c in parsed
            if c["name"].lower() != target_name
            and c.get("domain", "").lower() != target_domain
        ][:5]
    except Exception as e:
        logger.warning(f"Brave Answers competitor query failed: {e}")
        return []


def _parse_competitors_from_answer(text: str) -> list[dict]:
    """Parse competitor names and domains from Brave Answers prose.

    Handles formats like:
    - "1. **Nike** (nike.com) - description"
    - "1. ClickUp (clickup.com)"
    - "- CompanyName (domain.com) -- explanation"
    """
    competitors = []

    # Strip citation/entity/usage tags from Brave Answers
    text = re.sub(r"<citation>.*?</citation>", "", text)
    text = re.sub(r"<enum_item>.*?</enum_item>", "", text)
    text = re.sub(r"<usage>.*?</usage>", "", text)

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue

        # Must start with a number, bullet, or dash
        m = re.match(r"^(?:\d+[\.\)]\s*|[-*]\s+)", line)
        if not m:
            continue

        rest = line[m.end():].strip()

        # Strip optional bold markers
        rest = re.sub(r"\*\*(.+?)\*\*", r"\1", rest)

        # Try to extract "Name (domain.com)" or "Name (domain.com) - description"
        domain_match = re.match(
            r"^(.+?)\s*\(([a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,})\)\s*",
            rest,
        )
        if domain_match:
            name = domain_match.group(1).strip()
            domain = domain_match.group(2).lower().strip()
            if domain.startswith("www."):
                domain = domain[4:]
        else:
            # No domain in parens — take the name up to first separator
            name = re.split(r"\s*[-–—:]\s", rest, maxsplit=1)[0].strip()
            domain = ""

        if name and 1 < len(name) < 80:
            competitors.append({"name": name, "domain": domain})

    return competitors[:5]


async def _sonnet_validate_competitors(
    company_name: str,
    domain: str,
    industry: str,
    competitors: list[CompetitorInfo],
) -> list[CompetitorInfo]:
    """Ask Claude Sonnet to sanity-check the competitor list.

    Sonnet reviews the merged list and removes any that seem out of place,
    optionally replacing them with better fits. Only modifies the list if
    it has ≥80% confidence in its changes.

    Returns the validated (possibly reordered/replaced) list, or the
    original list if validation fails or Anthropic is unavailable.
    """
    settings = get_settings()
    if not settings.has_anthropic():
        return competitors

    if not competitors:
        return competitors

    comp_list = "\n".join(f"{i+1}. {c.name}" for i, c in enumerate(competitors))

    prompt = (
        f"Here is a list of supposed competitors to {company_name} ({domain}) "
        f"in the {industry} industry:\n\n{comp_list}\n\n"
        f"Are there any that seem out of place? If so, what would you replace "
        f"them with? List your answer in the form of a new ranked list of "
        f"company names, one per line, numbered 1-{len(competitors)}. "
        f"No other details or explanation. Only change the list if you are "
        f"80% confident or more that a change is needed."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": prompt}],
                },
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                text += block.get("text", "")

        if not text.strip():
            return competitors

        # Parse the numbered list
        validated = _parse_validated_list(text, competitors)
        if validated:
            logger.info(
                f"Sonnet validated competitors for {domain}: "
                f"{[c.name for c in validated]}"
            )
            return validated

        return competitors
    except Exception as e:
        logger.warning(f"Sonnet competitor validation failed (non-fatal): {e}")
        return competitors


def _parse_validated_list(
    text: str, original: list[CompetitorInfo]
) -> list[CompetitorInfo]:
    """Parse Sonnet's numbered list response back into CompetitorInfo objects.

    Preserves domain info from the original list when a name matches;
    new names get an empty domain (resolved later or left blank).
    """
    # Build lookup of original competitors by lowercase name
    original_by_name = {c.name.lower(): c for c in original}

    parsed: list[CompetitorInfo] = []
    for line in text.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        # Match "1. CompanyName" or "1) CompanyName" or just "CompanyName"
        m = re.match(r"^(?:\d+[\.\)]\s*)", line)
        name = line[m.end():].strip() if m else line.strip()
        # Strip any trailing punctuation or parenthetical
        name = re.sub(r"\s*\(.*?\)\s*$", "", name).strip()
        if not name or len(name) < 2 or len(name) > 80:
            continue
        # Reuse domain from original if same company
        existing = original_by_name.get(name.lower())
        if existing:
            parsed.append(existing)
        else:
            parsed.append(CompetitorInfo(name=name, domain=""))

    return parsed[:5] if parsed else []


async def _resolve_domains(competitors: list[dict]) -> list[dict]:
    """For competitors missing domains, try Brave Search to find their official site."""
    settings = get_settings()
    if not settings.has_brave():
        return competitors

    needs_resolution = [c for c in competitors if not c.get("domain")]
    if not needs_resolution:
        return competitors

    from app.services.domain_search import brave_search, _extract_brand_domain

    for comp in needs_resolution:
        try:
            results = await brave_search(f"{comp['name']} official site", count=3)
            for r in results:
                domain = _extract_brand_domain(r.get("url", ""))
                if domain:
                    comp["domain"] = domain
                    break
        except Exception as e:
            logger.debug(f"Domain resolution for {comp['name']} failed: {e}")

    return competitors


async def enrich_competitors(discovery: DiscoveryResult) -> DiscoveryResult:
    """Enrich competitor list using Brave Answers + Sonnet validation + caching.

    Pipeline:
    1. Check snapshot_competitors cache (30-day TTL)
    2. If miss → call Brave Answers for competitor names + domains
    3. Resolve any missing domains via Brave Search
    4. Merge with LLM-extracted competitors (deduplicate)
    5. Sonnet validation — sanity-check the list, swap out-of-place entries
    6. Resolve domains for any new competitors Sonnet introduced
    7. Cache the final list
    """
    # 1. Check cache
    cached = await _load_cached_competitors(discovery.domain)
    if cached:
        logger.info(f"Using cached competitors for {discovery.domain} ({len(cached)} entries)")
        discovery.competitors = cached
        return discovery

    # 2. Query Brave Answers
    brave_competitors = await _brave_answers_competitors(
        company_name=discovery.company_name,
        domain=discovery.domain,
        industry=discovery.industry,
    )

    if not brave_competitors:
        # No Brave data — keep LLM competitors as-is, still cache them
        await _save_cached_competitors(
            discovery.domain, discovery.company_name, discovery.industry, discovery.competitors
        )
        return discovery

    # 3. Resolve missing domains
    brave_competitors = await _resolve_domains(brave_competitors)

    # 4. Merge: Brave Answers first (higher quality), then fill from LLM extraction
    merged: list[CompetitorInfo] = []
    seen_names: set[str] = set()

    for c in brave_competitors:
        name_lower = c["name"].lower()
        if name_lower not in seen_names:
            seen_names.add(name_lower)
            merged.append(CompetitorInfo(name=c["name"], domain=c.get("domain", "")))

    # Backfill from LLM-extracted competitors if Brave returned fewer than 5
    for c in discovery.competitors:
        if len(merged) >= 5:
            break
        if c.name.lower() not in seen_names:
            seen_names.add(c.name.lower())
            merged.append(c)

    discovery.competitors = merged[:5]

    # 5. Sonnet validation — sanity-check the merged list
    discovery.competitors = await _sonnet_validate_competitors(
        company_name=discovery.company_name,
        domain=discovery.domain,
        industry=discovery.industry,
        competitors=discovery.competitors,
    )

    # 6. Resolve domains for any new competitors Sonnet introduced
    new_without_domains = [
        {"name": c.name, "domain": c.domain}
        for c in discovery.competitors if not c.domain
    ]
    if new_without_domains:
        resolved = await _resolve_domains(new_without_domains)
        domain_map = {r["name"]: r.get("domain", "") for r in resolved}
        for c in discovery.competitors:
            if not c.domain and domain_map.get(c.name):
                c.domain = domain_map[c.name]

    # 7. Cache
    await _save_cached_competitors(
        discovery.domain, discovery.company_name, discovery.industry, discovery.competitors
    )

    return discovery
