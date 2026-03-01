"""Discovery API endpoints — company profiling, competitor discovery, web scraping.

Exposes ARI's external intelligence capabilities for use by
HumanOS platform tools (GFT CRM, Renubu, FounderOS, etc.).
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discover")


class ProfileRequest(BaseModel):
    """Request body for company profiling."""
    domain: str
    deep: bool = False


class CompetitorRequest(BaseModel):
    """Request body for competitor discovery."""
    company_name: str
    domain: str
    industry: str = ""


class ScrapeRequest(BaseModel):
    """Request body for web scraping."""
    domain: str


@router.post("/profile")
async def profile_company(request: ProfileRequest) -> dict:
    """Extract structured company intelligence from a domain.

    Returns discovery data (industry, competitors, personas, products, etc.)
    and optionally deep brand profile data.
    """
    from app.services.web_scraper import fetch_and_parse
    from app.services.llm_discovery import llm_discover

    try:
        site_text, resolved_domain = await fetch_and_parse(request.domain)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch {request.domain}: {e}")

    try:
        discovery = await llm_discover(resolved_domain, site_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discovery failed: {e}")

    result = discovery.model_dump() if hasattr(discovery, "model_dump") else discovery.__dict__

    if request.deep:
        try:
            from app.services.brand_profiler import deep_profile
            profile = await deep_profile(discovery, site_text)
            result["brand_profile"] = (
                profile.model_dump() if hasattr(profile, "model_dump") else profile.__dict__
            )
        except Exception as e:
            logger.warning(f"Deep profile failed (non-blocking): {e}")
            result["brand_profile"] = None

    return result


@router.post("/competitors")
async def find_competitors(request: CompetitorRequest) -> dict:
    """Multi-source competitor discovery: Brave Answers + LLM + Sonnet validation.

    Returns enriched competitor list with domains and validation status.
    """
    from app.models.lite_report import CompetitorInfo, DiscoveryResult
    from app.services.competitor_enrichment import enrich_competitors

    # Build a minimal DiscoveryResult for the enrichment pipeline
    discovery = DiscoveryResult(
        company_name=request.company_name,
        domain=request.domain,
        industry=request.industry,
        description="",
        entity_type=request.industry or "company",
        competitors=[],
        personas=[],
        topics=[],
        differentiators=[],
    )

    try:
        enriched = await enrich_competitors(discovery)
        return {
            "company_name": request.company_name,
            "domain": request.domain,
            "competitors": [
                c.model_dump() if hasattr(c, "model_dump") else {"name": c.name, "domain": c.domain}
                for c in enriched.competitors
            ],
        }
    except Exception as e:
        logger.warning(f"Competitor discovery failed: {e}")
        raise HTTPException(status_code=502, detail=f"Competitor discovery failed: {e}")


@router.post("/scrape")
async def scrape_website(request: ScrapeRequest) -> dict:
    """Smart web scraping with content extraction and bot detection fallback.

    Returns extracted text content from the domain's homepage and key subpages.
    """
    from app.services.web_scraper import fetch_and_parse

    try:
        site_text, resolved_domain = await fetch_and_parse(request.domain)
        return {
            "domain": request.domain,
            "resolved_domain": resolved_domain,
            "content": site_text,
            "content_length": len(site_text),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Scraping failed for {request.domain}: {e}")
