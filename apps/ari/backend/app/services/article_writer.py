"""Phase 1 — Article Writer service.

Generates a journalistic article from client data using Perplexity sonar
(for web-grounded current data) with Anthropic fallback.
"""

import logging
import time

from app.config import get_settings
from app.models.article_pipeline import ArticleInput, WriterOutput
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.ai_providers.base import ProviderResponse
from app.services.ai_providers.perplexity_provider import PerplexityProvider

logger = logging.getLogger(__name__)


WRITER_SYSTEM = (
    "You are an award-winning business journalist writing for a major publication. "
    "Your articles are data-rich, source-grounded, and written in a neutral journalistic voice "
    "that naturally positions client expertise without reading as advertorial. "
    "Search the web for current data, prices, regulations, and statistics to ground every claim. "
    "Return ONLY the article in markdown format — no preamble, no meta-commentary."
)

WRITER_SYSTEM_NO_SEARCH = (
    "You are an award-winning business journalist writing for a major publication. "
    "Your articles are data-rich, source-grounded, and written in a neutral journalistic voice "
    "that naturally positions client expertise without reading as advertorial. "
    "Verify facts using your training knowledge. Flag any claims you cannot confidently verify with hedging language. "
    "Return ONLY the article in markdown format — no preamble, no meta-commentary."
)

WRITER_BASE = """Write a comprehensive, journalistic article on the following topic.

## Assignment

**Topic:** {article_topic}
**Client:** {client_name} ({domain})
**Industry:** {industry}
**Target Length:** {target_word_count} words
**Tone:** {tone}

## Article Requirements

1. **Headline:** Create a compelling, specific headline that includes the current year and signals depth (e.g., "Gold IRAs in 2026: What Retirees Need to Know...")

2. **Lead (100-150 words):** Open with a newsworthy hook — a market trend, regulatory change, or data point that establishes why this topic matters NOW. Do NOT open with the client.

3. **Body Sections (4-6 H2 sections):**
   - Each section should have a clear H2 heading
   - Lead with industry facts, data, and expert context
   - Include specific numbers: prices, percentages, regulatory limits, timelines
   - Naturally weave the client's offerings into relevant sections — they should appear as a credible example, NOT the focus
   - Use bullet points for scannable data blocks (fees, steps, requirements)

4. **Client Integration Rules:**
   - The client should appear in approximately 30-40% of sections
   - Always introduce client offerings with context ("Companies like {client_name}..." or "{client_name}'s approach to...")
   - Include at least one specific program, product, or differentiator
   - Never use superlatives about the client ("best", "leading", "top") without attribution

5. **Data Density:**
   - Include current gold/silver spot prices or recent ranges
   - Reference IRS rules, contribution limits, or regulatory requirements where relevant
   - Cite industry statistics or survey data
   - Include year-specific information (2026 limits, current market conditions)

6. **Structure for AI Readability:**
   - Use H2 and H3 headings that read as natural questions or clear topic labels
   - Include at least one bulleted list per major section
   - End with a brief "Getting Started" or "What to Consider" section
   - Write sentences that are self-contained and extractable

7. **Closing:** End with actionable next steps, not a sales pitch. The client can be mentioned as one resource among others.

## Output Format

Return ONLY the complete article in markdown format. Start with `# Headline` and write the full article. No JSON wrapping, no meta-commentary, no "Here is your article" preamble."""

KEYWORDS_SECTION = """
## Target Keywords

Naturally incorporate these keywords throughout the article (do NOT force or stuff them):
{keywords_list}"""

GUMSHOE_SECTION = """
## AI Visibility Context

The following Gumshoe analysis shows where the client currently has ZERO visibility in AI responses.
The article should specifically address the topics in the "Binding Checklist" to fill these gaps:

<gumshoe_context>
{gumshoe_summary}
</gumshoe_context>"""

SPOKESPERSON_SECTION = """
## Spokesperson

Include 1-2 attributed quotes from the client spokesperson:
- **Name:** {name}
- **Title:** {title}
- **Company:** {company}

Quotes should sound natural and expert, not promotional. Example tone: "What we're seeing is..." or "The challenge for investors is..." """

