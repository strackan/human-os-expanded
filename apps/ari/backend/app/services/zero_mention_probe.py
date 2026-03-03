"""Zero-mention probe: diagnose WHY a brand gets zero mentions.

After the main analysis loop completes, detect zero-mention cases and fire
two focused probe questions per trigger to surface actionable insights.
"""

import asyncio
import json
import logging
import re
from typing import Any, Callable

from app.models.lite_report import DiscoveryResult, LiteAnalysisResult
from app.models.audit import AuditAnalysisResult, BrandProfile
from app.models.zero_mention_probe import (
    KnowledgeLevel,
    ProbeGapType,
    ProbeType,
    ZeroMentionProbeResult,
)
from app.services.ai_providers.base import AIProviderBase

logger = logging.getLogger(__name__)

# ── Probe prompt templates ───────────────────────────────────────────

KNOWLEDGE_CHECK_TEMPLATE = """I noticed {brand} wasn't in your recommendations for {context}. Are you familiar with {brand}? What do you know about their {category} offerings?

After your explanation, provide a JSON summary on its own line:
{{"knowledge_level": "unknown" | "vaguely_known" | "known_but_not_competitive", "key_insight": "one sentence explaining why they weren't recommended", "suggested_actions": ["action 1", "action 2"]}}"""

GAP_DIAGNOSIS_TEMPLATE = """If I specifically wanted {brand} included in top {category} recommendations for {context}, what would {brand} need to do differently, or how would I need to ask the question differently?

After your explanation, provide a JSON summary on its own line:
{{"gap_types": ["content_gap" | "authority_gap" | "category_mismatch" | "prompt_sensitivity" | "recency_gap"], "key_insight": "one sentence diagnosis", "suggested_actions": ["action 1", "action 2"]}}"""


def _extract_tail_json(text: str) -> dict:
    """Extract the last JSON object from LLM response text."""
    # Find all JSON-like objects in the text
    matches = list(re.finditer(r'\{[^{}]*\}', text))
    if not matches:
        return {}
    # Take the last match (the summary JSON)
    try:
        return json.loads(matches[-1].group())
    except (json.JSONDecodeError, ValueError):
        return {}


# ── Trigger detection ────────────────────────────────────────────────

def detect_lite_zero_mentions(
    discovery: DiscoveryResult,
    analysis: LiteAnalysisResult,
) -> list[dict[str, str]]:
    """Detect zero-mention triggers from lite analysis results.

    Returns a list of trigger dicts with keys: type, persona, topic, context.
    """
    triggers: list[dict[str, str]] = []

    # If overall mention rate is zero, single "overall" trigger (skip per-persona)
    if analysis.mention_rate == 0.0:
        context = f"{discovery.entity_type} recommendations"
        triggers.append({
            "type": "overall",
            "persona": "",
            "topic": "",
            "context": context,
        })
        return triggers

    # Per-persona zero mentions
    for pb in analysis.persona_breakdown:
        if pb.mention_count == 0 and pb.total_prompts > 0:
            triggers.append({
                "type": "persona",
                "persona": pb.persona,
                "topic": "",
                "context": f"{discovery.entity_type} recommendations for a {pb.persona}",
            })

    # Per-topic zero mentions
    for tb in analysis.topic_breakdown:
        if tb.mention_count == 0 and tb.total_prompts > 0:
            triggers.append({
                "type": "topic",
                "persona": "",
                "topic": tb.topic,
                "context": f"{discovery.entity_type} for {tb.topic}",
            })

    return triggers


