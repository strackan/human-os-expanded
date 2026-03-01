"""Shared utility for linking ARI data to human_os.entities.

Used by both snapshot and audit save paths to find or create
an entity record keyed by domain. Replaces the old supabase_companies
module that wrote to gft.companies (which failed due to RLS).
"""

import logging
import re
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)


def _get_client():
    """Get Supabase client, or None if not configured."""
    settings = get_settings()
    if not settings.has_supabase():
        return None
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_key)


def _clean_domain(domain: str) -> str:
    """Strip www. prefix for matching."""
    return re.sub(r"^www\.", "", domain.strip().lower())


def _domain_to_slug(domain: str) -> str:
    """Convert a domain to a URL-safe slug (e.g. 'acme.com' → 'company-acme-com')."""
    clean = _clean_domain(domain)
    return "company-" + re.sub(r"[^a-z0-9]+", "-", clean).strip("-")


async def find_or_create_entity(
    domain: str,
    name: str,
    entity_type: str = "company",
    industry: str | None = None,
) -> str | None:
    """Match a domain to a human_os entity, creating one if needed.

    Returns entity UUID string, or None if Supabase is unavailable.
    """
    client = _get_client()
    if not client:
        return None

    clean = _clean_domain(domain)

    try:
        # Search human_os.entities by domain
        result = (
            client.schema("human_os").table("entities")
            .select("id")
            .ilike("domain", f"%{clean}%")
            .limit(1)
            .execute()
        )

        if result.data:
            return result.data[0]["id"]

        # Not found — create a new entity
        slug = _domain_to_slug(domain)
        metadata: dict[str, Any] = {"source": "fancy_robot"}
        if industry:
            metadata["industry"] = industry

        row: dict[str, Any] = {
            "entity_type": entity_type,
            "slug": slug,
            "canonical_name": name,
            "domain": clean,
            "metadata": metadata,
        }

        insert_result = (
            client.schema("human_os").table("entities")
            .insert(row)
            .execute()
        )

        if insert_result.data:
            entity_id = insert_result.data[0]["id"]
            logger.info(f"Created entity for {clean}: {entity_id}")
            return entity_id

        return None
    except Exception as e:
        logger.warning(f"Entity find_or_create failed for {clean}: {e}")
        return None
