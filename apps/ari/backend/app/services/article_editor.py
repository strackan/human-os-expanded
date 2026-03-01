"""Phase 2 — Article Editor service.

Hardens a draft article through a 5-pass editorial process:
  Pass 1: Fact-Check & Source Verification (web search)
  Pass 2: Structural & AIO Optimization (web search for current best practices)
  Pass 3: Voice & Tone Polish
  Pass 4: Client Integration Audit
  Pass 5: Gumshoe Binding (only if gumshoe_payload provided)

Uses Perplexity sonar (web search for passes 1-2) with Anthropic fallback.
"""

import logging
import re
import time

from app.config import get_settings
from app.models.article_pipeline import EditorInput, EditorOutput, EditorsLog, PassResult
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.ai_providers.perplexity_provider import PerplexityProvider

logger = logging.getLogger(__name__)


EDITOR_SYSTEM = (
    "You are a senior editor at a top-tier business publication. You are meticulous about "
    "factual accuracy, structural clarity, journalistic voice, and AI discoverability. "
    "You make precise, surgical edits — never rewriting from scratch. "
    "Search the web to verify facts, prices, regulations, and statistics. "
    "Return the hardened article followed by your Editor's Log."
)

EDITOR_PROMPT_4PASS = """## Editorial Assignment

You are editing the following draft article. Make **exactly four passes**, each with a specific focus. Apply all edits to a single output — do NOT return four separate versions.

### The Draft Article

<article>
{article_markdown}
</article>

### Client Context
- **Client:** {client_name}
- **Domain:** {domain}

---

## Pass 1: Fact-Check & Source Verification

- Verify all numbers, prices, dates, regulatory limits, and statistics via web search
- Flag and correct any outdated or inaccurate claims
- Ensure IRS rules, contribution limits, and fee ranges are current for 2026
- If a claim cannot be verified, soften the language (e.g., "typically" or "according to industry estimates")

## Pass 2: Structural & AIO Optimization

- Ensure every H2 heading reads as a clear topic label or natural question
- Add H3 sub-headings where sections exceed 200 words without a break
- Verify at least one bulleted list exists per major section
- Ensure sentences are self-contained and extractable (AI models cite individual sentences)
- Check that the opening sentence of each section is a standalone summary
- Verify the article has a scannable structure: heading → context → data → example → takeaway

## Pass 3: Voice & Tone Polish

- Maintain neutral journalistic voice throughout — remove any promotional language
- Replace superlatives ("best", "leading", "top") with specific evidence
- Ensure quotes (if any) sound natural and expert, not scripted
- Check for smooth transitions between sections
- Remove redundancy and filler

## Pass 4: Client Integration Audit

- Verify client appears in 30-40% of sections (not more, not fewer)
- Ensure client is introduced with context, not dropped in abruptly
- Check that no section reads as advertorial
- Verify at least one specific product/program/differentiator is mentioned
- Ensure the closing section mentions the client as ONE option, not the only option

---

## Output Format

Return the complete hardened article in markdown first, then on a new line write:

### Editor's Log

**Pass 1: Fact-Check & Source Verification**
- Changes: [list each specific change]
- Issues found: [count]

**Pass 2: Structural & AIO Optimization**
- Changes: [list each specific change]
- Issues found: [count]

**Pass 3: Voice & Tone Polish**
- Changes: [list each specific change]
- Issues found: [count]

**Pass 4: Client Integration Audit**
- Changes: [list each specific change]
- Issues found: [count]

**AIO Readiness Scorecard:**
- Heading clarity: [score]/10
- Extractable sentences: [score]/10
- Data density: [score]/10
- FAQ potential: [score]/10
- Entity specificity: [score]/10

**Summary:** [1-2 sentence summary of overall changes]"""


