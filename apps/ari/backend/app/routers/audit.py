"""API router for the full audit pipeline.

SSE streaming endpoint that runs:
Domain → Discovery → Brand Profiling → Prompt Matrix → Multi-Model Analysis →
4-Factor Scoring → Anti-Pattern Detection → Report Composition → PDF Generation

Supports 7-day caching and entity auto-linking via human_os.entities.
"""

import asyncio
import json
import logging
import tempfile
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from app.models.audit import (
    AuditReport,
    AuditRun,
    AuditRunStatus,
    BrandProfile,
)
from app.models.lite_report import DiscoveryResult

logger = logging.getLogger(__name__)

router = APIRouter()

# Disk-based PDF cache
_PDF_DIR = Path(tempfile.gettempdir()) / "ari-audit-reports"
_PDF_DIR.mkdir(exist_ok=True)
_CACHE_TTL = 86400  # 24 hours


class AuditAnalyzeRequest(BaseModel):
    """Request body for the audit analyze endpoint."""

    domain: str
    brand_profile_override: dict | None = None
    lite_discovery: DiscoveryResult | None = None
    force_rerun: bool = False


class ProfileOnlyRequest(BaseModel):
    """Request body for profile-only endpoint."""

    domain: str


def _sse_event(data: dict[str, Any]) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(data)}\n\n"


def _prune_cache() -> None:
    """Remove expired PDF files from the disk cache."""
    now = time.time()
    try:
        for f in _PDF_DIR.iterdir():
            if f.suffix == ".pdf" and (now - f.stat().st_mtime) > _CACHE_TTL:
                f.unlink(missing_ok=True)
    except Exception:
        pass


