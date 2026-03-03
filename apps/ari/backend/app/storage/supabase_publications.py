"""Supabase persistence layer for publications, distributors, and citations.

Stores data in the `fancyrobot` schema. Follows Pattern B — one `_get_client()`
per module, try/except on every call, graceful degradation (never crashes).
"""

import logging
from typing import Any

from app.config import get_settings
from app.models.publications import (
    ArticlePublication,
    Distributor,
    Publication,
    PublicationCitation,
    PublicationGroup,
)

logger = logging.getLogger(__name__)


def _get_client():
    """Get Supabase client, or None if not configured."""
    settings = get_settings()
    if not settings.has_supabase():
        return None
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_key)


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def _dist_row(dist: Distributor) -> dict[str, Any]:
    return {
        "id": str(dist.id),
        "name": dist.name,
        "slug": dist.slug,
        "website": dist.website,
        "description": dist.description,
        "created_at": dist.created_at.isoformat(),
    }


def _pub_row(pub: Publication) -> dict[str, Any]:
    return {
        "id": str(pub.id),
        "distributor_id": str(pub.distributor_id) if pub.distributor_id else None,
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
        "source_lists": list(pub.source_lists),
        "recommendation_tier": pub.recommendation_tier,
        "metadata": pub.metadata,
        "created_at": pub.created_at.isoformat(),
        "viability_score": pub.viability_score,
        "validated_hits": pub.validated_hits,
        "total_attempts": pub.total_attempts,
        "success_rate": pub.success_rate,
    }


def _citation_row(c: PublicationCitation) -> dict[str, Any]:
    return {
        "id": str(c.id),
        "publication_id": str(c.publication_id),
        "source_url": c.source_url,
        "domain": c.domain,
        "model": c.model,
        "persona": c.persona,
        "question": c.question,
        "topics": list(c.topics),
        "answer_id": c.answer_id,
        "prompt_id": c.prompt_id,
        "created_at": c.created_at.isoformat(),
    }


def _group_row(g: PublicationGroup) -> dict[str, Any]:
    return {
        "id": str(g.id),
        "name": g.name,
        "slug": g.slug,
        "group_type": g.group_type.value,
        "description": g.description,
        "metadata": g.metadata,
        "created_at": g.created_at.isoformat(),
    }


def _article_pub_row(ap: ArticlePublication) -> dict[str, Any]:
    return {
        "id": str(ap.id),
        "article_run_id": str(ap.article_run_id),
        "publication_id": str(ap.publication_id),
        "status": ap.status.value,
        "published_url": ap.published_url,
        "published_at": ap.published_at.isoformat() if ap.published_at else None,
        "created_at": ap.created_at.isoformat(),
    }


# ---------------------------------------------------------------------------
# Write functions
# ---------------------------------------------------------------------------

def upsert_distributor(dist: Distributor) -> bool:
    client = _get_client()
    if not client:
        return False
    try:
        client.schema("fancyrobot").table("distributors").upsert(_dist_row(dist)).execute()
        return True
    except Exception as e:
        logger.warning(f"Failed to upsert distributor {dist.slug}: {e}")
        return False


def upsert_publication(pub: Publication) -> bool:
    client = _get_client()
    if not client:
        return False
    try:
        client.schema("fancyrobot").table("publications").upsert(_pub_row(pub)).execute()
        return True
    except Exception as e:
        logger.warning(f"Failed to upsert publication {pub.domain}: {e}")
        return False


def upsert_publications_batch(pubs: list[Publication]) -> int:
    """Batch upsert publications. Returns count of rows sent."""
    client = _get_client()
    if not client:
        return 0
    persisted = 0
    try:
        rows = [_pub_row(p) for p in pubs]
        for i in range(0, len(rows), 200):
            batch = rows[i : i + 200]
            client.schema("fancyrobot").table("publications").upsert(batch).execute()
            persisted += len(batch)
        return persisted
    except Exception as e:
        logger.warning(f"Failed to batch upsert publications ({persisted}/{len(pubs)}): {e}")
        return persisted


def insert_citations_batch(citations: list[PublicationCitation]) -> int:
    """Batch insert citations. Returns count of rows sent."""
    client = _get_client()
    if not client:
        return 0
    persisted = 0
    try:
        rows = [_citation_row(c) for c in citations]
        for i in range(0, len(rows), 200):
            batch = rows[i : i + 200]
            client.schema("fancyrobot").table("publication_citations").upsert(
                batch, on_conflict="id"
            ).execute()
            persisted += len(batch)
        return persisted
    except Exception as e:
        logger.warning(f"Failed to batch insert citations ({persisted}/{len(citations)}): {e}")
        return persisted


def upsert_group(group: PublicationGroup) -> bool:
    client = _get_client()
    if not client:
        return False
    try:
        client.schema("fancyrobot").table("publication_groups").upsert(_group_row(group)).execute()
        return True
    except Exception as e:
        logger.warning(f"Failed to upsert group {group.slug}: {e}")
        return False