KEY_CLAIMS_SECTION = """
## Client Talking Points

Weave these claims/facts naturally into relevant sections (do NOT list them verbatim):
{claims_list}"""

VOICE_PROFILE_SECTION = """
## Voice Profile

Apply these voice/writing rules to the article's tone and style:

<voice_rules>
{voice_profile}
</voice_rules>

Follow these rules for word choice, sentence structure, and overall voice while maintaining the journalistic format above."""


class ArticleWriter:
    """Phase 1 — Generates journalistic articles from client data."""

    def __init__(self) -> None:
        settings = get_settings()
        self.primary_provider = None
        self.fallback_provider = None

        if settings.has_perplexity():
            self.primary_provider = PerplexityProvider(
                api_key=settings.perplexity_api_key,
                model=settings.perplexity_model,
            )
        if settings.has_anthropic():
            self.fallback_provider = AnthropicProvider(
                api_key=settings.anthropic_api_key,
                model="claude-sonnet-4-6",
            )

    async def write(self, input_data: ArticleInput) -> WriterOutput:
        """Generate an article from the input data."""
        if not self.primary_provider and not self.fallback_provider:
            raise RuntimeError("No AI providers configured for article writing")

        prompt = self._build_prompt(input_data)
        start_time = time.perf_counter()

        # Try primary (Perplexity) first for web-grounded data
        response: ProviderResponse | None = None
        provider_used = ""

        if self.primary_provider:
            response = await self.primary_provider.query(
                prompt,
                max_tokens=4096,
                system=WRITER_SYSTEM,
            )
            provider_used = "perplexity"

            if not response.success:
                logger.warning(f"Perplexity failed: {response.error}, falling back to Anthropic")
                response = None

        # Fallback to Anthropic (no web search capability)
        if not response and self.fallback_provider:
            response = await self.fallback_provider.query(
                prompt,
                max_tokens=4096,
                system=WRITER_SYSTEM_NO_SEARCH,
            )
            provider_used = "anthropic"

        if not response or not response.success:
            error = response.error if response else "No provider available"
            raise RuntimeError(f"Article generation failed: {error}")

        latency_ms = int((time.perf_counter() - start_time) * 1000)
        article_text = response.text.strip()

        # Strip citations block that Perplexity appends
        if "\n\n**Sources:**\n" in article_text:
            article_text = article_text.split("\n\n**Sources:**\n")[0].strip()

        # Extract title from first H1
        title = ""
        for line in article_text.split("\n"):
            line = line.strip()
            if line.startswith("# ") and not line.startswith("## "):
                title = line[2:].strip()
                break

        word_count = len(article_text.split())

        return WriterOutput(
            article_markdown=article_text,
            title=title,
            word_count=word_count,
            provider_used=provider_used,
            latency_ms=latency_ms,
        )

    def _build_prompt(self, data: ArticleInput) -> str:
        """Build the complete writer prompt from input data."""
        sections = [
            WRITER_BASE.format(
                article_topic=data.article_topic,
                client_name=data.client_name,
                domain=data.domain,
                industry=data.industry,
                target_word_count=data.target_word_count,
                tone=data.tone,
            )
        ]

        if data.target_keywords:
            sections.append(
                KEYWORDS_SECTION.format(
                    keywords_list="\n".join(f"- {kw}" for kw in data.target_keywords)
                )
            )

        if data.spokesperson:
            sections.append(
                SPOKESPERSON_SECTION.format(
                    name=data.spokesperson.name,
                    title=data.spokesperson.title,
                    company=data.spokesperson.company,
                )
            )

        if data.key_claims:
            sections.append(
                KEY_CLAIMS_SECTION.format(
                    claims_list="\n".join(f"- {claim}" for claim in data.key_claims)
                )
            )

        if data.gumshoe_payload:
            # Summarize for the writer — full payload goes to editor
            lines = data.gumshoe_payload.split("\n")
            summary_lines = lines[:50]  # First 50 lines of gumshoe data
            sections.append(
                GUMSHOE_SECTION.format(gumshoe_summary="\n".join(summary_lines))
            )

        if data.voice_profile:
            sections.append(
                VOICE_PROFILE_SECTION.format(voice_profile=data.voice_profile)
            )

        return "\n\n".join(sections)
