"""Lite report generator: LLM narrative synthesis + PDF rendering."""

import json
import logging
from datetime import datetime
from pathlib import Path

from app.config import get_settings
from app.models.lite_report import (
    ArticleTeaser,
    DiscoveryResult,
    LiteAnalysisResult,
)
from app.services.llm_utils import extract_json

logger = logging.getLogger(__name__)

SYNTHESIS_PROMPT = """You are the lead strategist at Fancy Robot, an AI visibility consultancy. You write like the best strategy decks: direct, opinionated, slightly provocative, and always grounded in specific data. You name problems like a consultant names frameworks — punchy 2-5 word labels that stick.

## Company Under Analysis
{company_name} ({domain})
Industry: {industry}
Description: {description}

## Raw AI Visibility Data
- Overall ARI Score: {overall_score}/100
- Mention Rate: {mention_rate_pct}% ({mentions_count} of {total_prompts} prompts)
- Total Prompts Tested: {total_prompts}

## Competitor Landscape
{competitor_data}

## Persona Breakdown
{persona_data}

## Topic Breakdown
{topic_data}

## Your Task
Analyze this data and produce ONLY valid JSON. Do not wrap in markdown code fences. Start with {{ and end with }}.

Be bold, specific, and data-driven. Never be generic or clinical.

key_findings guidelines: Generate exactly 5 findings. Start each with an emoji badge: 🔴 CRITICAL GAP, 🟢 STRENGTH, 🟡 OPPORTUNITY, or ⚠️ KEY INSIGHT. Use a mix of badges. Every finding must cite a specific number from the data.

strategic_recommendations guidelines: Generate exactly 5 recommendations. Start each with an ALL CAPS action verb header (e.g., REFRAME, OWN, PUBLISH, TARGET, AMPLIFY) followed by a specific recommendation and 1-2 sentence explanation.

{{
  "report_title": "A 3-6 word hook that captures the core insight about this brand's AI visibility. Think 'The Premium Bridesmaid' or 'Invisible to the Algorithm' or 'The Expertise Gap'. Make it memorable.",

  "core_finding": "Name the core problem in 2-5 words, like a consultant names a framework. Examples: 'The Premium Tax', 'The Decathlon Paradox', 'The Authority Vacuum'. This should be the single most important pattern in the data.",

  "core_finding_detail": "2-3 sentences explaining the named problem. Be specific: cite the actual mention rate, the competitor gap, the persona where it's worst. This should make the reader go 'oh, that's exactly right.'",

  "executive_summary": "2-3 paragraphs. First paragraph: open with what this company IS (their story, credentials, what makes them notable in their industry). Second paragraph: state the core tension — despite being [impressive thing], AI models [specific gap]. Cite the ARI score, mention rate, and the biggest competitor gap with actual numbers. Third paragraph: what this means and what's at stake. End with the score framed as either a warning or an opportunity.",

  "key_findings": [
    "// exactly 5 items, each starting with emoji badge (🔴, 🟢, 🟡, ⚠️) + finding with specific data"
  ],

  "strategic_recommendations": [
    "// exactly 5 items, each starting with ALL CAPS action verb + specific recommendation"
  ],

  "article_teasers": [
    {{
      "title": "Article title addressing a specific visibility gap",
      "rationale": "1-sentence explanation of why this article would improve AI visibility",
      "target_gap": "Which persona or topic gap this addresses"
    }},
    {{
      "title": "Second article title",
      "rationale": "1-sentence explanation",
      "target_gap": "Which gap this addresses"
    }},
    {{
      "title": "Third article title",
      "rationale": "1-sentence explanation",
      "target_gap": "Which gap this addresses"
    }}
  ],

  "headline_stat": "A punchy one-liner comparison. Be specific with a multiplier or stark contrast. Examples: 'Competitor X appears 18x more often than {company_name}' or '{company_name} is invisible in 3 of 4 audience segments' or 'AI recommends the competition X% more often'."
}}

CRITICAL RULES:
- Every finding and recommendation must reference SPECIFIC numbers from the data above
- The key_findings array must have EXACTLY 5 items, each starting with an emoji badge (🔴, 🟢, 🟡, or ⚠️)
- The strategic_recommendations array must have EXACTLY 5 items, each starting with an ALL CAPS action verb
- Be provocative but fair — name real problems, don't sugarcoat
- The report_title and core_finding should feel like something a client would remember and repeat"""


