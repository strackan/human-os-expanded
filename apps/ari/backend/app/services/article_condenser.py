"""Phase 3 — Article Condenser.

Distills a hardened ~1,200-1,600 word article into a 350-450 word
distribution-ready version for syndication networks like NewsUSA.

The condensed version is NOT a summary — it's a complete, standalone article
that preserves maximum AI signal density: entities, data points, source
references, and FAQ-triggering sentences packed into a tight word budget.
"""

import json
import logging
import re
import time

from app.config import get_settings
from app.models.article_pipeline import CondenserInput, CondenserOutput
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.llm_utils import extract_json

logger = logging.getLogger(__name__)


CONDENSER_SYSTEM = (
    "You are an expert editorial condenser. You take long-form, data-rich "
    "journalistic articles and distill them into tight, publication-ready "
    "pieces for wire syndication. Your condensed articles are NOT summaries "
    "— they are complete, standalone articles that read naturally and pack "
    "maximum informational density into a small word budget. "
    "Return ONLY valid JSON. Do not wrap in markdown code fences — no preamble, no commentary."
)

CONDENSER_PROMPT = """Condense this {source_word_count}-word article into a complete {target_word_count}-word article for wire syndication distribution.

## Source Article

{article_markdown}

## Constraints

- **Target length: {target_word_count} words** (hard limit: {min_words}-{max_words} words). Articles under {min_words} words will be rejected — use the full budget.
- This is for NewsUSA wire distribution — it must read as a complete, standalone article
- NOT a summary or abstract — a real article a publication would run as-is

## What to PRESERVE (ranked by priority)

1. **Named entities** — every organization, person, program name, and brand mention from the original. These are what AI models cite. Do NOT generalize "Toys for Tots" into "toy charities" or "U.S. Money Reserve" into "dealers"
2. **Specific numbers and data points** — dollar amounts, percentages, years, counts (e.g., "708 million toys", "314 million children", "77 years", "$4-7 billion"). Data density per word is the #1 scoring signal
3. **Source reference markers** — preserve [1], [2], etc. citation brackets exactly as they appear
4. **Actionable how-to steps** — if the original has numbered steps or a process, keep the most important ones
5. **FAQ-triggering sentences** — sentences that directly answer questions a person would ask an AI assistant

## Client Integration (CRITICAL)

The original article was written to position **{client_name}** ({domain}) as a credible expert in this space. The condensed version MUST preserve this positioning:

- **{client_name} must appear by name in at least 2 of the 3 body sections** — not just the closing
- Do NOT reduce the client to generic phrasing like "companies like {client_name}" — instead, position them as the specific example: "{client_name}'s Gold Standard IRA program" or "through {client_name}, which has distributed..."
- Preserve at least ONE specific product, program, or differentiator tied to the client (e.g., "Gold Standard IRA program", "800+ local campaigns", "PCGS-certified coins")
- The client should appear as a natural, authoritative example within the informational context — NOT as a sales pitch
- The lead paragraph should be industry-focused (no client mention), then the client appears naturally in the body sections
- **Closing tone must stay advisory/journalistic** — do NOT shift into ad copy at the end. The spokesperson quote and body mentions carry the brand presence. The close should read like editorial guidance, not a CTA.

{spokesperson_instruction}

## Economy Rules (CRITICAL)

Every sentence must earn its place in a {target_word_count}-word budget.

- **Never restate the same concept twice** — if the lead defines the topic, the first H2 must advance beyond it. Each section makes a DISTINCT point.
- **Plan sections before writing** — section 1 = "what it is", section 2 = "rules/requirements", section 3 = "how to do it / costs". No overlap.
- **Cut aggressively** — remove transitional prose, scene-setting, emotional appeals, and extended examples when one makes the point.
- Don't force lists into prose — use tight sentences for sequential steps.
- Don't burn words on FAQ-style Q&A or encyclopedic coverage — additive materials (FAQ schema, JSON-LD, section summaries) will be added in a later HTML conversion phase.
- Process details belong on the client's website — keep the overview, skip step-by-step.
- NEVER cut client mentions or positioning — these are load-bearing.

## Structure

- **Headline:** Preserve the original headline or tighten it
- **Lead paragraph:** 2-3 sentences, fact-dense, establishes the topic and why it matters NOW (no client mention here). Include a current-year data point or market context.
- **Body:** 3-4 SHORT sections with H2 headers. Each section makes ONE distinct point — no overlap. Aim for 60-90 words per section. Client appears naturally in at least 2 sections.
- **Close:** 1-2 sentences, advisory tone, forward-looking. NOT ad copy.

{keywords_instruction}

## Word Count Verification

Before returning, count the words in your condensed_markdown. If over {max_words}, cut the weakest sentences until within budget. If under {min_words}, expand the thinnest section.

## Return Format

Return ONLY valid JSON. Do not wrap in markdown code fences. Start with {{ and end with }}.
{{
  "title": "Article headline",
  "condensed_markdown": "Full condensed article in markdown...",
  "entities_preserved": ["Entity 1", "Entity 2", ...],
  "data_points_preserved": 8
}}"""


