"""Content analysis API endpoints — scoring and enhancement for platform tools.

Provides cleaner REST paths for content analysis capabilities:
  POST /content/score   — deterministic AI-readiness scoring (no LLM)
  POST /content/enhance — non-destructive content enhancement

These are thin wrappers that call the same optimizer logic as /optimize/*.
"""

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.models.article import OptimizeRequest
from app.services.article_optimizer import get_article_optimizer
from app.services.output_formatter import OutputFormat, format_response

router = APIRouter(prefix="/content")


@router.post("/score")
async def score_content(request: OptimizeRequest) -> dict:
    """Deterministic AI-readiness scoring — no LLM calls needed.

    Checks heading structure, FAQ presence, entity density, data blocks,
    structured metadata. Returns a 0-100 score with breakdown.
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
            detail=f"Failed to fetch URL: {e.response.status_code}",
        )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch URL: {e}")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return result


@router.post("/enhance")
async def enhance_content(
    request: OptimizeRequest,
    output: OutputFormat = Query(OutputFormat.HTML_BLOCKS, description="Output format"),
) -> dict:
    """Non-destructive content enhancement — adds AI summary, key findings,
    FAQ, JSON-LD schema without rewriting the original content.

    Returns paste-ready enhancement blocks.
    """
    from app.config import get_settings

    settings = get_settings()
    if not settings.has_openai():
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured.",
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
            detail=f"Failed to fetch URL: {e.response.status_code}",
        )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch URL: {e}")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return format_response(result, output)