def detect_audit_zero_mentions(
    profile: BrandProfile,
    analysis: AuditAnalysisResult,
) -> list[dict[str, str]]:
    """Detect zero-mention triggers from audit analysis results.

    Returns a list of trigger dicts with keys: type, dimension, persona, context.
    """
    triggers: list[dict[str, str]] = []
    category = profile.entity_type or profile.industry

    # Per-dimension zero mentions
    for ds in analysis.dimension_scores:
        if ds.mention_rate == 0.0 and ds.prompt_count > 0:
            dim_label = ds.dimension.value.replace("_", " ")
            triggers.append({
                "type": "dimension",
                "dimension": ds.dimension.value,
                "persona": "",
                "topic": "",
                "context": f"{category} {dim_label} prompts",
            })

    # Per-persona zero mentions
    for persona, rate in analysis.persona_breakdown.items():
        if rate == 0.0:
            triggers.append({
                "type": "persona",
                "dimension": "",
                "persona": persona,
                "topic": "",
                "context": f"{category} recommendations for a {persona}",
            })

    return triggers


# ── Probe execution ──────────────────────────────────────────────────

async def run_probes(
    brand_name: str,
    category: str,
    triggers: list[dict[str, str]],
    provider: AIProviderBase,
    on_progress: Callable[[dict], None] | None = None,
    max_probes: int = 6,
) -> list[ZeroMentionProbeResult]:
    """Run knowledge check + gap diagnosis probes for each trigger.

    Args:
        brand_name: The brand being analyzed.
        category: The brand's category/entity type.
        triggers: List of trigger dicts from detect_*_zero_mentions.
        provider: The AI provider to use for probes.
        on_progress: Optional progress callback.
        max_probes: Maximum number of triggers to probe (default 6).

    Returns:
        List of ZeroMentionProbeResult objects.
    """
    results: list[ZeroMentionProbeResult] = []
    semaphore = asyncio.Semaphore(3)
    lock = asyncio.Lock()

    capped_triggers = triggers[:max_probes]

    async def run_single_probe(trigger: dict[str, str], probe_type: ProbeType):
        context = trigger["context"]

        if probe_type == ProbeType.KNOWLEDGE_CHECK:
            prompt = KNOWLEDGE_CHECK_TEMPLATE.format(
                brand=brand_name, context=context, category=category,
            )
        else:
            prompt = GAP_DIAGNOSIS_TEMPLATE.format(
                brand=brand_name, context=context, category=category,
            )

        async with semaphore:
            response = await provider.query(prompt)

        if not response.success:
            logger.warning(f"Probe {probe_type.value} failed for {context}: {response.error}")
            return

        raw = response.text
        parsed = _extract_tail_json(raw)

        result = ZeroMentionProbeResult(
            probe_type=probe_type,
            persona=trigger.get("persona", ""),
            topic=trigger.get("topic", ""),
            dimension=trigger.get("dimension", ""),
            provider=provider.model,
            raw_response=raw,
            key_insight=parsed.get("key_insight", ""),
            suggested_actions=parsed.get("suggested_actions", []),
        )

        # Parse probe-type-specific fields
        if probe_type == ProbeType.KNOWLEDGE_CHECK:
            level_str = parsed.get("knowledge_level", "unknown")
            try:
                result.knowledge_level = KnowledgeLevel(level_str)
            except ValueError:
                result.knowledge_level = KnowledgeLevel.UNKNOWN
        else:
            gap_strs = parsed.get("gap_types", [])
            for g in gap_strs:
                try:
                    result.gap_types.append(ProbeGapType(g))
                except ValueError:
                    pass

        async with lock:
            results.append(result)

        if on_progress:
            on_progress({
                "type": "probe_result",
                "probe_type": probe_type.value,
                "persona": result.persona,
                "topic": result.topic,
                "dimension": result.dimension,
                "knowledge_level": result.knowledge_level.value,
                "key_insight": result.key_insight,
            })

    # Fire both probes per trigger concurrently
    tasks = []
    for trigger in capped_triggers:
        tasks.append(run_single_probe(trigger, ProbeType.KNOWLEDGE_CHECK))
        tasks.append(run_single_probe(trigger, ProbeType.GAP_DIAGNOSIS))

    await asyncio.gather(*tasks, return_exceptions=True)

    return results
