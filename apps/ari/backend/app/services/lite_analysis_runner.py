"""Lite analysis runner: generates prompt matrix and queries a single LLM for the snapshot report."""

import asyncio
import logging
from dataclasses import dataclass
from typing import Callable

from app.config import get_settings
from app.models.lite_report import (
    CompetitorScore,
    DiscoveryResult,
    LiteAnalysisResult,
    PersonaBreakdown,
    TopicBreakdown,
)
from app.models.response import ParsedMention, RecommendationType
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.response_parser import ResponseParser
from app.services.scoring_engine import ScoringEngine
from app.storage.supabase_entities import find_or_create_entity, update_entity_ari_score
from app.services.event_emitter import emit_score_event

logger = logging.getLogger(__name__)

# Open-ended prompt templates — never name competitors.  Let the LLM
# spontaneously recommend whoever it thinks is best so mention rates
# reflect genuine AI visibility (Gumshoe-style methodology).
TEMPLATE_TOP5 = (
    "What are your top 5 recommendations for a {persona} looking for "
    "the best {category} for {topic}?"
)
TEMPLATE_BEST = (
    "What is the best {category} for a {persona} interested in {topic}? "
    "Explain your reasoning."
)
TEMPLATE_TOP3 = (
    "What are the top 3 {category} options for a {persona} seeking {topic}? "
    "Rank them and explain why."
)
TEMPLATE_COMPARE = (
    "Compare the leading {category} options for a {persona} when it comes to {topic}."
)
TEMPLATE_AS_PERSONA = (
    "As a {persona}, what {category} should I choose for {topic}?"
)
TEMPLATE_RECOMMEND = (
    "I'm a {persona} evaluating {category} options for {topic}. "
    "What would you recommend and why?"
)
TEMPLATE_LANDSCAPE = (
    "What are the most reputable {category} providers for {topic}? "
    "I'm a {persona} evaluating my options."
)

TEMPLATES = [
    TEMPLATE_TOP5, TEMPLATE_BEST, TEMPLATE_TOP3, TEMPLATE_COMPARE,
    TEMPLATE_AS_PERSONA, TEMPLATE_RECOMMEND, TEMPLATE_LANDSCAPE,
]
TEMPLATE_STYLES = [
    "top_5", "best", "top_3", "compare",
    "as_persona", "recommend", "landscape",
]


@dataclass
class RenderedPrompt:
    """A single rendered prompt ready to send to the LLM."""

    id: str
    text: str
    persona: str
    topic: str
    weight: float = 1.0
    style: str = ""


def generate_prompt_matrix(discovery: DiscoveryResult) -> list[RenderedPrompt]:
    """Generate 20 open-ended prompts from discovery results.

    16 core prompts: 4 personas x 4 topics, rotating through 7 template styles.
    4 extra prompts: additional persona/topic combos for coverage.
    All prompts are open-ended — no company or competitor names appear.
    The {category} slot comes from discovery.entity_type (e.g. "employee
    recognition platform"), so the LLM spontaneously recommends whoever it
    thinks is best.
    """
    prompts: list[RenderedPrompt] = []
    template_idx = 0
    category = discovery.entity_type

    # 16 core prompts: rotate templates across persona/topic combos
    for p_idx, persona in enumerate(discovery.personas[:4]):
        for t_idx, topic in enumerate(discovery.topics[:4]):
            style_idx = template_idx % len(TEMPLATES)
            template = TEMPLATES[style_idx]
            style = TEMPLATE_STYLES[style_idx]
            template_idx += 1

            text = template.format(
                category=category,
                persona=persona,
                topic=topic,
            )
            prompts.append(
                RenderedPrompt(
                    id=f"core-{p_idx}-{t_idx}",
                    text=text,
                    persona=persona,
                    topic=topic,
                    weight=1.0,
                    style=style,
                )
            )

    # 4 extra prompts: cycle remaining template styles with varied combos
    personas = discovery.personas if discovery.personas else ["a potential customer"]
    topics = discovery.topics if discovery.topics else ["their services"]
    for extra_idx in range(4):
        style_idx = template_idx % len(TEMPLATES)
        template = TEMPLATES[style_idx]
        style = TEMPLATE_STYLES[style_idx]
        template_idx += 1

        persona = personas[extra_idx % len(personas)]
        topic = topics[(extra_idx + 1) % len(topics)]

        text = template.format(
            category=category,
            persona=persona,
            topic=topic,
        )
        prompts.append(
            RenderedPrompt(
                id=f"extra-{extra_idx}",
                text=text,
                persona=persona,
                topic=topic,
                weight=1.0,
                style=style,
            )
        )

    return prompts


