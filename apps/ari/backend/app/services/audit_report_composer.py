"""Multi-stage audit report composer.

Generates the Fancy Robot-quality narrative report via 6 focused LLM calls:
1. Executive Summary
2. The Core Problem (named)
3. Competitive Landscape narrative
4. Dimension Analysis
5. Strategic Recommendations
6. Pitch Hook

Tone: direct, opinionated, no hedging, specific evidence, consultant briefing a founder.
"""

import json
import logging

from app.config import get_settings
from app.models.audit import (
    AuditAnalysisResult,
    AuditReport,
    BrandProfile,
    DetectedAntiPattern,
    GapAnalysis,
    SEVERITY_DISPLAY,
)
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.llm_utils import extract_json

logger = logging.getLogger(__name__)

# Shared tone directive injected into all prompts
TONE_DIRECTIVE = """
TONE: You are a senior AI visibility consultant writing a private briefing for the company's founder/CEO.
Be direct and opinionated. No hedging, no "it's important to note" filler. Use specific data points.
Write like a McKinsey partner who actually cares about the outcome. Slightly provocative.
Reference specific prompts, competitors, and numbers wherever possible.
"""


class AuditReportComposer:
    """Composes the full audit report through 6 focused LLM synthesis stages."""

    def __init__(self):
        settings = get_settings()
        self.provider = AnthropicProvider(
            api_key=settings.anthropic_api_key,
            model="claude-sonnet-4-6",
        )

    async def compose(
        self,
        profile: BrandProfile,
        analysis: AuditAnalysisResult,
        anti_patterns: list[DetectedAntiPattern],
        gaps: list[GapAnalysis],
        on_progress=None,
    ) -> AuditReport:
        """Compose the full audit report through 6 synthesis stages.

        Args:
            profile: Brand profile
            analysis: Scored analysis results
            anti_patterns: Detected anti-patterns
            gaps: Priority-sorted gap analysis
            on_progress: Optional callback for progress updates
        """
        report = AuditReport()

        def emit(stage: str):
            if on_progress:
                on_progress({"type": "report_stage", "stage": stage})

        # Build shared context block used across all prompts
        ctx = self._build_context(profile, analysis, anti_patterns, gaps)

        # Stage 1: Executive Summary
        emit("executive_summary")
        report.executive_summary = await self._compose_executive_summary(ctx)

        # Stage 2: Core Problem
        emit("core_problem")
        problem_name, problem_text = await self._compose_core_problem(ctx)
        report.core_problem_name = problem_name
        report.core_problem = problem_text

        # Stage 3: Competitive Landscape
        emit("competitive_landscape")
        report.competitive_landscape = await self._compose_competitive_landscape(ctx)

        # Stage 4: Dimension Analysis
        emit("dimension_analysis")
        report.dimension_analysis = await self._compose_dimension_analysis(ctx)

        # Stage 5: Recommendations
        emit("recommendations")
        report.recommendations = await self._compose_recommendations(ctx, gaps)

        # Stage 6: Pitch Hook
        emit("pitch_hook")
        report.pitch_hook = await self._compose_pitch_hook(ctx, report.core_problem_name)

        # Assemble full markdown
        report.full_markdown = self._assemble_markdown(profile, analysis, report)

        return report

    def _build_context(
        self,
        profile: BrandProfile,
        analysis: AuditAnalysisResult,
        anti_patterns: list[DetectedAntiPattern],
        gaps: list[GapAnalysis],
    ) -> str:
        """Build the shared context block for all synthesis prompts."""
        # Competitor rates
        comp_lines = []
        for name, rate in sorted(
            analysis.competitor_mention_rates.items(),
            key=lambda x: x[1],
            reverse=True,
        ):
            comp_lines.append(f"  - {name}: {rate*100:.0f}%")
        comp_str = "\n".join(comp_lines) if comp_lines else "  No competitor data"

        # Dimension scores
        dim_lines = []
        for ds in analysis.dimension_scores:
            dim_lines.append(
                f"  - {ds.dimension.value}: {ds.mention_rate*100:.0f}% mention rate, "
                f"score {ds.score:.0f}/100"
            )
        dim_str = "\n".join(dim_lines) if dim_lines else "  No dimension data"

        # Provider scores
        prov_lines = []
        for ps in analysis.provider_scores:
            prov_lines.append(
                f"  - {ps.provider}: {ps.mention_rate*100:.0f}% mention rate, "
                f"score {ps.score:.0f}/100"
            )
        prov_str = "\n".join(prov_lines) if prov_lines else "  No provider data"

        # Anti-patterns
        ap_lines = []
        for ap in anti_patterns:
            ap_lines.append(f"  - {ap.display_name} ({ap.severity}): {ap.evidence[:150]}")
        ap_str = "\n".join(ap_lines) if ap_lines else "  None detected"

        # Founder info
        founder_str = "Unknown"
        if profile.founders:
            f = profile.founders[0]
            founder_str = f"{f.name}, {f.title}. {f.background}"

        severity = SEVERITY_DISPLAY.get(analysis.severity_band, str(analysis.severity_band))

        return f"""## Brand: {profile.company_name}
Domain: {profile.domain}
Industry: {profile.industry}
Description: {profile.description}
Founder/Leader: {founder_str}
Awards: {', '.join(profile.awards[:3]) if profile.awards else 'None identified'}

## ARI Score: {analysis.overall_ari:.1f}/100 — {severity}
- Mention Frequency: {analysis.mention_frequency:.0f}% (40% weight)
- Position Quality: {analysis.position_quality:.0f}/100 (25% weight)
- Narrative Accuracy: {analysis.narrative_accuracy:.0f}/100 (20% weight)
- Founder Retrieval: {analysis.founder_retrieval:.0f}/100 (15% weight)

## Competitor Mention Rates
  {profile.company_name}: {analysis.mention_frequency:.0f}%
{comp_str}

## Dimension Scores
{dim_str}

## Provider Scores
{prov_str}

## Anti-Patterns Detected
{ap_str}

## Total: {analysis.total_prompts} unique prompts, {analysis.total_responses} total responses across {len(analysis.provider_scores)} AI models
"""

    async def _llm_call(self, prompt: str) -> str:
        """Make a single LLM call and return the text."""
        response = await self.provider.query(prompt)
        if not response.success:
            logger.error(f"Report composition LLM call failed: {response.error}")
            return ""
        return response.text

    async def _compose_executive_summary(self, ctx: str) -> str:
        prompt = f"""{TONE_DIRECTIVE}

Write a 2-3 paragraph executive summary (200-300 words) for this AI visibility audit.

{ctx}

Requirements:
- First paragraph: Make the founder/CEO feel "seen" — cite their specific credentials, company history, or unique position. Then state the core gap.
- Second paragraph: Concrete data — the ARI score, how it compares to competitors, which dimensions are strongest/weakest.
- Third paragraph (optional): What this means strategically — the opportunity or risk.
- NO filler sentences. Every sentence must carry data or insight.
- Write in plain text (no markdown headers)."""

        return await self._llm_call(prompt)

    async def _compose_core_problem(self, ctx: str) -> tuple[str, str]:
        prompt = f"""{TONE_DIRECTIVE}

Name the core problem this brand faces in AI visibility (150-200 words for the explanation). Give it a 3-5 word name (like "The Premium Tax" or "The Mint Director Nobody Knows" or "The Decathlon Paradox").

{ctx}

Return ONLY valid JSON. Do not wrap in markdown code fences. Start with {{ and end with }}.
{{
  "problem_name": "The [Name] [Something]",
  "explanation": "2-3 paragraphs explaining what the problem is, why it's happening, and which anti-patterns contribute to it. Be specific with data. Reference competitors by name."
}}"""

        text = await self._llm_call(prompt)
        try:
            data = extract_json(text)
            return data.get("problem_name", "The Visibility Gap"), data.get("explanation", "")
        except (json.JSONDecodeError, ValueError):
            return "The Visibility Gap", text

    async def _compose_competitive_landscape(self, ctx: str) -> str:
        prompt = f"""{TONE_DIRECTIVE}

Write the competitive landscape section (300-400 words) as a NARRATIVE (not a table). Show the AI-perceived hierarchy.

{ctx}

Requirements:
- Who "owns" the category in AI's mind? Why?
- Where does our brand slot in? What's above and below?
- Which competitors are surprisingly strong or weak?
- Slightly provocative tone — make the reader feel the urgency.
- 3-4 paragraphs, plain text."""

        return await self._llm_call(prompt)

    async def _compose_dimension_analysis(self, ctx: str) -> str:
        prompt = f"""{TONE_DIRECTIVE}

Write the dimension-by-dimension analysis section (400-500 words).

{ctx}

Requirements:
- For each dimension with notable findings, describe what happened.
- Bold the dimension name at the start of each section.
- Reference specific prompt types and what AI models returned.
- 2-4 sentences per dimension. Skip dimensions with nothing notable.
- Plain text with dimension names as headers."""

        return await self._llm_call(prompt)

    async def _compose_recommendations(
        self, ctx: str, gaps: list[GapAnalysis]
    ) -> str:
        gap_lines = []
        for i, g in enumerate(gaps[:8]):
            gap_lines.append(
                f"{i+1}. [{g.gap_type.value}] {g.description} "
                f"(priority: {g.priority_score:.2f})"
            )
        gaps_str = "\n".join(gap_lines) if gap_lines else "No gaps identified"

        prompt = f"""{TONE_DIRECTIVE}

Write 5-10 specific strategic recommendations (300-400 words total), priority-ordered.

{ctx}

## Priority Gaps
{gaps_str}

Requirements:
- Each recommendation starts with an ALL CAPS action verb (e.g., "PUBLISH", "CREATE", "RESTRUCTURE", "LAUNCH")
- Reference specific prompts, competitors, personas, or dimensions
- Be actionable — not "improve your SEO" but "PUBLISH a comparison guide: '[Company] vs [Competitor]: Which is better for [Topic]'"
- Priority order: most impactful first
- Numbered list, 2-3 sentences each"""

        return await self._llm_call(prompt)

    async def _compose_pitch_hook(self, ctx: str, problem_name: str) -> str:
        prompt = f"""{TONE_DIRECTIVE}

Write a pitch hook (100-150 words) — 3-4 lines that follow this formula:
1. Credential/achievement that establishes the founder/company's authority
2. What AI actually says (the gap)
3. The disconnect/sting
4. Closer that implies "we can fix this"

The core problem is called "{problem_name}".

{ctx}

Requirements:
- Must "sting" — the reader should feel the urgency
- Designed to be screenshot-able or copy-pasted into an email
- 3-4 lines maximum. No fluff.
- Write it as a blockquote (no markdown, just the text)"""

        return await self._llm_call(prompt)

    def _assemble_markdown(
        self,
        profile: BrandProfile,
        analysis: AuditAnalysisResult,
        report: AuditReport,
    ) -> str:
        """Assemble all sections into the full markdown report."""
        severity = SEVERITY_DISPLAY.get(analysis.severity_band, str(analysis.severity_band))

        sections = [
            f"# AI Visibility Audit: {profile.company_name}",
            f"**Domain:** {profile.domain}  ",
            f"**Industry:** {profile.industry}  ",
            f"**ARI Score:** {analysis.overall_ari:.1f}/100 — {severity}  ",
            f"**Analysis:** {analysis.total_prompts} prompts across {len(analysis.provider_scores)} AI models  ",
            "",
            "---",
            "",
            "## Executive Summary",
            "",
            report.executive_summary,
            "",
            "---",
            "",
            f"## The Core Problem: {report.core_problem_name}",
            "",
            report.core_problem,
            "",
            "---",
            "",
            "## Competitive Landscape",
            "",
            report.competitive_landscape,
            "",
            "---",
            "",
            "## Dimension Analysis",
            "",
            report.dimension_analysis,
            "",
            "---",
            "",
            "## Strategic Recommendations",
            "",
            report.recommendations,
            "",
            "---",
            "",
            "## The Pitch",
            "",
            f"> {report.pitch_hook}",
            "",
            "---",
            "",
            "## Methodology",
            "",
            f"This audit tested {profile.company_name} across {analysis.total_prompts} unique prompts "
            f"distributed across 8 dimensions, queried against {len(analysis.provider_scores)} AI models "
            f"(OpenAI, Anthropic, Perplexity, Google Gemini). Responses were parsed for entity mentions, "
            f"position rankings, recommendation types, and sentiment. The ARI score uses a 4-factor "
            f"weighted formula: Mention Frequency (40%), Position Quality (25%), Narrative Accuracy (20%), "
            f"and Founder Retrieval (15%).",
            "",
            "---",
            "",
            "*Prepared by Fancy Robot AI Intelligence Division*  ",
            "*Powered by the ARI (AI Recommendation Index) Platform*",
        ]

        return "\n".join(sections)


