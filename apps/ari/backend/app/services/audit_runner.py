"""Multi-provider audit analysis runner.

Runs the full prompt matrix across all available AI providers in parallel,
parses responses, and accumulates per-dimension/provider/persona/topic stats.
Streams progress via callback for real-time SSE updates.
"""

import asyncio
import logging
from typing import Callable

from app.config import get_settings
from app.models.audit import (
    AuditPromptDimension,
    AuditRenderedPrompt,
    BrandProfile,
    DimensionScore,
    PromptAnalysisResult,
    ProviderAuditScore,
)
from app.models.response import AIProvider, RecommendationType
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.ai_providers.base import AIProviderBase
from app.services.ai_providers.gemini_provider import GeminiProvider
from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.ai_providers.perplexity_provider import PerplexityProvider
from app.services.response_parser import ResponseParser
from app.services.scoring_engine import ScoringEngine

logger = logging.getLogger(__name__)


def _init_providers() -> dict[str, AIProviderBase]:
    """Initialize all available AI providers."""
    settings = get_settings()
    providers: dict[str, AIProviderBase] = {}

    if settings.has_openai():
        providers["openai"] = OpenAIProvider(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )

    if settings.has_anthropic():
        providers["anthropic"] = AnthropicProvider(
            api_key=settings.anthropic_api_key,
            model=settings.anthropic_model,
        )

    if settings.has_perplexity():
        providers["perplexity"] = PerplexityProvider(
            api_key=settings.perplexity_api_key,
            model=settings.perplexity_model,
        )

    if settings.has_gemini():
        providers["gemini"] = GeminiProvider(
            api_key=settings.google_api_key,
            model=settings.gemini_model,
        )

    return providers


async def run_audit(
    profile: BrandProfile,
    prompts: list[AuditRenderedPrompt],
    on_progress: Callable[[dict], None] | None = None,
) -> list[PromptAnalysisResult]:
    """Run all prompts across all available providers.

    Args:
        profile: Brand profile for context (entity names, etc.)
        prompts: The prompt matrix to execute
        on_progress: Callback for real-time progress events

    Returns:
        List of PromptAnalysisResult for every prompt/provider combination.
    """
    providers = _init_providers()
    if not providers:
        raise ValueError("No AI providers configured. Check API keys in .env")

    # Set up parser (use Anthropic as the parser since it's always available for audit)
    settings = get_settings()
    parser_provider = None
    if settings.has_anthropic():
        parser_provider = AnthropicProvider(
            api_key=settings.anthropic_api_key,
            model="claude-sonnet-4-6",
        )
    parser = ResponseParser(parser_provider=parser_provider)

    # Known entities for parsing
    company_name = profile.company_name
    all_entity_names = [company_name] + [c.name for c in profile.competitors]

    # Track total for progress
    total_ops = len(prompts) * len(providers)
    completed = 0
    all_results: list[PromptAnalysisResult] = []
    results_lock = asyncio.Lock()

    async def run_provider_prompts(provider_name: str, provider: AIProviderBase):
        nonlocal completed
        semaphore = asyncio.Semaphore(5)

        async def run_single(prompt):
            nonlocal completed

            async with semaphore:
                # Emit progress
                if on_progress:
                    async with results_lock:
                        current = completed + 1
                    on_progress({
                        "type": "prompt_start",
                        "current": current,
                        "total": total_ops,
                        "provider": provider_name,
                        "dimension": prompt.dimension.value,
                        "persona": prompt.persona,
                        "topic": prompt.topic,
                        "prompt_text": prompt.text,
                    })

                # Query the LLM
                response = await provider.query(prompt.text)

                result = PromptAnalysisResult(
                    prompt_id=prompt.id,
                    prompt_text=prompt.text,
                    dimension=prompt.dimension,
                    persona=prompt.persona,
                    topic=prompt.topic,
                    provider=provider_name,
                    model_version=response.model_version or "",
                    raw_response=response.text if response.success else "",
                    latency_ms=response.latency_ms,
                    tokens_used=response.tokens_used,
                )

                if response.success:
                    # Parse the response
                    try:
                        mentions = await parser.parse(
                            query=prompt.text,
                            response=response.text,
                            entity_type=profile.entity_type or "company",
                            known_entities=all_entity_names,
                        )

                        # Find our brand in the mentions
                        company_lower = company_name.lower()
                        for m in mentions:
                            if (
                                m.normalized_name == company_lower
                                or company_lower in m.normalized_name
                                or m.normalized_name in company_lower
                            ):
                                result.brand_mentioned = True
                                result.position = m.position
                                result.recommendation_type = m.recommendation_type.value
                                result.sentiment = m.sentiment.value
                                result.confidence = m.confidence
                                result.context = m.context
                                break

                    except Exception as e:
                        logger.warning(f"Parse failed for {prompt.id}/{provider_name}: {e}")

                async with results_lock:
                    all_results.append(result)
                    completed += 1
                    current_completed = completed

                # Emit result
                if on_progress:
                    on_progress({
                        "type": "prompt_result",
                        "current": current_completed,
                        "total": total_ops,
                        "provider": provider_name,
                        "dimension": prompt.dimension.value,
                        "persona": prompt.persona,
                        "topic": prompt.topic,
                        "mentioned": result.brand_mentioned,
                        "position": result.position,
                    })

        # Launch all prompts concurrently within this provider, gated by semaphore
        prompt_tasks = [run_single(prompt) for prompt in prompts]
        await asyncio.gather(*prompt_tasks, return_exceptions=True)

    # Run all providers in parallel
    provider_tasks = [
        run_provider_prompts(name, provider)
        for name, provider in providers.items()
    ]

    await asyncio.gather(*provider_tasks, return_exceptions=True)

    logger.info(
        f"Audit analysis complete: {len(all_results)} results from "
        f"{len(providers)} providers, {len(prompts)} prompts"
    )
    return all_results