@router.post("/audit/analyze")
async def analyze(request: AuditAnalyzeRequest):
    """SSE streaming endpoint for the full audit pipeline.

    Phases: validating → discovering → profiling → generating_matrix →
    analyzing (per-prompt) → scoring → detecting_patterns →
    composing_report (per-section) → generating_pdf → completed
    """

    async def generate():
        job_id = str(uuid.uuid4())
        queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()
        cost_tracker = {"total": 0.0}

        try:
            # Clean domain
            clean_domain = request.domain.strip().lower()
            for prefix in ("http://", "https://"):
                if clean_domain.startswith(prefix):
                    clean_domain = clean_domain[len(prefix):]
            clean_domain = clean_domain.rstrip("/")

            # Check 7-day cache (unless force_rerun)
            if not request.force_rerun:
                from app.storage.supabase_audit import get_cached_run

                cached = await get_cached_run(clean_domain)
                if cached and cached.brand_profile and cached.report:
                    yield _sse_event({"type": "status", "status": "cached", "message": "Found recent audit — loading cached results..."})
                    yield _sse_event({"type": "profile_complete", "data": cached.brand_profile.model_dump()})
                    if cached.analysis_result:
                        yield _sse_event({"type": "scoring_complete", "data": {
                            "overall_ari": cached.analysis_result.overall_ari,
                            "severity_band": cached.analysis_result.severity_band.value,
                            "mention_frequency": cached.analysis_result.mention_frequency,
                            "position_quality": cached.analysis_result.position_quality,
                            "narrative_accuracy": cached.analysis_result.narrative_accuracy,
                            "founder_retrieval": cached.analysis_result.founder_retrieval,
                        }})
                    yield _sse_event({"type": "anti_patterns_complete", "data": [ap.model_dump() for ap in cached.anti_patterns]})
                    if cached.report:
                        yield _sse_event({"type": "report_complete", "data": cached.report.model_dump()})
                    if cached.pdf_url:
                        yield _sse_event({"type": "pdf_ready", "job_id": str(cached.id), "status": "completed"})
                    else:
                        yield _sse_event({"type": "pdf_ready", "job_id": job_id, "status": "completed"})
                    return

            # Phase 0: Domain validation
            yield _sse_event({"type": "status", "status": "validating", "message": f"Connecting to {clean_domain}..."})

            from app.services import discovery_service

            # Check for cached lite snapshot to reuse discovery data
            lite_discovery = request.lite_discovery
            if not lite_discovery:
                try:
                    from app.storage.supabase_lite_report import get_cached_snapshot
                    cached_snapshot = await get_cached_snapshot(clean_domain)
                    if cached_snapshot and cached_snapshot.get("discovery"):
                        lite_discovery = DiscoveryResult(**cached_snapshot["discovery"])
                        logger.info(f"Reusing cached lite discovery for {clean_domain}")
                except Exception as e:
                    logger.debug(f"Lite snapshot cache check skipped: {e}")

            resolved_domain = clean_domain
            if not lite_discovery:
                try:
                    domain_info = await discovery_service.quick_validate(clean_domain)
                    resolved_domain = domain_info["domain"]
                    yield _sse_event({"type": "domain_validated", "data": domain_info})
                except Exception as e:
                    yield _sse_event({"type": "error", "status": "failed", "message": f"Could not connect to {clean_domain}. {e}"})
                    return

            # Phase 1: Discovery
            yield _sse_event({"type": "status", "status": "discovering", "message": "Analyzing website and identifying competitors..."})

            if lite_discovery:
                discovery = lite_discovery
            else:
                discovery = await discovery_service.discover(resolved_domain)

            yield _sse_event({"type": "discovery_complete", "data": discovery.model_dump()})

            # Phase 2: Deep Brand Profiling
            yield _sse_event({"type": "status", "status": "profiling", "message": "Building deep brand profile..."})

            from app.services.brand_profiler import deep_profile

            if request.brand_profile_override:
                profile = BrandProfile(**request.brand_profile_override)
            else:
                profile = await deep_profile(discovery)

            yield _sse_event({"type": "profile_complete", "data": profile.model_dump()})

            # Phase 3: Generate Prompt Matrix
            yield _sse_event({"type": "status", "status": "generating_matrix", "message": f"Generating 8-dimension prompt matrix..."})

            from app.services.audit_prompt_generator import generate_audit_matrix

            prompts = generate_audit_matrix(profile)

            yield _sse_event({"type": "matrix_complete", "data": {
                "total_prompts": len(prompts),
                "dimensions": list(set(p.dimension.value for p in prompts)),
            }})

            # Phase 4: Multi-Provider Analysis with streaming progress
            yield _sse_event({"type": "status", "status": "analyzing", "message": f"Running {len(prompts)} prompts across multiple AI models..."})

            from app.services.audit_runner import run_audit

            analysis_results = None
            analysis_error = None

            async def run_analysis_task():
                nonlocal analysis_results, analysis_error
                try:
                    def on_progress(evt: dict):
                        queue.put_nowait(evt)

                    analysis_results = await run_audit(profile, prompts, on_progress)
                except Exception as e:
                    analysis_error = e
                finally:
                    queue.put_nowait(None)

            task = asyncio.create_task(run_analysis_task())

            while True:
                evt = await queue.get()
                if evt is None:
                    break
                yield _sse_event(evt)

            await task

            if analysis_error:
                raise analysis_error
            if not analysis_results:
                raise RuntimeError("Analysis returned no results")

            results = analysis_results

            yield _sse_event({"type": "analysis_complete", "data": {
                "total_results": len(results),
                "mentions": sum(1 for r in results if r.brand_mentioned),
            }})

            # Phase 5: 4-Factor Scoring
            yield _sse_event({"type": "status", "status": "scoring", "message": "Calculating 4-factor ARI score..."})

            from app.services.audit_scoring import AuditScoringEngine

            scorer = AuditScoringEngine()
            analysis = await scorer.calculate_audit_score(results, profile)

            yield _sse_event({"type": "scoring_complete", "data": {
                "overall_ari": analysis.overall_ari,
                "severity_band": analysis.severity_band.value,
                "mention_frequency": analysis.mention_frequency,
                "position_quality": analysis.position_quality,
                "narrative_accuracy": analysis.narrative_accuracy,
                "founder_retrieval": analysis.founder_retrieval,
            }})

            # Phase 6: Anti-Pattern Detection
            yield _sse_event({"type": "status", "status": "detecting_patterns", "message": "Detecting anti-patterns and analyzing gaps..."})

            from app.services.anti_pattern_detector import AntiPatternDetector

            detector = AntiPatternDetector()
            anti_patterns, gaps = detector.detect(profile, analysis, results)

            yield _sse_event({"type": "anti_patterns_complete", "data": {
                "anti_patterns": [ap.model_dump() for ap in anti_patterns],
                "gaps": [g.model_dump() for g in gaps[:8]],
            }})

            # Phase 7: Report Composition (streaming per-section)
            yield _sse_event({"type": "status", "status": "composing_report", "message": "Composing consultant-quality report..."})

            from app.services.audit_report_composer import AuditReportComposer

            composer = AuditReportComposer()

            def on_report_progress(evt: dict):
                queue.put_nowait(evt)

            # Run report composition with progress
            report_result = None
            report_error = None

            async def run_report_task():
                nonlocal report_result, report_error
                try:
                    report_result = await composer.compose(
                        profile, analysis, anti_patterns, gaps, on_report_progress
                    )
                except Exception as e:
                    report_error = e
                finally:
                    queue.put_nowait(None)

            report_task = asyncio.create_task(run_report_task())

            while True:
                evt = await queue.get()
                if evt is None:
                    break
                yield _sse_event(evt)

            await report_task

            if report_error:
                raise report_error

            report = report_result

            yield _sse_event({"type": "report_complete", "data": report.model_dump()})

            # Phase 8: PDF Generation
            yield _sse_event({"type": "status", "status": "generating_pdf", "message": "Generating PDF report..."})

            pdf_bytes = _generate_audit_pdf(profile, analysis, anti_patterns, gaps, report)

            _prune_cache()
            pdf_path = _PDF_DIR / f"{job_id}.pdf"
            pdf_path.write_bytes(pdf_bytes)

            # Save to Supabase (fire and forget)
            # Company linking + snapshot cross-pollination handled inside save_audit_run()
            try:
                from app.storage.supabase_audit import save_audit_run

                run = AuditRun(
                    id=job_id,
                    domain=clean_domain,
                    company_name=profile.company_name,
                    status=AuditRunStatus.COMPLETED,
                    brand_profile=profile,
                    analysis_result=analysis,
                    anti_patterns=anti_patterns,
                    gap_analysis=gaps,
                    report=report,
                    overall_score=analysis.overall_ari,
                    severity_band=analysis.severity_band,
                    cost_usd=analysis.estimated_cost_usd,
                    completed_at=datetime.utcnow(),
                )
                await save_audit_run(run)
            except Exception as e:
                logger.debug(f"Supabase save skipped: {e}")

            yield _sse_event({
                "type": "pdf_ready",
                "job_id": job_id,
                "status": "completed",
            })

        except Exception as e:
            logger.exception(f"Audit pipeline failed: {e}")
            yield _sse_event({
                "type": "error",
                "status": "failed",
                "message": str(e),
            })

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/audit/profile-only")
async def profile_only(request: ProfileOnlyRequest):
    """Run just brand profiling and return editable BrandProfile."""
    from app.services import discovery_service
    from app.services.brand_profiler import deep_profile

    try:
        discovery = await discovery_service.discover(request.domain)
        profile = await deep_profile(discovery)
        return profile.model_dump()
    except Exception as e:
        logger.exception(f"Profile failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit/download/{job_id}")
async def download_pdf(job_id: str):
    """Download a generated audit PDF by job ID."""
    _prune_cache()

    pdf_path = _PDF_DIR / f"{job_id}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Report not found or expired")

    pdf_bytes = pdf_path.read_bytes()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ai-visibility-audit-{job_id[:8]}.pdf"',
        },
    )


@router.get("/audit/runs")
async def list_runs(domain: str | None = None, limit: int = 20):
    """List audit runs with optional domain filter."""
    from app.storage.supabase_audit import list_audit_runs

    runs = await list_audit_runs(domain=domain, limit=limit)
    return {"runs": runs}


@router.get("/audit/runs/{run_id}")
async def get_run(run_id: str):
    """Get full audit results for a specific run."""
    from app.storage.supabase_audit import get_audit_run

    run = await get_audit_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Audit run not found")
    return run.model_dump()


def _generate_audit_pdf(profile, analysis, anti_patterns, gaps, report) -> bytes:
    """Generate the branded audit PDF from all audit data.

    Uses fpdf2 (pure Python) — works on Vercel serverless without system libs.
    """
    from app.services.pdf.audit_report_pdf import generate

    return generate(profile, analysis, anti_patterns, gaps, report)