def _format_competitor_data(analysis: LiteAnalysisResult, company_name: str) -> str:
    """Format competitor data for the synthesis prompt.

    Annotates discovered competitors so the LLM strategist knows which
    entities surfaced organically vs. which were pre-identified.
    """
    lines = [
        f"- {company_name} (YOUR CLIENT): {analysis.mention_rate * 100:.0f}% mention rate",
        "",
        "NOTE: Competitors marked [AI-discovered] were NOT provided as inputs — "
        "the AI spontaneously recommended them, indicating genuine visibility.",
        "",
    ]
    for cs in analysis.competitor_scores:
        tag = " [AI-discovered]" if cs.source == "discovered" else ""
        parts = [f"- {cs.name}{tag}: {cs.mention_rate * 100:.0f}% mention rate"]
        if cs.avg_position is not None:
            parts.append(f"avg position {cs.avg_position:.1f}")
        if cs.ari_score is not None:
            parts.append(f"ARI score {cs.ari_score:.0f}")
        lines.append(", ".join(parts))
    return "\n".join(lines)


def _format_persona_data(analysis: LiteAnalysisResult) -> str:
    """Format persona data for the synthesis prompt."""
    lines = []
    for pb in analysis.persona_breakdown:
        line = f"- {pb.persona}: {pb.mention_rate * 100:.0f}% mention rate ({pb.mention_count}/{pb.total_prompts})"
        if pb.top_competitor:
            line += f" | Top competitor: {pb.top_competitor}"
        lines.append(line)
    return "\n".join(lines)


def _format_topic_data(analysis: LiteAnalysisResult) -> str:
    """Format topic data for the synthesis prompt."""
    lines = []
    for tb in analysis.topic_breakdown:
        lines.append(
            f"- {tb.topic}: {tb.mention_rate * 100:.0f}% mention rate ({tb.mention_count}/{tb.total_prompts})"
        )
    return "\n".join(lines)


async def synthesize(
    discovery: DiscoveryResult,
    analysis: LiteAnalysisResult,
) -> LiteAnalysisResult:
    """Use Claude Sonnet to produce narrative synthesis from raw analysis data.

    Mutates and returns the analysis object with filled-in narrative fields.
    """
    settings = get_settings()

    # Use OpenAI (reliable on Vercel serverless), fall back to Anthropic
    if settings.has_openai():
        from app.services.ai_providers.openai_provider import OpenAIProvider
        provider = OpenAIProvider(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )
    elif settings.has_anthropic():
        from app.services.ai_providers.anthropic_provider import AnthropicProvider
        provider = AnthropicProvider(
            api_key=settings.anthropic_api_key,
            model="claude-sonnet-4-6",
        )
    else:
        logger.warning("No AI provider available; skipping synthesis")
        return analysis

    prompt = SYNTHESIS_PROMPT.format(
        company_name=discovery.company_name,
        domain=discovery.domain,
        industry=discovery.industry,
        description=discovery.description,
        overall_score=f"{analysis.overall_score:.1f}",
        mention_rate_pct=f"{analysis.mention_rate * 100:.1f}",
        total_prompts=analysis.total_prompts,
        mentions_count=analysis.mentions_count,
        competitor_data=_format_competitor_data(analysis, discovery.company_name),
        persona_data=_format_persona_data(analysis),
        topic_data=_format_topic_data(analysis),
    )

    response = await provider.query(prompt, max_tokens=4096)

    if not response.success:
        logger.error(f"Synthesis LLM call failed: {response.error}")
        return analysis

    text = response.text
    logger.info(f"Synthesis response length: {len(text)} chars, tokens: {response.tokens_used}")

    try:
        data = extract_json(text)
        analysis.report_title = data.get("report_title", "")
        analysis.core_finding = data.get("core_finding", "")
        analysis.core_finding_detail = data.get("core_finding_detail", "")
        analysis.executive_summary = data.get("executive_summary", "")
        analysis.key_findings = data.get("key_findings", [])[:5]
        analysis.strategic_recommendations = data.get("strategic_recommendations", [])[:5]
        analysis.opportunities = data.get("opportunities", [])[:3]
        analysis.headline_stat = data.get("headline_stat", "")

        teasers = []
        for t in data.get("article_teasers", [])[:3]:
            teasers.append(
                ArticleTeaser(
                    title=t.get("title", ""),
                    rationale=t.get("rationale", ""),
                    target_gap=t.get("target_gap", ""),
                )
            )
        analysis.article_teasers = teasers

        populated = [k for k in ["report_title", "core_finding", "executive_summary",
                                  "headline_stat"] if getattr(analysis, k)]
        logger.info(f"Synthesis populated fields: {populated}, "
                     f"findings={len(analysis.key_findings)}, recs={len(analysis.strategic_recommendations)}, "
                     f"teasers={len(analysis.article_teasers)}")
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.error(f"Synthesis JSON parse failed: {e}\nRaw text (first 500): {text[:500]}")

    return analysis


def generate_pdf(discovery: DiscoveryResult, analysis: LiteAnalysisResult) -> bytes | None:
    """Generate a branded PDF from discovery + analysis data.

    Uses fpdf2 (pure Python) — works on Vercel serverless without system libs.
    """
    try:
        from app.services.pdf.lite_report_pdf import generate

        return generate(discovery, analysis)
    except Exception as e:
        logger.exception(f"PDF generation failed: {e}")
        return None
