"""Discovery service: orchestrates domain scraping, LLM extraction, and competitor enrichment.

This module is the public API — import from here for backwards compatibility.
Internal logic lives in web_scraper, domain_search, llm_discovery, and competitor_enrichment.
"""

from app.models.lite_report import DiscoveryResult

# Re-export public functions so existing imports keep working
from app.services.web_scraper import (  # noqa: F401
    quick_validate,
    fetch_and_parse,
    try_connect,
)
from app.services.domain_search import suggest_domains  # noqa: F401
from app.services.llm_discovery import llm_discover  # noqa: F401
from app.services.competitor_enrichment import enrich_competitors  # noqa: F401

# Backwards-compatible aliases for private-style imports
_fetch_and_parse = fetch_and_parse
_try_connect = try_connect


async def discover(domain: str) -> DiscoveryResult:
    """Full discovery pipeline: scrape domain, extract with LLM, optionally enrich."""
    # Clean domain input
    domain = domain.strip().lower()
    if domain.startswith("http://"):
        domain = domain[7:]
    if domain.startswith("https://"):
        domain = domain[8:]
    domain = domain.rstrip("/")

    site_text, resolved_domain = await fetch_and_parse(domain)
    discovery = await llm_discover(resolved_domain, site_text)
    discovery.domain = resolved_domain
    discovery = await enrich_competitors(discovery)
    return discovery