async def run_analysis(
    discovery: DiscoveryResult,
    on_progress: Callable[[dict], None] | None = None,
) -> LiteAnalysisResult:
    """Run the full lite analysis pipeline.

    Args:
        discovery: Discovery results with company info, competitors, personas, topics.
        on_progress: Optional callback(event_dict) for progress updates.
    """
    settings = get_settings()

    # Use OpenAI (reliable on Vercel serverless), fall back to Anthropic
    if settings.has_openai():
        provider = OpenAIProvider(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )
    elif settings.has_anthropic():
        provider = AnthropicProvider(
            api_key=settings.anthropic_api_key,
            model="claude-sonnet-4-6",
        )
    else:
        raise ValueError("No AI provider available for analysis")

    parser = ResponseParser(parser_provider=provider)
    scoring = ScoringEngine()

    prompts = generate_prompt_matrix(discovery)
    total = len(prompts)

    # Known entities — used to hint the parser, but prompts never name them.
    company_name = discovery.company_name
    known_competitor_names: set[str] = {c.name.lower() for c in discovery.competitors}
    all_entity_names = [company_name] + [c.name for c in discovery.competitors]

    # Results accumulators
    company_prompt_scores = []

    # Dynamic entity discovery: entity_key → list of (mention, prompt_weight)
    discovered_entities: dict[str, list[tuple[ParsedMention, float]]] = {}
    entity_display_names: dict[str, str] = {}  # preserve first-seen casing

    persona_stats: dict[str, dict] = {
        p: {"mentions": 0, "total": 0, "positions": [], "comp_mentions": {}}
        for p in discovery.personas
    }
    topic_stats: dict[str, dict] = {
        t: {"mentions": 0, "total": 0, "positions": []}
        for t in discovery.topics
    }

    semaphore = asyncio.Semaphore(5)
    completed_count = 0
    results_lock = asyncio.Lock()

    async def run_single_prompt(idx: int, prompt: RenderedPrompt):
        nonlocal completed_count

        # Gate only the LLM query with the semaphore — parse runs freely after
        async with semaphore:
            if on_progress:
                on_progress({
                    "type": "prompt_start",
                    "total": total,
                    "persona": prompt.persona,
                    "topic": prompt.topic,
                    "prompt_text": prompt.text,
                    "style": prompt.style,
                })

            # Query the LLM
            response = await provider.query(prompt.text)

        # Everything below runs outside the semaphore
        if not response.success:
            logger.warning(f"Prompt {prompt.id} failed: {response.error}")
            async with results_lock:
                completed_count += 1
            if on_progress:
                on_progress({
                    "type": "prompt_result",
                    "current": completed_count,
                    "total": total,
                    "persona": prompt.persona,
                    "topic": prompt.topic,
                    "mentioned": False,
                    "position": None,
                    "error": True,
                })
            return

        # Parse the response (outside semaphore — doesn't block new queries)
        mentions = await parser.parse(
            query=prompt.text,
            response=response.text,
            entity_type="company",
            known_entities=all_entity_names,
        )

        # Score our company
        score = scoring.score_prompt_for_entity(
            entity_name=company_name,
            mentions=mentions,
            prompt_id=prompt.id,
            provider="openai",
            prompt_weight=prompt.weight,
        )

        # Track whether company was mentioned
        company_mentioned = score.recommendation_type != RecommendationType.NOT_MENTIONED

        async with results_lock:
            completed_count += 1
            company_prompt_scores.append(score)

            # Collect ALL mentioned entities (except the target company)
            for m in mentions:
                entity_key = m.normalized_name
                # Skip the target company itself
                if entity_key == company_name.lower() or company_name.lower() in entity_key:
                    continue

                if entity_key not in discovered_entities:
                    discovered_entities[entity_key] = []
                    entity_display_names[entity_key] = m.entity_name
                discovered_entities[entity_key].append((m, prompt.weight))

            # Update persona stats
            if prompt.persona in persona_stats:
                persona_stats[prompt.persona]["total"] += 1
                if company_mentioned:
                    persona_stats[prompt.persona]["mentions"] += 1
                    if score.position:
                        persona_stats[prompt.persona]["positions"].append(score.position)

                # Track which competitor got mentioned most for this persona
                for m in mentions:
                    entity_key = m.normalized_name
                    if entity_key == company_name.lower() or company_name.lower() in entity_key:
                        continue
                    comp_counts = persona_stats[prompt.persona]["comp_mentions"]
                    display = entity_display_names.get(entity_key, m.entity_name)
                    comp_counts[display] = comp_counts.get(display, 0) + 1

            # Update topic stats
            if prompt.topic in topic_stats:
                topic_stats[prompt.topic]["total"] += 1
                if company_mentioned:
                    topic_stats[prompt.topic]["mentions"] += 1
                    if score.position:
                        topic_stats[prompt.topic]["positions"].append(score.position)

        if on_progress:
            on_progress({
                "type": "prompt_result",
                "current": completed_count,
                "total": total,
                "persona": prompt.persona,
                "topic": prompt.topic,
                "mentioned": company_mentioned,
                "position": score.position,
            })

    # Launch all prompts concurrently, gated by semaphore
    tasks = [run_single_prompt(idx, prompt) for idx, prompt in enumerate(prompts)]
    await asyncio.gather(*tasks, return_exceptions=True)

    # Aggregate company score
    ari_score = scoring.aggregate_scores(
        entity_name=company_name,
        entity_id="00000000-0000-0000-0000-000000000000",
        prompt_scores=company_prompt_scores,
    )

    # Build competitor scores from ALL discovered entities
    comp_scores = []
    for entity_key, mention_pairs in discovered_entities.items():
        display_name = entity_display_names[entity_key]
        mention_count = len(mention_pairs)
        positions = [m.position for m, _w in mention_pairs if m.position]
        avg_pos = sum(positions) / len(positions) if positions else None

        # Position-weighted ARI score for this competitor
        entity_scores = [scoring.score_mention(m) * w for m, w in mention_pairs]
        total_weight = sum(w for _m, w in mention_pairs)
        entity_ari = (sum(entity_scores) / (total_weight * 100)) * 100 if total_weight > 0 else 0.0

        # Determine source: "known" if in discovery.competitors, else "discovered"
        source = "known" if entity_key in known_competitor_names or any(
            entity_key == c.name.lower() or c.name.lower() in entity_key
            for c in discovery.competitors
        ) else "discovered"

        comp_scores.append(
            CompetitorScore(
                name=display_name,
                mention_count=mention_count,
                mention_rate=mention_count / total if total > 0 else 0,
                avg_position=avg_pos,
                source=source,
                ari_score=round(entity_ari, 1),
            )
        )

    # Sort by mention_rate descending, cap at top 10
    comp_scores.sort(key=lambda c: c.mention_rate, reverse=True)
    comp_scores = comp_scores[:10]

    # Build persona breakdowns
    persona_breakdowns = []
    for persona in discovery.personas:
        stats = persona_stats.get(persona, {"mentions": 0, "total": 0, "positions": [], "comp_mentions": {}})
        total_p = stats["total"]
        positions = stats["positions"]
        comp_counts = stats.get("comp_mentions", {})
        top_comp = max(comp_counts, key=comp_counts.get) if comp_counts else ""
        persona_breakdowns.append(
            PersonaBreakdown(
                persona=persona,
                mention_count=stats["mentions"],
                total_prompts=total_p,
                mention_rate=stats["mentions"] / total_p if total_p > 0 else 0,
                avg_position=sum(positions) / len(positions) if positions else None,
                top_competitor=top_comp,
            )
        )

    # Build topic breakdowns
    topic_breakdowns = []
    for topic in discovery.topics:
        stats = topic_stats.get(topic, {"mentions": 0, "total": 0, "positions": []})
        total_t = stats["total"]
        positions = stats["positions"]
        topic_breakdowns.append(
            TopicBreakdown(
                topic=topic,
                mention_count=stats["mentions"],
                total_prompts=total_t,
                mention_rate=stats["mentions"] / total_t if total_t > 0 else 0,
                avg_position=sum(positions) / len(positions) if positions else None,
            )
        )

    result = LiteAnalysisResult(
        overall_score=ari_score.overall_score,
        mention_rate=ari_score.mention_rate,
        total_prompts=ari_score.total_prompts,
        mentions_count=ari_score.mentions_count,
        competitor_scores=comp_scores,
        persona_breakdown=persona_breakdowns,
        topic_breakdown=topic_breakdowns,
    )

    # Write score to entity metadata + emit interaction event
    try:
        entity_id = await find_or_create_entity(
            discovery.domain,
            discovery.company_name,
            industry=discovery.industry if hasattr(discovery, "industry") else None,
        )
        if entity_id:
            await update_entity_ari_score(
                entity_id=entity_id,
                overall_score=ari_score.overall_score,
                mention_rate=ari_score.mention_rate,
            )
            await emit_score_event(
                entity_id=entity_id,
                domain=discovery.domain,
                overall_score=ari_score.overall_score,
                mention_rate=ari_score.mention_rate,
                total_prompts=ari_score.total_prompts,
                source="snapshot",
            )
    except Exception as e:
        logger.warning(f"Entity score update failed (non-blocking): {e}")

    return result
