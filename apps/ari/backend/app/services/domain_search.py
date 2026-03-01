"""Domain suggestion and brand search via Brave Search API + Supabase cache."""

import logging
from urllib.parse import urlparse

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


def _extract_brand_domain(url: str) -> str | None:
    """Extract a clean brand domain from a search result URL.

    Filters out non-brand sites (wikipedia, imdb, youtube, social media, etc).
    Returns the domain or None if it's not a brand site.
    """
    skip_domains = {
        "wikipedia.org", "imdb.com", "youtube.com", "reddit.com",
        "facebook.com", "twitter.com", "x.com", "instagram.com",
        "linkedin.com", "tiktok.com", "pinterest.com", "yelp.com",
        "amazon.com", "ebay.com", "etsy.com", "walmart.com",
        "bbb.org", "crunchbase.com", "glassdoor.com",
    }
    try:
        host = urlparse(url).hostname or ""
        host = host.lower()
        if host.startswith("www."):
            host = host[4:]
        for skip in skip_domains:
            if host == skip or host.endswith(f".{skip}"):
                return None
        return host
    except Exception:
        return None


async def brave_search(query: str, count: int = 5) -> list[dict]:
    """Call Brave Search API and return web results.

    Returns list of dicts with 'url' and 'title' keys.
    """
    settings = get_settings()
    if not settings.has_brave():
        logger.warning("Brave Search not configured — BRAVE_SEARCH_API_KEY is empty")
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": query, "count": count},
                headers={"X-Subscription-Token": settings.brave_search_api_key},
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("web", {}).get("results", [])
            logger.info(f"Brave Search for '{query}': {len(results)} results, URLs: {[r.get('url','') for r in results[:5]]}")
            return results
    except Exception as e:
        logger.warning(f"Brave Search API failed for '{query}': {e}")
        return []


async def _get_supabase_client():
    """Get a Supabase client for brand cache lookups."""
    settings = get_settings()
    if not settings.has_supabase():
        return None
    try:
        from supabase import create_client
        return create_client(settings.supabase_url, settings.supabase_key)
    except Exception:
        return None


async def suggest_domains(query: str, num_results: int = 5) -> list[dict[str, str]]:
    """Search for a brand name and return distinct brand domains.

    Checks Supabase brand_cache first, then falls back to Brave Search API.
    Returns up to 3 unique brand suggestions, each with 'domain' and 'title'.
    """
    # 1. Check cache
    sb = await _get_supabase_client()
    if sb:
        try:
            cached = sb.table("brand_cache").select("domain,title").eq("keyword", query.lower().strip()).execute()
            if cached.data:
                row = cached.data[0]
                return [{"domain": row["domain"], "title": row.get("title", "")}]
        except Exception as e:
            logger.debug(f"Brand cache lookup failed (non-fatal): {e}")

    # 2. Brave Search
    results = await brave_search(query, count=num_results)
    if not results:
        return []

    suggestions: list[dict[str, str]] = []
    seen_domains: set[str] = set()

    for r in results:
        domain = _extract_brand_domain(r.get("url", ""))
        if domain and domain not in seen_domains:
            seen_domains.add(domain)
            title = r.get("title", "")
            title = title.split(" - ")[0].split(" | ")[0].strip()
            suggestions.append({"domain": domain, "title": title})
            if len(suggestions) >= 3:
                break

    # 3. Cache the top result
    if suggestions and sb:
        try:
            top = suggestions[0]
            sb.table("brand_cache").upsert({
                "keyword": query.lower().strip(),
                "domain": top["domain"],
                "title": top.get("title", ""),
            }).execute()
        except Exception as e:
            logger.debug(f"Brand cache write failed (non-fatal): {e}")

    return suggestions


async def brave_metadata(domain: str) -> dict[str, str]:
    """Fall back to Brave Search to get title and description for a blocked domain."""
    results = await brave_search(domain, count=3)
    if not results:
        return {"title": "", "meta_description": ""}

    # Find the result that matches the domain
    for r in results:
        host = urlparse(r.get("url", "")).hostname or ""
        host = host.lower().removeprefix("www.")
        if host == domain or host.endswith(f".{domain}"):
            title = r.get("title", "").split(" - ")[0].split(" | ")[0].strip()
            return {"title": title, "meta_description": r.get("description", "")}

    # No exact match — use first result
    first = results[0]
    return {
        "title": first.get("title", "").split(" - ")[0].split(" | ")[0].strip(),
        "meta_description": first.get("description", ""),
    }
