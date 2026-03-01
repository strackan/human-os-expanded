"""Supabase persistence layer for audit runs.

Stores audit results in the `fancyrobot` schema within GFT's Supabase instance.
Provides 7-day caching, automatic entity linking via human_os.entities,
and cross-pollination (upserts snapshot_runs so future snapshot requests
benefit from audit's deeper profiling).
"""

import logging
from datetime import datetime, timedelta
from typing import Any

from app.config import get_settings
from app.models.audit import AuditRun, AuditRunStatus
from app.storage.supabase_entities import find_or_create_entity, update_entity_ari_score
from app.services.event_emitter import emit_score_event

logger = logging.getLogger(__name__)


def _get_client():
    """Get Supabase client, or None if not configured."""
    settings = get_settings()
    if not settings.has_supabase():
        return None
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_key)


async def save_audit_run(run: AuditRun) -> bool:
    """Save or update an audit run record.

    Automatically links to a human_os entity (auto-creates if needed).
    After saving, upserts a snapshot_runs row so future snapshot lookups
    get the enriched data without re-running.

    Returns True on success, False if Supabase is not configured.
    """
    client = _get_client()
    if not client:
        logger.debug("Supabase not configured; skipping audit run save")
        return False

    # Link to human_os entity
    industry = None
    if run.brand_profile:
        industry = run.brand_profile.industry or None
    entity_id = await find_or_create_entity(
        run.domain, run.company_name, industry=industry
    )

    row = {
        "id": str(run.id),
        "domain": run.domain,
        "company_name": run.company_name,
        "entity_id": entity_id,
        "status": run.status.value,
        "report_type": run.report_type,
        "brand_profile": run.brand_profile.model_dump() if run.brand_profile else None,
        "analysis_result": run.analysis_result.model_dump() if run.analysis_result else None,
        "anti_patterns": [ap.model_dump() for ap in run.anti_patterns],
        "gap_analysis": [ga.model_dump() for ga in run.gap_analysis],
        "report_sections": run.report.model_dump() if run.report else None,
        "pdf_url": run.pdf_url or None,
        "overall_score": run.overall_score,
        "severity_band": run.severity_band.value,
        "cost_usd": run.cost_usd,
        "created_at": run.created_at.isoformat(),
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
    }

    try:
        client.schema("fancyrobot").table("audit_runs").upsert(row).execute()
        logger.info(f"Saved audit run for {run.domain} (entity_id={entity_id})")

        # Write ARI score to entity metadata
        if entity_id and run.overall_score is not None:
            await update_entity_ari_score(
                entity_id=entity_id,
                overall_score=run.overall_score,
                mention_rate=0.0,  # audit doesn't track mention_rate directly
                run_id=str(run.id),
            )
            await emit_score_event(
                entity_id=entity_id,
                domain=run.domain,
                overall_score=run.overall_score,
                mention_rate=0.0,
                total_prompts=0,
                source="audit",
                run_id=str(run.id),
            )

        # Cross-pollinate: upsert snapshot_runs with audit's discovery data
        # so future snapshot requests benefit from the deeper profiling
        if run.brand_profile:
            _upsert_snapshot_from_audit(client, run, entity_id)

        return True
    except Exception as e:
        logger.warning(f"Failed to save audit run: {e}")
        return False


