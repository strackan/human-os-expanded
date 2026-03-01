"""API router for the article generation pipeline.

Endpoints:
  POST /articles/generate   — Full pipeline (SSE streaming)
  POST /articles/write       — Phase 1 only
  POST /articles/edit        — Phase 2 only
  POST /articles/condense    — Phase 3 only (long-form → wire distribution)
  POST /articles/convert     — Phase 4 only
  POST /articles/gumshoe     — Parse Gumshoe CSVs for a customer
  GET  /articles/            — List article runs
  GET  /articles/{run_id}    — Get specific article run
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.models.article_pipeline import (
    ArticleInput,
    ArticleRun,
    ArticleStatus,
    CondenserInput,
    CondenserOutput,
    ConverterInput,
    EditorInput,
    EditorOutput,
    GumshoeParseRequest,
    GumshoePayload,
    OptimizerOutput,
    WriterOutput,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory store for article runs (Supabase persistence added later)
_article_runs: dict[str, ArticleRun] = {}


def _sse_event(data: dict[str, Any]) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(data)}\n\n"


# --- Full Pipeline (SSE) ---


@router.post("/articles/generate")
async def generate_article(request: ArticleInput):
    """Full article generation pipeline with SSE streaming.

    Phases: preprocessing → writing → draft_writer → editing →
    draft_editor → condensing → optimizing → completed
    """

    async def generate():
        run_id = str(uuid.uuid4())
        run = ArticleRun(
            id=uuid.UUID(run_id),
            customer_slug=request.customer_slug,
            domain=request.domain,
            article_topic=request.article_topic,
            status=ArticleStatus.PENDING,
            input_data=request,
        )
        _article_runs[run_id] = run

        try:
            # Phase 0: Preprocessing (Gumshoe if customer_slug provided)
            gumshoe_payload_md = request.gumshoe_payload

            if request.customer_slug and not gumshoe_payload_md:
                run.status = ArticleStatus.PREPROCESSING
                yield _sse_event({"type": "status", "status": "preprocessing", "run_id": run_id})

                try:
                    from app.services.gumshoe_parser import parse_gumshoe

                    payload = parse_gumshoe(
                        customer_slug=request.customer_slug,
                        brand_domain=request.domain,
                    )
                    gumshoe_payload_md = payload.payload_markdown
                    yield _sse_event({
                        "type": "gumshoe_complete",
                        "queries": len(payload.queries),
                        "competitors": len(payload.competitive_landscape),
                        "binding_items": len(payload.binding_checklist),
                    })
                except FileNotFoundError:
                    logger.info(f"No Gumshoe data for {request.customer_slug}, skipping")
                    yield _sse_event({"type": "gumshoe_skipped", "reason": "No CSV files found"})

            # Phase 1: Writer
            run.status = ArticleStatus.WRITING
            yield _sse_event({"type": "status", "status": "writing", "run_id": run_id})

            from app.services.article_writer import ArticleWriter

            writer = ArticleWriter()
            # Update input with gumshoe data if we parsed it
            write_input = request.model_copy()
            if gumshoe_payload_md and not write_input.gumshoe_payload:
                write_input.gumshoe_payload = gumshoe_payload_md

            writer_output = await writer.write(write_input)
            run.writer_output = writer_output
            run.status = ArticleStatus.DRAFT_WRITER

            yield _sse_event({
                "type": "writer_complete",
                "status": "draft_writer",
                "title": writer_output.title,
                "word_count": writer_output.word_count,
                "provider": writer_output.provider_used,
                "latency_ms": writer_output.latency_ms,
            })

            # Phase 2: Editor
            run.status = ArticleStatus.EDITING
            yield _sse_event({"type": "status", "status": "editing", "run_id": run_id})

            from app.services.article_editor import ArticleEditor

            editor = ArticleEditor()
            editor_input = EditorInput(
                article_markdown=writer_output.article_markdown,
                client_name=request.client_name,
                domain=request.domain,
                gumshoe_payload=gumshoe_payload_md,
            )
            editor_output = await editor.edit(editor_input)
            run.editor_output = editor_output
            run.status = ArticleStatus.DRAFT_EDITOR

            yield _sse_event({
                "type": "editor_complete",
                "status": "draft_editor",
                "word_count": editor_output.word_count,
                "total_changes": editor_output.editors_log.total_changes,
                "passes": len(editor_output.editors_log.passes),
                "aio_scorecard": editor_output.editors_log.aio_scorecard,
                "provider": editor_output.provider_used,
                "latency_ms": editor_output.latency_ms,
            })

            # Phase 3: Condenser (long-form → wire distribution)
            run.status = ArticleStatus.CONDENSING
            yield _sse_event({"type": "status", "status": "condensing", "run_id": run_id})

            from app.services.article_condenser import ArticleCondenser

            condenser = ArticleCondenser()
            condenser_input = CondenserInput(
                article_markdown=editor_output.hardened_markdown,
                client_name=request.client_name,
                domain=request.domain,
                target_word_count=400,
                preserve_keywords=request.target_keywords,
            )
            condenser_output = await condenser.condense(condenser_input)
            run.condenser_output = condenser_output

            yield _sse_event({
                "type": "condenser_complete",
                "status": "condensing_done",
                "word_count": condenser_output.word_count,
                "source_word_count": condenser_output.source_word_count,
                "compression_ratio": condenser_output.compression_ratio,
                "entities_preserved": len(condenser_output.entities_preserved),
                "latency_ms": condenser_output.latency_ms,
            })

            # Phase 4: HTML Converter (condensed → distribution-ready HTML)
            run.status = ArticleStatus.OPTIMIZING
            yield _sse_event({"type": "status", "status": "optimizing", "run_id": run_id})

            from app.services.article_html_converter import ArticleHtmlConverter

            converter = ArticleHtmlConverter()
            converter_input = ConverterInput(
                article_markdown=condenser_output.condensed_markdown,
                client_name=request.client_name,
                domain=request.domain,
            )
            optimizer_output = await converter.convert(converter_input)
            run.optimizer_output = optimizer_output
            run.status = ArticleStatus.COMPLETED
            run.completed_at = datetime.utcnow()

            yield _sse_event({
                "type": "optimizer_complete",
                "status": "completed",
                "score_before": optimizer_output.score_before,
                "score_after": optimizer_output.score_after,
                "latency_ms": optimizer_output.latency_ms,
            })

            # Final event
            yield _sse_event({
                "type": "pipeline_complete",
                "run_id": run_id,
                "status": "completed",
                "title": writer_output.title,
                "long_form_word_count": editor_output.word_count,
                "distribution_word_count": condenser_output.word_count,
                "score": optimizer_output.score_after,
            })

        except Exception as e:
            logger.exception(f"Article pipeline failed: {e}")
            run.status = ArticleStatus.FAILED
            yield _sse_event({
                "type": "error",
                "status": "failed",
                "run_id": run_id,
                "message": str(e),
            })

    return StreamingResponse(generate(), media_type="text/event-stream")


# --- Individual Phase Endpoints ---


@router.post("/articles/write", response_model=WriterOutput)
async def write_article(request: ArticleInput) -> WriterOutput:
    """Phase 1 only — generate article from input data."""
    from app.services.article_writer import ArticleWriter

    writer = ArticleWriter()
    return await writer.write(request)


@router.post("/articles/edit", response_model=EditorOutput)
async def edit_article(request: EditorInput) -> EditorOutput:
    """Phase 2 only — run editorial passes on a draft article."""
    from app.services.article_editor import ArticleEditor

    editor = ArticleEditor()
    return await editor.edit(request)


@router.post("/articles/convert", response_model=OptimizerOutput)
async def convert_article(request: ConverterInput) -> OptimizerOutput:
    """Phase 4 only — convert markdown to distribution-ready HTML."""
    from app.services.article_html_converter import ArticleHtmlConverter

    converter = ArticleHtmlConverter()
    return await converter.convert(request)


@router.post("/articles/condense", response_model=CondenserOutput)
async def condense_article(request: CondenserInput) -> CondenserOutput:
    """Phase 3 only — condense long-form article to wire distribution length."""
    from app.services.article_condenser import ArticleCondenser

    condenser = ArticleCondenser()
    return await condenser.condense(request)


@router.post("/articles/gumshoe", response_model=GumshoePayload)
async def parse_gumshoe_data(request: GumshoeParseRequest) -> GumshoePayload:
    """Parse Gumshoe CSVs for a customer slug."""
    from app.services.gumshoe_parser import parse_gumshoe

    try:
        return parse_gumshoe(
            customer_slug=request.customer_slug,
            brand_domain=request.brand_domain,
            persona_filter=request.persona_filter,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- CRUD Endpoints ---


@router.get("/articles/")
async def list_article_runs(
    customer_slug: str | None = Query(None, description="Filter by customer slug"),
) -> list[dict[str, Any]]:
    """List article runs with optional customer filter."""
    runs = _article_runs.values()
    if customer_slug:
        runs = [r for r in runs if r.customer_slug == customer_slug]

    return [
        {
            "id": str(r.id),
            "customer_slug": r.customer_slug,
            "domain": r.domain,
            "article_topic": r.article_topic,
            "status": r.status.value,
            "title": r.writer_output.title if r.writer_output else "",
            "word_count": r.editor_output.word_count if r.editor_output else (r.writer_output.word_count if r.writer_output else 0),
            "score": r.optimizer_output.score_after if r.optimizer_output else None,
            "created_at": r.created_at.isoformat(),
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        }
        for r in sorted(runs, key=lambda r: r.created_at, reverse=True)
    ]


@router.get("/articles/{run_id}")
async def get_article_run(run_id: str) -> dict[str, Any]:
    """Get a specific article run with full data."""
    run = _article_runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Article run {run_id} not found")

    result: dict[str, Any] = {
        "id": str(run.id),
        "customer_slug": run.customer_slug,
        "domain": run.domain,
        "article_topic": run.article_topic,
        "status": run.status.value,
        "created_at": run.created_at.isoformat(),
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
    }

    if run.writer_output:
        result["writer_output"] = run.writer_output.model_dump()
    if run.editor_output:
        result["editor_output"] = run.editor_output.model_dump()
    if run.optimizer_output:
        result["optimizer_output"] = run.optimizer_output.model_dump()
    if run.condenser_output:
        result["condenser_output"] = run.condenser_output.model_dump()

    return result