EDITOR_PROMPT_5PASS = """## Editorial Assignment

You are editing the following draft article. Make **exactly five passes**, each with a specific focus. Apply all edits to a single output — do NOT return five separate versions.

### The Draft Article

<article>
{article_markdown}
</article>

### Client Context
- **Client:** {client_name}
- **Domain:** {domain}

---

## Pass 1: Fact-Check & Source Verification

- Verify all numbers, prices, dates, regulatory limits, and statistics via web search
- Flag and correct any outdated or inaccurate claims
- Ensure IRS rules, contribution limits, and fee ranges are current for 2026
- If a claim cannot be verified, soften the language (e.g., "typically" or "according to industry estimates")

## Pass 2: Structural & AIO Optimization

- Ensure every H2 heading reads as a clear topic label or natural question
- Add H3 sub-headings where sections exceed 200 words without a break
- Verify at least one bulleted list exists per major section
- Ensure sentences are self-contained and extractable (AI models cite individual sentences)
- Check that the opening sentence of each section is a standalone summary
- Verify the article has a scannable structure: heading → context → data → example → takeaway

## Pass 3: Voice & Tone Polish

- Maintain neutral journalistic voice throughout — remove any promotional language
- Replace superlatives ("best", "leading", "top") with specific evidence
- Ensure quotes (if any) sound natural and expert, not scripted
- Check for smooth transitions between sections
- Remove redundancy and filler

## Pass 4: Client Integration Audit

- Verify client appears in 30-40% of sections (not more, not fewer)
- Ensure client is introduced with context, not dropped in abruptly
- Check that no section reads as advertorial
- Verify at least one specific product/program/differentiator is mentioned
- Ensure the closing section mentions the client as ONE option, not the only option

## Pass 5: Gumshoe AI Visibility Binding

The following Gumshoe analysis shows the client's current AI visibility gaps. The article MUST address every item in the Binding Checklist.

<gumshoe_payload>
{gumshoe_payload}
</gumshoe_payload>

For each Binding Checklist topic:
- Verify the article contains at least one substantive paragraph addressing the topic
- Ensure the client is mentioned in context of that topic
- If the topic is missing, ADD a relevant paragraph or expand an existing section
- Cross-reference competitor snippets to ensure the article is more specific and data-rich

---

## Output Format

Return the complete hardened article in markdown first, then on a new line write:

### Editor's Log

**Pass 1: Fact-Check & Source Verification**
- Changes: [list each specific change]
- Issues found: [count]

**Pass 2: Structural & AIO Optimization**
- Changes: [list each specific change]
- Issues found: [count]

**Pass 3: Voice & Tone Polish**
- Changes: [list each specific change]
- Issues found: [count]

**Pass 4: Client Integration Audit**
- Changes: [list each specific change]
- Issues found: [count]

**Pass 5: Gumshoe AI Visibility Binding**
- Changes: [list each specific change]
- Binding checklist items addressed: [list]
- Issues found: [count]

**AIO Readiness Scorecard:**
- Heading clarity: [score]/10
- Extractable sentences: [score]/10
- Data density: [score]/10
- FAQ potential: [score]/10
- Entity specificity: [score]/10

**Summary:** [1-2 sentence summary of overall changes]"""


