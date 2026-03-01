"""Event emitter: writes ARI score events to human_os.interactions.

Enables cross-product triggers (e.g., score-decline alerts for Renubu)
by recording score events as interactions on the entity spine.
"""

import logging
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


async def emit_score_event(
    entity_id: str,
    domain: str,
    overall_score: float,
    mention_rate: float,
    total_prompts: int,
    source: str = "snapshot",
    run_id: str | None = None,
) -> bool:
    """Write an ARI score event as an interaction on the entity spine.

    Args:
        entity_id: UUID of the human_os entity.
        domain: Company domain.
        overall_score: The ARI overall score (0-100).
        mention_rate: Fraction of prompts where brand was mentioned.
        total_prompts: Number of prompts in the analysis.
        source: "snapshot" or "audit".
        run_id: Optional run ID for traceability.

    Returns True on success, False otherwise.
    """
    client = _get_client()
    if not client:
        return False

    metadata: dict[str, Any] = {
        "domain": domain,
        "overall_score": round(overall_score, 1),
        "mention_rate": round(mention_rate, 3),
        "total_prompts": total_prompts,
        "source": source,
    }
    if run_id:
        metadata["run_id"] = run_id

    # Check for previous score to compute delta
    try:
        prev = (
            client.schema("human_os").table("interactions")
            .select("metadata")
            .eq("entity_id", entity_id)
            .eq("source_system", "fancy_robot")
            .eq("interaction_type", "engagement")
            .order("occurred_at", desc=True)
            .limit(1)
            .execute()
        )
        if prev.data:
            prev_score = prev.data[0].get("metadata", {}).get("overall_score")
            if prev_score is not None:
                metadata["previous_score"] = prev_score
                metadata["score_delta"] = round(overall_score - prev_score, 1)
    except Exception:
        pass  # Non-critical — delta is nice-to-have

    row = {
        "entity_id": entity_id,
        "layer": "public",
        "interaction_type": "engagement",
        "title": f"ARI Score: {overall_score:.1f} ({source})",
        "content": f"AI visibility score for {domain}: {overall_score:.1f}/100 "
                   f"(mention rate: {mention_rate:.1%})",
        "sentiment": _score_to_sentiment(overall_score),
        "metadata": metadata,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "source_system": "fancy_robot",
        "source_id": run_id,
    }

    try:
        client.schema("human_os").table("interactions").insert(row).execute()
        logger.info(
            f"Emitted score event for entity {entity_id}: {overall_score:.1f}"
        )
        return True
    except Exception as e:
        logger.warning(f"Failed to emit score event: {e}")
        return False


def _score_to_sentiment(score: float) -> str:
    """Map ARI score to interaction sentiment."""
    if score >= 60:
        return "positive"
    elif score >= 30:
        return "neutral"
    else:
        return "concerned"
