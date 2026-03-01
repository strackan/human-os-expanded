"""API router for the lite report (AI Visibility Snapshot)."""

import asyncio
import json
import logging
import os
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from app.models.lite_report import DiscoveryResult, LiteAnalysisResult, LiteReportStatus
from app.notifications import notify_report_run
from app.services import discovery_service, lite_analysis_runner, lite_report_generator
from app.storage.supabase_lite_report import get_cached_snapshot, is_bypass_domain, save_snapshot, validate_promo_code

logger = logging.getLogger(__name__)

router = APIRouter()

# Disk-based PDF cache (survives server restarts / --reload)
_PDF_DIR = Path(tempfile.gettempdir()) / "ari-lite-reports"
_PDF_DIR.mkdir(exist_ok=True)
_CACHE_TTL = 3600  # 1 hour


class AnalyzeRequest(BaseModel):
    """Request body for the analyze endpoint."""

    domain: str
    email: str | None = None
    promo_code: str | None = None
    discovery_override: DiscoveryResult | None = None


class DiscoverRequest(BaseModel):
    """Request body for discover-only endpoint."""

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


@router.post("/lite-report/analyze")
async def analyze(request: AnalyzeRequest, raw_request: Request):
    """SSE streaming endpoint that runs the full snapshot pipeline.

    Uses an asyncio.Queue so progress events from the analysis runner
    are streamed to the client in real-time (not batched).
    """
    client_ip = raw_request.headers.get("x-forwarded-for", "").split(",")[0].strip() or raw_request.client.host if raw_request.client else None

    async def generate():
        job_id = str(uuid.uuid4())
        queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

        try:
            # Clean domain
            clean_domain = request.domain.strip().lower()
            for prefix in ("http://", "https://"):
                if clean_domain.startswith(prefix):
                    clean_domain = clean_domain[len(prefix):]
            clean_domain = clean_domain.rstrip("/")

            # Check Supabase cache (skip if discovery_override provided)
            if not request.discovery_override:
                try:
                    cached = await get_cached_snapshot(clean_domain)
                except Exception:
                    cached = None

                if cached:
                    # Use the original job_id so share links resolve
                    job_id = cached["job_id"]
                    yield _sse_event({"type": "cache_hit", "message": "Found recent snapshot — loading cached results..."})

                    # Rebuild models from cached JSON
                    cached_discovery = DiscoveryResult(**cached["discovery"])
                    cached_analysis = LiteAnalysisResult(**cached["analysis"])

                    yield _sse_event({"type": "discovery_complete", "data": cached["discovery"]})

                    # Check bypass for gating
                    bypassed = await is_bypass_domain(clean_domain)
                    if not bypassed and request.promo_code:
                        bypassed = await validate_promo_code(request.promo_code, domain=clean_domain)
                    yield _sse_event({"type": "gate_status", "gated": not bypassed})

                    yield _sse_event({
                        "type": "synthesis_complete",
                        "data": {
                            "report_title": cached_analysis.report_title,
                            "core_finding": cached_analysis.core_finding,
                            "core_finding_detail": cached_analysis.core_finding_detail,
                            "executive_summary": cached_analysis.executive_summary,
                            "key_findings": cached_analysis.key_findings,
                            "strategic_recommendations": cached_analysis.strategic_recommendations,
                            "opportunities": cached_analysis.opportunities,
                            "article_teasers": [t.model_dump() for t in cached_analysis.article_teasers],
                            "headline_stat": cached_analysis.headline_stat,
                            "overall_score": cached_analysis.overall_score,
                            "mention_rate": cached_analysis.mention_rate,
                            "competitor_scores": [c.model_dump() for c in cached_analysis.competitor_scores],
                            "persona_breakdown": [p.model_dump() for p in cached_analysis.persona_breakdown],
                            "topic_breakdown": [t.model_dump() for t in cached_analysis.topic_breakdown],
                        },
                    })

                    # Regenerate PDF from cached data
                    pdf_bytes = lite_report_generator.generate_pdf(cached_discovery, cached_analysis)
                    pdf_available = False
                    if pdf_bytes:
                        _prune_cache()
                        pdf_path = _PDF_DIR / f"{job_id}.pdf"
                        pdf_path.write_bytes(pdf_bytes)
                        pdf_available = True

                    yield _sse_event({
                        "type": "pdf_ready",
                        "job_id": job_id,
                        "status": LiteReportStatus.COMPLETED,
                        "pdf_available": pdf_available,
                    })
                    return

            # Phase 0: Quick domain validation (1-2 seconds)
            resolved_domain = clean_domain
            if not request.discovery_override:
                yield _sse_event({"type": "status", "status": "validating", "message": f"Connecting to {clean_domain}..."})
                try:
                    domain_info = await discovery_service.quick_validate(clean_domain)
                    resolved_domain = domain_info["domain"]
                    clean_domain = resolved_domain  # Use resolved domain for cache/bypass
                    yield _sse_event({"type": "domain_validated", "data": domain_info})
                except Exception as e:
                    logger.warning(f"Quick validate failed: {e}")

                    # If input has no TLD (no dot, or dot but no extension after it), treat as keyword search
                    raw = request.domain.strip()
                    has_tld = "." in raw and len(raw.rsplit(".", 1)[-1]) >= 2
                    if not has_tld:
                        suggestions = await discovery_service.suggest_domains(raw)
                        if suggestions:
                            yield _sse_event({
                                "type": "domain_suggestions",
                                "query": raw,
                                "suggestions": suggestions,
                            })
                            return

                        # Brave unavailable or returned nothing
                        yield _sse_event({
                            "type": "error",
                            "status": LiteReportStatus.FAILED,
                            "message": "We're having trouble finding that. Please type in the full domain (e.g. sendoso.com).",
                        })
                        return

                    yield _sse_event({
                        "type": "error",
                        "status": LiteReportStatus.FAILED,
                        "message": f"Could not connect to {clean_domain}. Please check the domain name and try again.",
                    })
                    return

            # Phase 1: Discovery
            yield _sse_event({"type": "status", "status": LiteReportStatus.DISCOVERING, "message": "Analyzing website and identifying competitors..."})

            if request.discovery_override:
                discovery = request.discovery_override
            else:
                discovery = await discovery_service.discover(resolved_domain)

            yield _sse_event({
                "type": "discovery_complete",
                "data": discovery.model_dump(),
            })

            # Check bypass for gating
            bypassed = await is_bypass_domain(clean_domain)
            if not bypassed and request.promo_code:
                bypassed = await validate_promo_code(request.promo_code, domain=clean_domain)
            yield _sse_event({"type": "gate_status", "gated": not bypassed})

            # Phase 2: Analysis with real-time progress via queue
            yield _sse_event({"type": "status", "status": LiteReportStatus.ANALYZING, "message": "Running AI analysis..."})

            analysis_result: LiteAnalysisResult | None = None
            analysis_error: Exception | None = None

            async def run_analysis_task():
                nonlocal analysis_result, analysis_error
                try:
                    def on_progress(evt: dict):
                        queue.put_nowait(evt)

                    analysis_result = await lite_analysis_runner.run_analysis(discovery, on_progress)
                except Exception as e:
                    analysis_error = e
                finally:
                    queue.put_nowait(None)  # Sentinel: analysis done

            # Start analysis in background task
            task = asyncio.create_task(run_analysis_task())

            # Drain queue, yielding progress events in real-time
            while True:
                evt = await queue.get()
                if evt is None:
                    break
                yield _sse_event(evt)

            await task  # Ensure task is fully done

            if analysis_error:
                raise analysis_error
            if analysis_result is None:
                raise RuntimeError("Analysis returned no result")

            analysis = analysis_result

            yield _sse_event({
                "type": "analysis_complete",
                "data": {
                    "overall_score": analysis.overall_score,
                    "mention_rate": analysis.mention_rate,
                    "total_prompts": analysis.total_prompts,
                    "mentions_count": analysis.mentions_count,
                },
            })

            # Phase 3: Synthesis
            yield _sse_event({"type": "status", "status": LiteReportStatus.SYNTHESIZING, "message": "Generating narrative insights..."})

            analysis = await lite_report_generator.synthesize(discovery, analysis)

            yield _sse_event({
                "type": "synthesis_complete",
                "data": {
                    "report_title": analysis.report_title,
                    "core_finding": analysis.core_finding,
                    "core_finding_detail": analysis.core_finding_detail,
                    "executive_summary": analysis.executive_summary,
                    "key_findings": analysis.key_findings,
                    "strategic_recommendations": analysis.strategic_recommendations,
                    "opportunities": analysis.opportunities,
                    "article_teasers": [t.model_dump() for t in analysis.article_teasers],
                    "headline_stat": analysis.headline_stat,
                    "overall_score": analysis.overall_score,
                    "mention_rate": analysis.mention_rate,
                    "competitor_scores": [c.model_dump() for c in analysis.competitor_scores],
                    "persona_breakdown": [p.model_dump() for p in analysis.persona_breakdown],
                    "topic_breakdown": [t.model_dump() for t in analysis.topic_breakdown],
                },
            })

            # Phase 4: PDF Generation
            yield _sse_event({"type": "status", "status": LiteReportStatus.GENERATING, "message": "Generating PDF report..."})

            pdf_bytes = lite_report_generator.generate_pdf(discovery, analysis)

            if pdf_bytes:
                # Save PDF to disk (survives server restarts)
                _prune_cache()
                pdf_path = _PDF_DIR / f"{job_id}.pdf"
                pdf_path.write_bytes(pdf_bytes)

            # Save to Supabase for future cache hits
            saved_ok = False
            try:
                saved_ok = await save_snapshot(
                    domain=clean_domain,
                    company_name=discovery.company_name,
                    discovery=discovery.model_dump(),
                    analysis=analysis.model_dump(),
                    job_id=job_id,
                )
            except Exception as e:
                logger.warning(f"Supabase snapshot save failed: {e}")
            yield _sse_event({"type": "cache_status", "saved": saved_ok})

            # Send notifications (email + founder_os.messages)
            try:
                await notify_report_run(
                    domain=clean_domain,
                    company_name=discovery.company_name,
                    score=analysis.overall_score,
                    ip_address=client_ip,
                )
            except Exception as e:
                logger.debug(f"Report notification skipped: {e}")

            yield _sse_event({
                "type": "pdf_ready",
                "job_id": job_id,
                "status": LiteReportStatus.COMPLETED,
                "pdf_available": pdf_bytes is not None,
            })

        except Exception as e:
            logger.exception(f"Lite report pipeline failed: {e}")
            yield _sse_event({
                "type": "error",
                "status": LiteReportStatus.FAILED,
                "message": str(e),
            })

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/lite-report/download/{job_id}")
async def download_pdf(job_id: str):
    """Download a generated PDF by job ID.

    Falls back to the share page if the PDF isn't cached locally.
    """
    _prune_cache()

    pdf_path = _PDF_DIR / f"{job_id}.pdf"
    if not pdf_path.exists():
        # Redirect to the share page instead of 404
        return RedirectResponse(
            url=f"https://www.fancyrobot.ai/snapshot/share/{job_id}",
            status_code=302,
        )

    pdf_bytes = pdf_path.read_bytes()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ai-visibility-snapshot-{job_id[:8]}.pdf"',
        },
    )


class PromoValidateRequest(BaseModel):
    """Request body for promo code validation."""

    promo_code: str
    domain: str | None = None
    check_only: bool = False


@router.post("/lite-report/validate-promo")
async def validate_promo(request: PromoValidateRequest):
    """Validate a promo code and return whether it unlocks the gate.

    Pass check_only=true to verify without incrementing usage.
    """
    valid = await validate_promo_code(
        request.promo_code, domain=request.domain, check_only=request.check_only
    )
    return {"valid": valid, "gated": not valid}


@router.post("/lite-report/discover-only")
async def discover_only(request: DiscoverRequest):
    """Run just the discovery phase and return structured results."""
    try:
        discovery = await discovery_service.discover(request.domain)
        return discovery.model_dump()
    except Exception as e:
        logger.exception(f"Discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
