"""Article optimizer API endpoints."""

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import get_settings
from app.models.article import OptimizeRequest, OptimizeResponse
from app.services.article_optimizer import get_article_optimizer
from app.services.output_formatter import OutputFormat, format_response

router = APIRouter(prefix="/optimize")


@router.post("/", response_model=OptimizeResponse)
async def optimize_article(request: OptimizeRequest) -> OptimizeResponse:
    """
    Full optimization pipeline: parse + score + LLM analysis + LLM optimization + re-score.

    Requires OPENAI_API_KEY to be configured.
    """
    settings = get_settings()
    if not settings.has_openai():
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Use /optimize/score-only for deterministic scoring.",
        )

    optimizer = get_article_optimizer()

    try:
        result = await optimizer.optimize(
            content=request.content,
            format=request.format,
            url=request.url,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch URL: {e.response.status_code} {e.response.reason_phrase}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch URL: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return result


@router.post("/enhance")
async def enhance_article(
    request: OptimizeRequest,
    output: OutputFormat = Query(OutputFormat.HTML_BLOCKS, description="Output format"),
) -> dict:
    """
    Generate non-destructive AI enhancement blocks for an article.

    Returns paste-ready HTML blocks (summary, key findings, FAQ, JSON-LD schema)
    that can be placed alongside the original article without modifying it.

    Output formats:
    - html_blocks (default): Discrete HTML fragments ready for CMS paste
    - json: Full structured response
    - rss_fragment: XML block for RSS feed injection
    """
    settings = get_settings()
    if not settings.has_openai():
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Use /optimize/score-only for deterministic scoring.",
        )

    optimizer = get_article_optimizer()

    try:
        result = await optimizer.enhance(
            content=request.content,
            format=request.format,
            url=request.url,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch URL: {e.response.status_code} {e.response.reason_phrase}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch URL: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return format_response(result, output)


@router.post("/score-only")
async def score_only(request: OptimizeRequest) -> dict:
    """
    Parse and score an article without LLM calls. Instant, no API key needed.

    Returns structural analysis and a deterministic AI-readiness score (0-100).
    """
    optimizer = get_article_optimizer()

    try:
        result = await optimizer.score_only(
            content=request.content,
            format=request.format,
            url=request.url,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch URL: {e.response.status_code} {e.response.reason_phrase}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch URL: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return result
