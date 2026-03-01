"""Search API endpoints — thin REST wrappers around ARI's Brave Search capabilities.

Exposes web search, domain suggestion, and Brave Answers for use by
HumanOS platform tools (search-mcp, FounderOS, Renubu, etc.).
"""

import logging

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import get_settings
from app.services.domain_search import brave_search, suggest_domains

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search")


class AnswersRequest(BaseModel):
    """Request body for Brave Answers Q&A."""
    query: str
    company_name: str | None = None
    domain: str | None = None
    industry: str | None = None


@router.get("/web")
async def web_search(
    q: str = Query(..., description="Search query"),
    count: int = Query(5, ge=1, le=20, description="Number of results"),
) -> dict:
    """General web search via Brave Search API.

    Returns a list of web results with url and title.
    """
    settings = get_settings()
    if not settings.brave_api_key:
        raise HTTPException(
            status_code=503,
            detail="Brave Search API key not configured.",
        )

    results = await brave_search(q, count=count)
    return {"query": q, "count": len(results), "results": results}


@router.get("/domain")
async def find_domain(
    brand: str = Query(..., description="Brand name to find domain for"),
    num_results: int = Query(3, ge=1, le=10),
) -> dict:
    """Given a brand name, find its official domain.

    Uses Brave Search with brand-domain extraction and caching.
    """
    results = await suggest_domains(brand, num_results=num_results)
    return {"brand": brand, "domains": results}


@router.post("/answers")
async def web_answers(request: AnswersRequest) -> dict:
    """Grounded Q&A via Brave Answers — competitive intelligence and market research.

    Uses Brave's chat/completions endpoint for factual Q&A with real-time web context.
    """
    settings = get_settings()
    if not settings.brave_api_key:
        raise HTTPException(
            status_code=503,
            detail="Brave Search API key not configured.",
        )

    try:
        from app.services.competitor_enrichment import _brave_answers_competitors

        # Use the existing Brave Answers function for competitive queries
        if request.company_name and request.domain:
            results = await _brave_answers_competitors(
                request.company_name,
                request.domain,
                request.industry or "",
            )
            return {
                "query": request.query,
                "company_name": request.company_name,
                "results": results,
            }

        # For general queries, fall back to web search
        results = await brave_search(request.query, count=5)
        return {"query": request.query, "results": results}
    except Exception as e:
        logger.warning(f"Brave Answers failed: {e}")
        raise HTTPException(status_code=502, detail=f"Brave Answers failed: {e}")