class ArticleEditor:
    """Phase 2 — Hardens draft articles through multi-pass editorial review."""

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

    async def edit(self, input_data: EditorInput) -> EditorOutput:
        """Run the editorial process on a draft article."""
        if not self.primary_provider and not self.fallback_provider:
            raise RuntimeError("No AI providers configured for article editing")

        has_gumshoe = bool(input_data.gumshoe_payload and input_data.gumshoe_payload.strip())

        if has_gumshoe:
            prompt = EDITOR_PROMPT_5PASS.format(
                article_markdown=input_data.article_markdown,
                client_name=input_data.client_name,
                domain=input_data.domain,
                gumshoe_payload=input_data.gumshoe_payload,
            )
        else:
            prompt = EDITOR_PROMPT_4PASS.format(
                article_markdown=input_data.article_markdown,
                client_name=input_data.client_name,
                domain=input_data.domain,
            )

        start_time = time.perf_counter()
        response = None
        provider_used = ""

        if self.primary_provider:
            response = await self.primary_provider.query(
                prompt,
                max_tokens=8000,
                system=EDITOR_SYSTEM,
            )
            provider_used = "perplexity"
            if not response.success:
                logger.warning(f"Perplexity failed: {response.error}, falling back to Anthropic")
                response = None

        if not response and self.fallback_provider:
            response = await self.fallback_provider.query(
                prompt,
                max_tokens=8000,
                system=EDITOR_SYSTEM,
            )
            provider_used = "anthropic"

        if not response or not response.success:
            error = response.error if response else "No provider available"
            raise RuntimeError(f"Article editing failed: {error}")

        latency_ms = int((time.perf_counter() - start_time) * 1000)
        full_text = response.text.strip()

        # Strip Perplexity citation block
        if "\n\n**Sources:**\n" in full_text:
            full_text = full_text.split("\n\n**Sources:**\n")[0].strip()

        # Split article from Editor's Log
        article_md, editors_log = self._split_article_and_log(full_text)
        word_count = len(article_md.split())

        return EditorOutput(
            hardened_markdown=article_md,
            editors_log=editors_log,
            word_count=word_count,
            provider_used=provider_used,
            latency_ms=latency_ms,
        )

    def _split_article_and_log(self, text: str) -> tuple[str, EditorsLog]:
        """Split the LLM response into article body and parsed Editor's Log."""
        # Look for the Editor's Log delimiter
        delimiters = ["### Editor's Log", "## Editor's Log", "**Editor's Log**"]
        split_idx = -1
        for delim in delimiters:
            idx = text.find(delim)
            if idx != -1:
                split_idx = idx
                break

        if split_idx == -1:
            # No log found — return full text as article
            return text, EditorsLog(summary="Editor's Log not found in response")

        article_md = text[:split_idx].strip()
        log_text = text[split_idx:]

        # Parse the log
        editors_log = self._parse_editors_log(log_text)
        return article_md, editors_log

    def _parse_editors_log(self, log_text: str) -> EditorsLog:
        """Parse the Editor's Log text into structured data."""
        passes: list[PassResult] = []
        total_changes = 0

        # Find each pass section
        pass_pattern = re.compile(
            r"\*\*Pass (\d+):\s*(.+?)\*\*\s*\n(.*?)(?=\*\*Pass \d+:|\*\*AIO|\*\*Summary|$)",
            re.DOTALL,
        )

        for match in pass_pattern.finditer(log_text):
            pass_name = f"Pass {match.group(1)}: {match.group(2).strip()}"
            content = match.group(3).strip()

            # Extract changes
            changes: list[str] = []
            for line in content.split("\n"):
                line = line.strip()
                if line.startswith("- ") and not line.startswith("- Issues found:") and not line.startswith("- Binding checklist"):
                    # Strip "Changes: " prefix if present
                    change_text = line[2:]
                    if change_text.lower().startswith("changes:"):
                        change_text = change_text[8:].strip()
                    if change_text:
                        changes.append(change_text)

            # Extract issues count
            issues = 0
            issues_match = re.search(r"Issues found:\s*(\d+)", content)
            if issues_match:
                issues = int(issues_match.group(1))

            total_changes += len(changes)
            passes.append(PassResult(
                pass_name=pass_name,
                changes_made=changes,
                issues_found=issues,
            ))

        # Extract AIO scorecard
        scorecard: dict[str, int | str] = {}
        scorecard_pattern = re.compile(r"-\s*(.+?):\s*(\d+)/10")
        for match in scorecard_pattern.finditer(log_text):
            scorecard[match.group(1).strip().lower().replace(" ", "_")] = int(match.group(2))

        # Extract summary
        summary = ""
        summary_match = re.search(r"\*\*Summary:\*\*\s*(.+?)(?:\n\n|$)", log_text, re.DOTALL)
        if summary_match:
            summary = summary_match.group(1).strip()

        return EditorsLog(
            passes=passes,
            total_changes=total_changes,
            aio_scorecard=scorecard,
            summary=summary,
        )