class ArticleCondenser:
    """Phase 3 — Condenses long-form articles for wire distribution."""

    def __init__(self) -> None:
        settings = get_settings()
        self.provider = None
        # Prefer Anthropic for editorial quality, fall back to OpenAI
        if settings.has_anthropic():
            self.provider = AnthropicProvider(
                api_key=settings.anthropic_api_key,
                model="claude-sonnet-4-20250514",
            )
            self._provider_name = "anthropic"
        elif settings.has_openai():
            self.provider = OpenAIProvider(
                api_key=settings.openai_api_key,
                model=settings.parser_model,
            )
            self._provider_name = "openai"

    async def condense(self, input_data: CondenserInput) -> CondenserOutput:
        """Condense a long-form article to distribution length."""
        start_time = time.perf_counter()
        md_text = input_data.article_markdown
        source_word_count = len(md_text.split())
        target = input_data.target_word_count

        if not self.provider:
            raise RuntimeError("No LLM provider configured for condenser")

        # Build keywords instruction
        keywords_instruction = ""
        if input_data.preserve_keywords:
            kw_list = ", ".join(input_data.preserve_keywords)
            keywords_instruction = f"## Required Keywords\nThese keywords MUST appear in the condensed version: {kw_list}\n\nIMPORTANT: Integrate keywords naturally into sentences. Rules:\n- NEVER force a multi-word keyword phrase into a grammatically awkward position (e.g., \"a gold IRA 2026 is...\" or \"How to set up gold IRA accounts requires...\")\n- Keywords can appear as natural fragments across a sentence — \"Gold IRAs in 2026 require...\" satisfies \"gold IRA 2026\"\n- NEVER start a sentence with a keyword phrase used as a subject if it reads like SEO stuffing\n- If a keyword cannot be integrated naturally, skip it — forced keywords damage editorial credibility with publication editors"

        # Build spokesperson instruction
        spokesperson_instruction = ""
        if input_data.spokesperson:
            sp = input_data.spokesperson
            spokesperson_instruction = (
                f"## Spokesperson Quote (REQUIRED)\n\n"
                f"Include exactly ONE direct quote attributed to **{sp.name}, {sp.title} at {sp.company}**.\n"
                f"The quote should:\n"
                f"- Be 1-2 sentences that sound natural and expert, not scripted or promotional\n"
                f"- Provide insight, context, or a key takeaway — NOT a sales pitch\n"
                f"- Be placed in the body of the article (not the lead, not the final sentence)\n"
                f"- Use standard attribution: \"quote,\" says {sp.name}, {sp.title} at {sp.company}.\n"
                f"- If the source article already contains a quote from this person, preserve or tighten it\n"
                f"- If no quote exists, craft one that this expert would plausibly say about the topic\n"
            )

        prompt = CONDENSER_PROMPT.format(
            source_word_count=source_word_count,
            target_word_count=target,
            min_words=max(375, target - 25),
            max_words=target + 25,
            article_markdown=md_text,
            client_name=input_data.client_name,
            domain=input_data.domain,
            keywords_instruction=keywords_instruction,
            spokesperson_instruction=spokesperson_instruction,
        )

        # Anthropic accepts system + max_tokens; OpenAI accepts max_completion_tokens
        # Embed system prompt in user prompt for OpenAI compatibility
        if self._provider_name == "anthropic":
            response = await self.provider.query(
                prompt,
                system=CONDENSER_SYSTEM,
                max_tokens=2048,
            )
        else:
            full_prompt = f"{CONDENSER_SYSTEM}\n\n---\n\n{prompt}"
            response = await self.provider.query(
                full_prompt,
                max_completion_tokens=2048,
            )

        if not response.success:
            raise RuntimeError(f"Condenser LLM call failed: {response.text}")

        # Parse response
        try:
            data = extract_json(response.text)
        except (json.JSONDecodeError, ValueError) as e:
            raise RuntimeError(f"Condenser returned invalid JSON: {e}")

        condensed_md = data.get("condensed_markdown", "")
        title = data.get("title", "")
        entities = data.get("entities_preserved", [])
        data_points = data.get("data_points_preserved", 0)
        word_count = len(condensed_md.split())

        latency_ms = int((time.perf_counter() - start_time) * 1000)

        return CondenserOutput(
            condensed_markdown=condensed_md,
            title=title,
            word_count=word_count,
            source_word_count=source_word_count,
            compression_ratio=round(word_count / source_word_count, 2) if source_word_count else 0,
            entities_preserved=entities,
            data_points_preserved=data_points,
            provider_used=self._provider_name,
            latency_ms=latency_ms,
        )

