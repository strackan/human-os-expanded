"""LLM-based company discovery: extract structured business context from website text."""

import json
import logging

import httpx

from app.config import get_settings
from app.models.lite_report import CompetitorInfo, DiscoveryResult

logger = logging.getLogger(__name__)

DISCOVERY_PROMPT = """You are a competitive intelligence analyst. Your job is to analyze a company's website and
determine exactly who their competitors are, what buyer archetypes care about, and what decision criteria matter
most — because this data will be used to test whether AI assistants recommend this company.

## Domain
{domain}

## Website Content
{site_text}

## How This Data Will Be Used
The personas and topics you choose will be combined into prompts like:
- "What company would you recommend for [PERSONA] looking for [TOPIC]?"
- "What are the top 3 companies for [PERSONA] seeking [TOPIC]?"
- "Compare the leading companies for [PERSONA] when it comes to [TOPIC]."

So personas must be DECISION-MAKER ARCHETYPES (specific types of people with distinct needs and search behavior),
and topics must be EVALUATION CRITERIA or CONCERNS that those people would search about.

## Instructions
Return ONLY valid JSON in this exact format:
{{
  "company_name": "Official company name",
  "industry": "Primary industry (e.g. 'Gold & Precious Metals Retail', 'Holiday Toy Donation Charities')",
  "entity_type": "Singular noun phrase for what this company IS (e.g. 'gold dealer', 'toy donation charity', 'CRM platform', 'content syndication service')",
  "description": "1-2 sentence description of what the company does",
  "competitors": [
    {{"name": "Competitor 1", "domain": "competitor1.com"}},
    {{"name": "Competitor 2", "domain": "competitor2.com"}},
    {{"name": "Competitor 3", "domain": "competitor3.com"}},
    {{"name": "Competitor 4", "domain": "competitor4.com"}},
    {{"name": "Competitor 5", "domain": "competitor5.com"}}
  ],
  "personas": [
    "Persona 1",
    "Persona 2",
    "Persona 3",
    "Persona 4"
  ],
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3",
    "Topic 4"
  ],
  "differentiators": [
    "Differentiator 1",
    "Differentiator 2",
    "Differentiator 3"
  ]
}}

## Critical Guidelines

### Competitors (5)
- These must be the companies that AI models would ACTUALLY recommend when someone asks about this industry
- Think: "If someone asked ChatGPT for the best [industry] companies, who would it list?"
- Include only direct competitors in the same market category, not adjacent businesses
- Rank by likely AI visibility (most-recommended first)

### Personas (exactly 4)
- Each persona is a DECISION-MAKER ARCHETYPE — a specific type of person with unique needs, concerns, and search patterns
- BAD examples: "Potential Customers", "Investors", "Retirees" (too generic — these won't differentiate in AI prompts)
- GOOD examples for a gold dealer: "Cautious First-Time Buyer", "Self-Directed IRA Maximizer", "Collectible Coin Enthusiast", "Multi-Generational Wealth Preserver"
- GOOD examples for a charity: "Digital-First Millennial Donor", "Corporate Partnership Manager", "Military Family Supporter", "Suburban Parent Volunteer"
- Choose personas that span DIFFERENT buyer motivations and demographics
- At least one persona should represent a growth/underserved segment (e.g. younger demographics, underserved niche)
- Format as noun phrases (2-5 words) that describe WHO the person is, not what they do

### Topics (exactly 4)
- Each topic is a specific EVALUATION CRITERION or CONCERN that matters when choosing a provider in this industry
- BAD examples: "Gold Investment", "Precious Metals Market", "Charitable Giving" (too broad — every competitor covers these)
- GOOD examples for a gold dealer: "Product Authenticity", "Retirement Account Compatibility", "Price Transparency", "Buyback Guarantees"
- GOOD examples for a charity: "Donation Impact Tracking", "Volunteer Opportunities", "Corporate Sponsorship Programs", "Local Drop-Off Accessibility"
- Choose topics that reveal DIFFERENTIATION — where some companies are strong and others weak
- At least one topic should align with the company's unique strengths/differentiators
- Format as noun phrases (2-5 words) that describe a CONCERN or CRITERION, not a general industry category

### Differentiators (3-5)
- What makes THIS company specifically different from competitors?
- Reference specific credentials, programs, history, certifications, or capabilities
- These should be things competitors CANNOT easily claim"""


def _extract_json(text: str) -> dict:
    """Extract JSON from text that may have markdown formatting."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


async def _openai_via_httpx(api_key: str, model: str, prompt: str, max_tokens: int = 2048) -> str:
    """Call OpenAI API directly via httpx — bypasses SDK async transport issues on Vercel."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key.strip()}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant providing recommendations and information. Be direct and specific in your responses."},
                    {"role": "user", "content": prompt},
                ],
                "max_completion_tokens": max_tokens,
                "reasoning_effort": "low",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        if not content:
            raise RuntimeError(f"Empty response from {model}")
        return content


async def llm_discover(domain: str, site_text: str) -> DiscoveryResult:
    """Use an LLM to extract structured discovery from site text.

    Uses direct httpx calls to OpenAI API for reliable Vercel serverless operation.
    """
    settings = get_settings()
    prompt = DISCOVERY_PROMPT.format(domain=domain, site_text=site_text)

    # Try OpenAI via direct httpx (same client that works for website scraping)
    if settings.has_openai():
        try:
            response_text = await _openai_via_httpx(
                api_key=settings.openai_api_key,
                model=settings.openai_model,
                prompt=prompt,
                max_tokens=2048,
            )
            logger.info("Discovery completed with OpenAI (httpx)")
        except Exception as e:
            logger.error(f"OpenAI httpx call failed: {e}")
            raise RuntimeError(f"Discovery LLM call failed: {e}")
    else:
        raise ValueError("OpenAI API key required for discovery service")

    data = _extract_json(response_text)

    competitors = [
        CompetitorInfo(name=c["name"], domain=c.get("domain", ""))
        for c in data.get("competitors", [])
    ]

    return DiscoveryResult(
        company_name=data.get("company_name", domain),
        domain=domain,
        industry=data.get("industry", ""),
        entity_type=data.get("entity_type", "company"),
        description=data.get("description", ""),
        competitors=competitors[:5],
        personas=data.get("personas", [])[:4],
        topics=data.get("topics", [])[:4],
        differentiators=data.get("differentiators", []),
    )
