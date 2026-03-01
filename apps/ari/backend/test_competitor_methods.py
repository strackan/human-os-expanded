"""Test the new Brave Answers competitor enrichment pipeline.

Tests:
1. Brave Answers raw response (competitor names + domains from prose)
2. Domain resolution for competitors missing domains
3. Full pipeline: discover() with enrichment + caching
"""

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

import httpx

BRAVE_ANSWERS_KEY = "BSAFqcQfEJF3PH7no5IxH_uE1QHETzL"

BRANDS = [
    ("lululemon.com", "Lululemon"),
    ("notion.so", "Notion"),
    ("allbirds.com", "Allbirds"),
    ("hubspot.com", "HubSpot"),
]


def print_divider(char="-", width=80):
    print(char * width)

def print_header(text):
    print(f"\n{'=' * 80}")
    print(f"  {text}")
    print(f"{'=' * 80}")


async def test_brave_answers_raw(brand_name: str, domain: str, industry: str = "") -> list[dict]:
    """Test raw Brave Answers response + our parser."""
    from app.services.competitor_enrichment import _brave_answers_competitors, _parse_competitors_from_answer

    print(f"\n[1] Brave Answers raw query")
    print_divider()
    t0 = time.time()

    competitors = await _brave_answers_competitors(brand_name, domain, industry or "their industry")
    t1 = time.time()

    if competitors:
        for i, c in enumerate(competitors, 1):
            domain_str = f" ({c['domain']})" if c.get('domain') else " (no domain)"
            print(f"  {i}. {c['name']}{domain_str}")
    else:
        print("  (no results)")

    print(f"  ({t1 - t0:.1f}s)")
    return competitors


async def test_domain_resolution(competitors: list[dict]):
    """Test domain resolution for competitors missing domains."""
    from app.services.competitor_enrichment import _resolve_domains

    missing = [c for c in competitors if not c.get("domain")]
    if not missing:
        print(f"\n[2] Domain resolution: all {len(competitors)} competitors already have domains")
        return competitors

    print(f"\n[2] Domain resolution: {len(missing)} competitors need domains")
    print_divider()
    t0 = time.time()

    resolved = await _resolve_domains(competitors)
    t1 = time.time()

    for c in resolved:
        marker = "[resolved]" if c in missing and c.get("domain") else ""
        domain_str = f" ({c.get('domain', 'no domain')})" if c.get('domain') else " (still missing)"
        print(f"  - {c['name']}{domain_str} {marker}")

    print(f"  ({t1 - t0:.1f}s)")
    return resolved


async def test_full_pipeline(domain: str):
    """Test the full discover() pipeline with Brave Answers enrichment."""
    from app.services.discovery_service import discover

    print(f"\n[3] Full pipeline: discover('{domain}')")
    print_divider()
    t0 = time.time()

    result = await discover(domain)
    t1 = time.time()

    print(f"  Company: {result.company_name} | Industry: {result.industry}")
    print(f"  Competitors:")
    for i, c in enumerate(result.competitors, 1):
        print(f"    {i}. {c.name} ({c.domain or 'no domain'})")
    print(f"  Personas: {result.personas}")
    print(f"  Topics: {result.topics}")
    print(f"  ({t1 - t0:.1f}s)")

    return result


async def test_brand(domain: str, brand_name: str):
    print_header(f"{brand_name} ({domain})")

    # Step 1: Brave Answers raw
    competitors = await test_brave_answers_raw(brand_name, domain)

    # Step 2: Domain resolution
    if competitors:
        await test_domain_resolution(competitors)

    # Step 3: Full pipeline
    await test_full_pipeline(domain)


async def main():
    # Need to set brave_answers_api_key in env for the config to pick it up
    import os
    os.environ["BRAVE_ANSWERS_API_KEY"] = BRAVE_ANSWERS_KEY

    print("\n--- Brave Answers Competitor Enrichment Test ---")
    print(f"   Brands: {', '.join(b[1] for b in BRANDS)}\n")

    for domain, name in BRANDS:
        await test_brand(domain, name)

    print("\n\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
