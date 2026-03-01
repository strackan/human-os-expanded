"""HTTP fetching and HTML content extraction for domain scraping."""

import asyncio
import logging
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# URL variants to try when connecting to a domain
_URL_VARIANTS = [
    "https://{domain}",
    "https://www.{domain}",
    "http://{domain}",
]

# Subpages to try scraping beyond the homepage
_SUBPAGE_PATHS = [
    "/about", "/about-us", "/about_us",
    "/services", "/products", "/what-we-do",
    "/why-us", "/why-choose-us", "/our-difference",
]

_HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Signals that a page is a parked/placeholder domain, not a real business
_PARKED_SIGNALS = [
    "domain is for sale",
    "buy this domain",
    "this domain is parked",
    "parked by",
    "godaddy",
    "sedo.com",
    "hugedomains",
    "afternic",
    "dan.com",
    "undeveloped.com",
    "is available for purchase",
    "domain may be for sale",
    "make an offer",
    "this webpage is parked",
    "squatting",
    "domain parking",
]

# Titles that indicate the page is a WAF/bot block, not real content
_BLOCKED_TITLES = [
    "access denied", "just a moment", "attention required",
    "403 forbidden", "error", "robot check", "security check",
    "please wait", "checking your browser", "blocked",
]

# Cascading selectors for main content extraction.
# Ported from @human-os/documents extractHtml() (core/packages/documents).
_MAIN_CONTENT_SELECTORS = [
    '[role="main"]',
    "article",
    "#main", "#main-content", "#content",
    ".main", ".main-content", ".content", ".content-body", ".news-article",
]


def _resolve_host(url, original_domain: str = "") -> str:
    """Extract clean domain from an httpx URL, stripping www. prefix.

    If the final URL is a subdomain of the original domain (e.g. shop.lululemon.com),
    preserve the original domain so downstream discovery uses the brand name.
    """
    host = str(url.host)
    clean = host[4:] if host.startswith("www.") else host

    # If redirected to a subdomain of the original, keep the original
    if original_domain and clean != original_domain and clean.endswith(f".{original_domain}"):
        return original_domain

    return clean


def _looks_blocked(status_code: int, title: str) -> bool:
    """Check if the response looks like a WAF/bot block rather than real content."""
    if status_code == 403:
        return True
    title_lower = title.lower().strip()
    return any(signal in title_lower for signal in _BLOCKED_TITLES)


def _extract_main_content(html: str) -> str:
    """Extract main content from HTML using cascading selector strategy.

    Tries progressively broader selectors to find the real content area,
    stripping boilerplate (nav, footer, scripts). Falls back to full body text.
    Ported from @human-os/documents extractHtml().
    """
    soup = BeautifulSoup(html, "html.parser")

    # Remove noise elements before extraction
    for tag in soup(["script", "style", "nav", "footer", "iframe", "noscript", "header"]):
        tag.decompose()

    # Try each selector in priority order
    for selector in _MAIN_CONTENT_SELECTORS:
        el = soup.select_one(selector)
        if el and el.get_text(strip=True):
            return el.get_text(separator="\n", strip=True)

    # Fallback: full body text
    return soup.get_text(separator="\n", strip=True)


async def try_connect(domain: str, timeout: float = 10.0) -> tuple[httpx.Response, str]:
    """Try multiple URL variants to reach a domain.

    Returns (response, resolved_domain). Raises RuntimeError with helpful message on failure.
    Any HTTP response (even 403/5xx) counts as a successful connection — it proves the
    domain is alive. Only connection-level failures (DNS, timeout, TLS) move to the next variant.
    """
    last_error = ""
    async with httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=True,
        verify=False,
        headers=_HTTP_HEADERS,
    ) as client:
        for pattern in _URL_VARIANTS:
            url = pattern.format(domain=domain)
            try:
                response = await client.get(url)
                return response, _resolve_host(response.url, original_domain=domain)
            except httpx.HTTPStatusError:
                return response, _resolve_host(response.url, original_domain=domain)
            except Exception as e:
                last_error = str(e) or type(e).__name__
                continue

    raise RuntimeError(
        f"Could not connect to {domain}. Please check the domain name and try again."
    )


async def fetch_page(client: httpx.AsyncClient, url: str) -> str | None:
    """Fetch a single page and return cleaned text, or None on failure."""
    try:
        response = await client.get(url)
        if response.status_code >= 400 and not response.text:
            return None

        return _extract_main_content(response.text)
    except Exception:
        return None


async def fetch_and_parse(domain: str) -> tuple[str, str]:
    """Fetch homepage + key subpages. Returns (site_text, resolved_domain)."""
    response, resolved_domain = await try_connect(domain, timeout=20.0)

    # Parse homepage using cascading selector strategy
    homepage_text = _extract_main_content(response.text)

    # Use the final resolved URL as base for subpages
    base_url = f"{response.url.scheme}://{response.url.host}"

    async with httpx.AsyncClient(
        timeout=15.0,
        follow_redirects=True,
        verify=False,
        headers=_HTTP_HEADERS,
    ) as client:
        subpage_tasks = [
            fetch_page(client, f"{base_url.rstrip('/')}{path}")
            for path in _SUBPAGE_PATHS
        ]
        subpage_results = await asyncio.gather(*subpage_tasks)

    # Combine homepage (priority) with successful subpages
    sections = [f"=== HOMEPAGE ===\n{homepage_text[:4000]}"]
    chars_remaining = 6000
    for path, text in zip(_SUBPAGE_PATHS, subpage_results):
        if text and chars_remaining > 0:
            chunk = text[:2000]
            sections.append(f"\n=== {path.upper()} PAGE ===\n{chunk}")
            chars_remaining -= len(chunk)
            if chars_remaining <= 0:
                break

    return "\n".join(sections), resolved_domain


async def quick_validate(domain: str) -> dict:
    """Quick domain check: try variants, follow redirects, extract title/meta.

    If the site blocks us (403, WAF page), falls back to Brave Search
    for the real title and meta description.
    """
    from app.services.domain_search import brave_metadata

    response, resolved_domain = await try_connect(domain, timeout=15.0)

    soup = BeautifulSoup(response.text[:5000], "html.parser")

    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()[:80]

    meta_desc = ""
    meta = soup.find("meta", attrs={"name": "description"})
    if not meta:
        meta = soup.find("meta", attrs={"property": "og:description"})
    if meta and meta.get("content"):
        meta_desc = str(meta["content"]).strip()[:200]

    # If we got a blocked response, fall back to Brave Search for real metadata
    if _looks_blocked(response.status_code, title):
        logger.info(f"Site blocked us ({response.status_code}, title='{title}'), falling back to Brave Search")
        brave_meta = await brave_metadata(resolved_domain)
        if brave_meta["title"]:
            title = brave_meta["title"]
        if brave_meta["meta_description"]:
            meta_desc = brave_meta["meta_description"]

    return {
        "domain": resolved_domain,
        "title": title or resolved_domain,
        "meta_description": meta_desc,
        "url": str(response.url),
    }
