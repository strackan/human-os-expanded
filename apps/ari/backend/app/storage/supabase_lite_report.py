"""Supabase persistence layer for lite snapshot runs.

Stores snapshot results in the `fancyrobot` schema within GFT's Supabase
for 7-day caching. Repeat runs for the same domain return cached results
instantly. Also cross-pollinates with audit data — if an audit ran more
recently, its enriched discovery data is returned for snapshot requests.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import get_settings
from app.storage.supabase_entities import find_or_create_entity

logger = logging.getLogger(__name__)


def _get_client():
    """Get Supabase client, or None if not configured."""
    settings = get_settings()
    if not settings.has_supabase():
        return None
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_key)


async def is_bypass_domain(domain: str) -> bool:
    """Check if domain has full-report bypass enabled."""
    client = _get_client()
    if not client:
        return False
    try:
        result = (
            client.schema("fancyrobot")
            .table("snapshot_bypasses")
            .select("domain")
            .eq("domain", domain)
            .limit(1)
            .execute()
        )
        return bool(result.data)
    except Exception as e:
        logger.warning(f"Bypass check failed: {e}")
        return False


async def validate_promo_code(code: str, domain: str | None = None, check_only: bool = False) -> bool:
    """Validate a promo code for gate bypass.

    Returns True if the code is valid (exists, not expired, under max_uses).
    When check_only=False (default), also increments uses and sends a notification.
    """
    client = _get_client()
    if not client:
        return False
    try:
        normalized = code.strip().upper()
        result = (
            client.schema("fancyrobot")
            .table("promo_codes")
            .select("code, bypass_gate, max_uses, uses, expires_at")
            .eq("code", normalized)
            .eq("bypass_gate", "true")
            .limit(1)
            .execute()
        )
        if not result.data:
            return False

        row = result.data[0]

        # Check expiration
        if row.get("expires_at"):
            expires = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
            if expires < datetime.now(timezone.utc):
                return False

        # Check max uses
        if row.get("max_uses") is not None and row["uses"] >= row["max_uses"]:
            return False

        if check_only:
            return True

        # Increment uses
        client.schema("fancyrobot").table("promo_codes").update(
            {"uses": row["uses"] + 1}
        ).eq("code", normalized).execute()

        logger.info(f"Promo code '{normalized}' redeemed (uses: {row['uses'] + 1})")

        # Notify (fire-and-forget)
        try:
            from app.notifications import notify_promo_redeemed
            await notify_promo_redeemed(normalized, domain=domain)
        except Exception:
            pass  # notification failure should never block redemption

        return True
    except Exception as e:
        logger.warning(f"Promo code validation failed: {e}")
        return False


async def save_snapshot(
    domain: str,
    company_name: str,
    discovery: dict[str, Any],
    analysis: dict[str, Any],
    job_id: str,
) -> bool:
    """Save a completed snapshot run.

    Links to a human_os entity (auto-creates if needed).
    Returns True on success, False if Supabase is not configured or save fails.
    """
    client = _get_client()
    if not client:
        logger.debug("Supabase not configured; skipping snapshot save")
        return False

    # Link to human_os entity
    industry = discovery.get("industry") if isinstance(discovery, dict) else None
    entity_id = await find_or_create_entity(domain, company_name, industry=industry)

    row = {
        "id": job_id,
        "domain": domain,
        "company_name": company_name,
        "entity_id": entity_id,
        "discovery": discovery,
        "analysis": analysis,
    }

    try:
        client.schema("fancyrobot").table("snapshot_runs").upsert(row).execute()
        logger.info(f"Saved snapshot for {domain} (entity_id={entity_id})")
        return True
    except Exception as e:
        logger.warning(f"Failed to save snapshot run: {e}")
        return False


async def get_cached_snapshot(
    domain: str, max_age_days: int = 7
) -> dict[str, Any] | None:
    """Look up a recent snapshot run for this domain.

    Cross-pollinates: if a fresher audit run exists for this domain,
    its discovery data is returned instead (audits have richer profiling).

    Returns dict with 'discovery', 'analysis', 'job_id', 'company_name'
    or None if no cached run exists.
    """
    client = _get_client()
    if not client:
        return None

    cutoff = (datetime.utcnow() - timedelta(days=max_age_days)).isoformat()

    try:
        # Check snapshot_runs first
        snap_result = (
            client.schema("fancyrobot")
            .table("snapshot_runs")
            .select("*")
            .eq("domain", domain)
            .gte("created_at", cutoff)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        # Also check audit_runs for fresher discovery data
        audit_result = (
            client.schema("fancyrobot")
            .table("audit_runs")
            .select("domain, company_name, brand_profile, analysis_result, created_at, id")
            .eq("domain", domain)
            .eq("status", "completed")
            .gte("created_at", cutoff)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        snap_row = snap_result.data[0] if snap_result.data else None
        audit_row = audit_result.data[0] if audit_result.data else None

        # If both exist, use whichever is fresher
        if snap_row and audit_row:
            snap_ts = snap_row.get("created_at", "")
            audit_ts = audit_row.get("created_at", "")
            if audit_ts > snap_ts and audit_row.get("brand_profile"):
                return _audit_row_to_snapshot(audit_row)

        if snap_row:
            return {
                "discovery": snap_row["discovery"],
                "analysis": snap_row["analysis"],
                "job_id": snap_row["id"],
                "company_name": snap_row.get("company_name", ""),
            }

        # No snapshot, but audit has data we can use
        if audit_row and audit_row.get("brand_profile"):
            return _audit_row_to_snapshot(audit_row)

        return None
    except Exception as e:
        logger.warning(f"Snapshot cache lookup failed: {e}")
        return None


def _audit_row_to_snapshot(audit_row: dict[str, Any]) -> dict[str, Any]:
    """Synthesize a snapshot-format cache entry from audit data.

    The audit's brand_profile is a superset of discovery data,
    so we extract the fields that DiscoveryResult expects.
    """
    profile = audit_row.get("brand_profile", {}) or {}

    # Build a discovery-shaped dict from the brand profile
    discovery = {
        "company_name": profile.get("company_name", audit_row.get("company_name", "")),
        "domain": profile.get("domain", audit_row.get("domain", "")),
        "industry": profile.get("industry", ""),
        "description": profile.get("description", ""),
        "entity_type": profile.get("entity_type", "company"),
        "competitors": profile.get("competitors", []),
        "personas": profile.get("personas", []),
        "topics": profile.get("topics", []),
        "differentiators": profile.get("differentiators", []),
    }

    # Use audit's analysis_result as a stand-in for snapshot analysis
    # (the frontend will re-synthesize if fields don't match perfectly)
    analysis = audit_row.get("analysis_result", {}) or {}

    return {
        "discovery": discovery,
        "analysis": analysis,
        "job_id": audit_row.get("id", ""),
        "company_name": discovery["company_name"],
        "source": "audit_cross_pollination",
    }