def set_group_members(group_id: str, pub_ids: set[str]) -> bool:
    """Replace group membership. Deletes existing rows, inserts new set."""
    client = _get_client()
    if not client:
        return False
    try:
        # Delete existing members for this group
        client.schema("fancyrobot").table("publication_group_members").delete().eq(
            "group_id", group_id
        ).execute()
        # Insert new members
        if pub_ids:
            rows = [{"group_id": group_id, "publication_id": pid} for pid in pub_ids]
            for i in range(0, len(rows), 200):
                batch = rows[i : i + 200]
                client.schema("fancyrobot").table("publication_group_members").insert(batch).execute()
        return True
    except Exception as e:
        logger.warning(f"Failed to set group members for {group_id}: {e}")
        return False


def upsert_article_publication(ap: ArticlePublication) -> bool:
    client = _get_client()
    if not client:
        return False
    try:
        client.schema("fancyrobot").table("article_publications").upsert(
            _article_pub_row(ap)
        ).execute()
        return True
    except Exception as e:
        logger.warning(f"Failed to upsert article publication: {e}")
        return False


# ---------------------------------------------------------------------------
# Read functions (for loading cache on startup)
# ---------------------------------------------------------------------------

def load_all_distributors() -> list[dict]:
    client = _get_client()
    if not client:
        return []
    try:
        result = client.schema("fancyrobot").table("distributors").select("*").execute()
        return result.data or []
    except Exception as e:
        logger.warning(f"Failed to load distributors: {e}")
        return []


def load_all_publications() -> list[dict]:
    client = _get_client()
    if not client:
        return []
    try:
        # Paginate — table may have thousands of rows
        all_rows: list[dict] = []
        page_size = 1000
        offset = 0
        while True:
            result = (
                client.schema("fancyrobot")
                .table("publications")
                .select("*")
                .range(offset, offset + page_size - 1)
                .execute()
            )
            rows = result.data or []
            all_rows.extend(rows)
            if len(rows) < page_size:
                break
            offset += page_size
        return all_rows
    except Exception as e:
        logger.warning(f"Failed to load publications: {e}")
        return []


def load_all_citations() -> list[dict]:
    client = _get_client()
    if not client:
        return []
    try:
        all_rows: list[dict] = []
        page_size = 1000
        offset = 0
        while True:
            result = (
                client.schema("fancyrobot")
                .table("publication_citations")
                .select("*")
                .range(offset, offset + page_size - 1)
                .execute()
            )
            rows = result.data or []
            all_rows.extend(rows)
            if len(rows) < page_size:
                break
            offset += page_size
        return all_rows
    except Exception as e:
        logger.warning(f"Failed to load citations: {e}")
        return []


def load_all_groups() -> list[dict]:
    client = _get_client()
    if not client:
        return []
    try:
        result = client.schema("fancyrobot").table("publication_groups").select("*").execute()
        return result.data or []
    except Exception as e:
        logger.warning(f"Failed to load groups: {e}")
        return []


def load_all_group_members() -> list[dict]:
    client = _get_client()
    if not client:
        return []
    try:
        all_rows: list[dict] = []
        page_size = 1000
        offset = 0
        while True:
            result = (
                client.schema("fancyrobot")
                .table("publication_group_members")
                .select("*")
                .range(offset, offset + page_size - 1)
                .execute()
            )
            rows = result.data or []
            all_rows.extend(rows)
            if len(rows) < page_size:
                break
            offset += page_size
        return all_rows
    except Exception as e:
        logger.warning(f"Failed to load group members: {e}")
        return []


def load_all_article_publications() -> list[dict]:
    """Load all article_publications rows (paginated)."""
    client = _get_client()
    if not client:
        return []
    try:
        all_rows: list[dict] = []
        page_size = 1000
        offset = 0
        while True:
            result = (
                client.schema("fancyrobot")
                .table("article_publications")
                .select("*")
                .range(offset, offset + page_size - 1)
                .execute()
            )
            rows = result.data or []
            all_rows.extend(rows)
            if len(rows) < page_size:
                break
            offset += page_size
        return all_rows
    except Exception as e:
        logger.warning(f"Failed to load article publications: {e}")
        return []


def update_article_publication_status(
    ap_id: str, status: str, published_url: str, published_at: str | None,
) -> bool:
    """Update an article_publication's status and optional published fields."""
    client = _get_client()
    if not client:
        return False
    try:
        update_data: dict[str, Any] = {
            "status": status,
            "published_url": published_url,
            "updated_at": published_at or None,
        }
        if published_at:
            update_data["published_at"] = published_at
        client.schema("fancyrobot").table("article_publications").update(
            update_data
        ).eq("id", ap_id).execute()
        return True
    except Exception as e:
        logger.warning(f"Failed to update article publication {ap_id}: {e}")
        return False