def _upsert_snapshot_from_audit(client, run: AuditRun, entity_id: str | None) -> None:
    """Create/update a snapshot_runs row from audit data for cross-pollination."""
    try:
        profile = run.brand_profile
        discovery = {
            "company_name": profile.company_name,
            "domain": profile.domain,
            "industry": profile.industry,
            "description": profile.description,
            "entity_type": profile.entity_type,
            "competitors": [c.model_dump() for c in profile.competitors],
            "personas": profile.personas,
            "topics": profile.topics,
            "differentiators": profile.differentiators,
        }

        analysis = run.analysis_result.model_dump() if run.analysis_result else {}

        snap_row = {
            "domain": run.domain,
            "company_name": run.company_name,
            "entity_id": entity_id,
            "discovery": discovery,
            "analysis": analysis,
        }

        # Check if a snapshot already exists for this domain
        existing = (
            client.schema("fancyrobot")
            .table("snapshot_runs")
            .select("id")
            .eq("domain", run.domain)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if existing.data:
            # Update existing snapshot with enriched data
            client.schema("fancyrobot").table("snapshot_runs").update(snap_row).eq(
                "id", existing.data[0]["id"]
            ).execute()
        else:
            # Insert new snapshot
            client.schema("fancyrobot").table("snapshot_runs").insert(snap_row).execute()

        logger.info(f"Cross-pollinated snapshot_runs for {run.domain}")
    except Exception as e:
        logger.debug(f"Snapshot cross-pollination skipped: {e}")


async def save_prompt_results(
    run_id: str, results: list[dict[str, Any]]
) -> bool:
    """Bulk insert prompt-level results for an audit run.

    Returns True on success, False if Supabase is not configured.
    """
    client = _get_client()
    if not client:
        return False

    rows = []
    for r in results:
        rows.append({
            "audit_run_id": run_id,
            "prompt_text": r.get("prompt_text", ""),
            "dimension": r.get("dimension", ""),
            "persona": r.get("persona", ""),
            "topic": r.get("topic", ""),
            "provider": r.get("provider", ""),
            "model_version": r.get("model_version", ""),
            "raw_response": r.get("raw_response", "")[:10000],
            "brand_mentioned": r.get("brand_mentioned", False),
            "position": r.get("position"),
            "recommendation_type": r.get("recommendation_type", "not_mentioned"),
            "sentiment": r.get("sentiment", "neutral"),
            "confidence": r.get("confidence", 0.0),
            "latency_ms": r.get("latency_ms", 0),
            "tokens_used": r.get("tokens_used"),
        })

    try:
        for i in range(0, len(rows), 50):
            batch = rows[i : i + 50]
            client.schema("fancyrobot").table("audit_prompt_results").insert(batch).execute()
        return True
    except Exception as e:
        logger.warning(f"Failed to save prompt results: {e}")
        return False


async def get_cached_run(domain: str, max_age_days: int = 7) -> AuditRun | None:
    """Look up a recent completed audit run for this domain.

    Returns None if no cached run exists or Supabase is not configured.
    """
    client = _get_client()
    if not client:
        return None

    cutoff = (datetime.utcnow() - timedelta(days=max_age_days)).isoformat()

    try:
        result = (
            client.schema("fancyrobot")
            .table("audit_runs")
            .select("*")
            .eq("domain", domain)
            .eq("status", "completed")
            .gte("created_at", cutoff)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            return None

        row = result.data[0]
        return _row_to_audit_run(row)
    except Exception as e:
        logger.warning(f"Cache lookup failed: {e}")
        return None


async def get_audit_run(run_id: str) -> AuditRun | None:
    """Get a specific audit run by ID."""
    client = _get_client()
    if not client:
        return None

    try:
        result = (
            client.schema("fancyrobot")
            .table("audit_runs")
            .select("*")
            .eq("id", run_id)
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return _row_to_audit_run(result.data[0])
    except Exception as e:
        logger.warning(f"Failed to get audit run: {e}")
        return None


async def list_audit_runs(
    domain: str | None = None, limit: int = 20
) -> list[dict[str, Any]]:
    """List audit runs with optional domain filter. Returns summary dicts."""
    client = _get_client()
    if not client:
        return []

    try:
        query = client.schema("fancyrobot").table("audit_runs").select(
            "id, domain, company_name, status, overall_score, severity_band, created_at, completed_at"
        )
        if domain:
            query = query.eq("domain", domain)
        result = query.order("created_at", desc=True).limit(limit).execute()
        return result.data or []
    except Exception as e:
        logger.warning(f"Failed to list audit runs: {e}")
        return []


def _row_to_audit_run(row: dict[str, Any]) -> AuditRun:
    """Convert a Supabase row to an AuditRun model."""
    from app.models.audit import (
        AuditAnalysisResult,
        AuditReport,
        BrandProfile,
        DetectedAntiPattern,
        GapAnalysis,
        get_severity_band,
    )

    brand_profile = None
    if row.get("brand_profile"):
        brand_profile = BrandProfile(**row["brand_profile"])

    analysis_result = None
    if row.get("analysis_result"):
        analysis_result = AuditAnalysisResult(**row["analysis_result"])

    anti_patterns = []
    if row.get("anti_patterns"):
        anti_patterns = [DetectedAntiPattern(**ap) for ap in row["anti_patterns"]]

    gap_analysis = []
    if row.get("gap_analysis"):
        gap_analysis = [GapAnalysis(**ga) for ga in row["gap_analysis"]]

    report = None
    if row.get("report_sections"):
        report = AuditReport(**row["report_sections"])

    score = row.get("overall_score", 0.0) or 0.0

    return AuditRun(
        id=row["id"],
        domain=row["domain"],
        company_name=row.get("company_name", ""),
        status=AuditRunStatus(row.get("status", "completed")),
        report_type=row.get("report_type", "full_audit"),
        brand_profile=brand_profile,
        analysis_result=analysis_result,
        anti_patterns=anti_patterns,
        gap_analysis=gap_analysis,
        report=report,
        pdf_url=row.get("pdf_url", ""),
        overall_score=score,
        severity_band=get_severity_band(score),
        cost_usd=row.get("cost_usd", 0.0) or 0.0,
        created_at=datetime.fromisoformat(row["created_at"]) if row.get("created_at") else datetime.utcnow(),
        completed_at=datetime.fromisoformat(row["completed_at"]) if row.get("completed_at") else None,
        gft_company_id=row.get("entity_id"),
    )
