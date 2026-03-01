"""Shared utility for linking ARI data to human_os.entities.

Used by both snapshot and audit save paths to find or create
an entity record keyed by domain. Also writes ARI scores back
into entity metadata so other HumanOS products can read them.
"""

import logging
import re
from datetime import datetime, timezone
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


async def update_entity_ari_score(
    entity_id: str,
    overall_score: float,
    mention_rate: float,
    provider_scores: dict[str, float] | None = None,
    run_id: str | None = None,
) -> bool:
    """Merge ARI score data into the entity's metadata under the 'ari' key.

    Reads current metadata, merges the ari namespace, writes back.
    Returns True on success, False if Supabase unavailable or write fails.
    """
    client = _get_client()
    if not client:
        return False

    try:
        # Read current metadata
        result = (
            client.schema("human_os").table("entities")
            .select("metadata")
            .eq("id", entity_id)
            .single()
            .execute()
        )

        current_metadata = result.data.get("metadata") or {} if result.data else {}

        # Build ARI score block
        ari_block: dict[str, Any] = {
            "overall_score": round(overall_score, 1),
            "mention_rate": round(mention_rate, 3),
            "scored_at": datetime.now(timezone.utc).isoformat(),
        }
        if provider_scores:
            ari_block["provider_scores"] = {
                k: round(v, 1) for k, v in provider_scores.items()
            }
        if run_id:
            ari_block["run_id"] = run_id

        # Track previous score for delta
        prev_ari = current_metadata.get("ari", {})
        if prev_ari.get("overall_score") is not None:
            ari_block["previous_score"] = prev_ari["overall_score"]
            ari_block["score_delta"] = round(
                overall_score - prev_ari["overall_score"], 1
            )

        # Merge into metadata
        current_metadata["ari"] = ari_block

        client.schema("human_os").table("entities").update(
            {"metadata": current_metadata}
        ).eq("id", entity_id).execute()

        logger.info(
            f"Updated entity {entity_id} ARI score: {overall_score:.1f}"
        )
        return True
    except Exception as e:
        logger.warning(f"Failed to update entity ARI score: {e}")
        return False


async def get_entity_ari_score(entity_id: str) -> dict[str, Any] | None:
    """Read the ARI score block from an entity's metadata.

    Returns the ari dict or None if not found / not scored.
    """
    client = _get_client()
    if not client:
        return None

    try:
        result = (
            client.schema("human_os").table("entities")
            .select("metadata")
            .eq("id", entity_id)
            .single()
            .execute()
        )
        if result.data:
            metadata = result.data.get("metadata") or {}
            return metadata.get("ari")
        return None
    except Exception as e:
        logger.warning(f"Failed to read entity ARI score: {e}")
        return None


async def get_entity_by_domain(domain: str) -> dict[str, Any] | None:
    """Look up an entity by domain. Returns full entity row or None."""
    client = _get_client()
    if not client:
        return None

    clean = _clean_domain(domain)
    try:
        result = (
            client.schema("human_os").table("entities")
            .select("*")
            .ilike("domain", f"%{clean}%")
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as e:
        logger.warning(f"Entity lookup failed for {clean}: {e}")
        return None
