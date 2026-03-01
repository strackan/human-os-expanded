"""Prompt runner orchestrates executing prompts across all AI providers."""

import asyncio
from dataclasses import dataclass
from uuid import UUID, uuid4

from app.config import get_settings
from app.models.prompt import RenderedPrompt
from app.models.response import AIProvider, AIResponse, ParsedMention
from app.models.score import ARIScore, PromptResponse
from app.services.ai_providers.base import AIProviderBase, ProviderResponse
from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.ai_providers.perplexity_provider import PerplexityProvider
from app.services.ai_providers.gemini_provider import GeminiProvider
from app.services.response_parser import ResponseParser, get_parser
from app.services.scoring_engine import ScoringEngine, get_scoring_engine


@dataclass
class PromptRunResult:
    """Result of running a single prompt against one provider."""

    prompt: RenderedPrompt
    provider: AIProvider
    response: ProviderResponse
    parsed_mentions: list[ParsedMention]


@dataclass
class RunProgress:
    """Progress tracking for a prompt run."""

    job_id: UUID
    entity_id: UUID
    total_prompts: int
    completed_prompts: int
    status: str
    message: str
    errors: list[str]


class PromptRunner:
    """
    Orchestrates running prompts across all AI providers.

    Handles:
    - Provider initialization based on available API keys
    - Parallel execution of prompts
    - Response parsing
    - Score calculation
    """

    def __init__(self):
        self.settings = get_settings()
        self.providers: dict[AIProvider, AIProviderBase] = {}
        self.parser: ResponseParser | None = None
        self.scoring_engine = get_scoring_engine()

        self._init_providers()

    def _init_providers(self):
        """Initialize available AI providers based on configured API keys."""
        if self.settings.has_openai():
            self.providers[AIProvider.OPENAI] = OpenAIProvider(
                api_key=self.settings.openai_api_key,
                model=self.settings.openai_model,
            )
            # Also initialize parser with OpenAI
            self.parser = get_parser(self.settings.openai_api_key)

        if self.settings.has_anthropic():
            self.providers[AIProvider.ANTHROPIC] = AnthropicProvider(
                api_key=self.settings.anthropic_api_key,
                model=self.settings.anthropic_model,
            )

        if self.settings.has_perplexity():
            self.providers[AIProvider.PERPLEXITY] = PerplexityProvider(
                api_key=self.settings.perplexity_api_key,
                model=self.settings.perplexity_model,
            )

        if self.settings.has_gemini():
            self.providers[AIProvider.GEMINI] = GeminiProvider(
                api_key=self.settings.google_api_key,
                model=self.settings.gemini_model,
            )

    async def run_prompt(
        self,
        prompt: RenderedPrompt,
        provider: AIProviderBase,
        known_entities: list[str],
    ) -> PromptRunResult:
        """
        Run a single prompt against one provider.

        Args:
            prompt: The rendered prompt to execute
            provider: The AI provider to use
            known_entities: List of entity names to look for

        Returns:
            PromptRunResult with response and parsed mentions
        """
        # Execute the prompt
        response = await provider.query(prompt.prompt_text)

        # Parse the response
        parsed_mentions = []
        if response.success and self.parser:
            parsed_mentions = await self.parser.parse(
                query=prompt.prompt_text,
                response=response.text,
                entity_type=prompt.entity_type,
                known_entities=known_entities,
            )

        return PromptRunResult(
            prompt=prompt,
            provider=provider.provider_name,
            response=response,
            parsed_mentions=parsed_mentions,
        )

    async def _run_provider_prompts(
        self,
        provider: AIProviderBase,
        prompts: list[RenderedPrompt],
        known_entities: list[str],
        rate_limit_delay: float,
    ) -> list[PromptRunResult]:
        """Run all prompts for a single provider with rate limiting."""
        results = []
        for i, prompt in enumerate(prompts):
            try:
                result = await self.run_prompt(prompt, provider, known_entities)
                results.append(result)
            except Exception as e:
                print(f"Error with {provider.provider_name.value} on prompt {i}: {e}")

            # Rate limit between prompts (skip on last one)
            if i < len(prompts) - 1:
                await asyncio.sleep(rate_limit_delay)

        return results

    async def run_all_prompts(
        self,
        prompts: list[RenderedPrompt],
        known_entities: list[str],
        rate_limit_delay: float = 0.5,
    ) -> list[PromptRunResult]:
        """
        Run all prompts against all providers with rate limiting.

        Each provider runs independently in parallel, with rate limiting per provider.
        This is much faster than waiting for all providers per prompt.

        Args:
            prompts: List of prompts to execute
            known_entities: List of entity names to look for
            rate_limit_delay: Seconds to wait between prompts per provider (default 1.0)

        Returns:
            List of PromptRunResults for all prompt/provider combinations
        """
        if not self.providers:
            raise ValueError("No AI providers configured. Check API keys in .env")

        providers_list = list(self.providers.values())
        total_prompts = len(prompts)

        print(f"Starting {total_prompts} prompts × {len(providers_list)} providers in parallel...")

        # Run each provider independently in parallel
        provider_tasks = [
            self._run_provider_prompts(provider, prompts, known_entities, rate_limit_delay)
            for provider in providers_list
        ]

        # Execute all providers in parallel - each handles its own rate limiting
        all_results = await asyncio.gather(*provider_tasks, return_exceptions=True)

        # Flatten results
        valid_results = []
        for provider_results in all_results:
            if isinstance(provider_results, Exception):
                print(f"Provider error: {provider_results}")
            else:
                valid_results.extend(provider_results)

        print(f"Completed: {len(valid_results)} total responses")
        return valid_results

    async def calculate_ari(
        self,
        entity_name: str,
        entity_id: str,
        prompts: list[RenderedPrompt],
        known_entities: list[str],
    ) -> ARIScore:
        """
        Calculate complete ARI score for an entity.

        Args:
            entity_name: Name of the entity to score
            entity_id: UUID of the entity
            prompts: List of prompts to run
            known_entities: All entity names to look for in responses

        Returns:
            Complete ARIScore with breakdowns
        """
        # Run all prompts
        results = await self.run_all_prompts(prompts, known_entities)

        # Calculate prompt scores for the target entity
        prompt_scores = []
        sample_responses = []
        all_responses = []

        for result in results:
            # Score this prompt result for the target entity
            score = self.scoring_engine.score_prompt_for_entity(
                entity_name=entity_name,
                mentions=result.parsed_mentions,
                prompt_id=result.prompt.template_id,
                provider=result.provider.value,
                prompt_weight=result.prompt.weight,
            )
            prompt_scores.append(score)

            # Capture ALL responses for the detailed log
            all_responses.append(PromptResponse(
                prompt_id=result.prompt.template_id,
                prompt_text=result.prompt.prompt_text,
                intent=result.prompt.intent.value if result.prompt.intent else "unknown",
                provider=result.provider.value,
                model_version=result.response.model_version,
                raw_response=result.response.text,
                latency_ms=result.response.latency_ms,
                tokens_used=result.response.tokens_used,
                entity_mentioned=score.position is not None,
                entity_position=score.position,
                recommendation_type=score.recommendation_type.value,
                all_mentions=[
                    {
                        "name": m.entity_name,
                        "position": m.position,
                        "type": m.recommendation_type.value,
                        "sentiment": m.sentiment.value,
                    }
                    for m in result.parsed_mentions
                ],
                error=result.response.error,
            ))

            # Collect sample responses where entity was mentioned
            if score.position and len(sample_responses) < 3:
                sample_responses.append({
                    "provider": result.provider.value,
                    "prompt": result.prompt.prompt_text,
                    "response": result.response.text[:500] + "..."
                    if len(result.response.text) > 500
                    else result.response.text,
                    "position": score.position,
                    "recommendation_type": score.recommendation_type.value,
                })

        # Aggregate into final score
        ari_score = self.scoring_engine.aggregate_scores(
            entity_name=entity_name,
            entity_id=entity_id,
            prompt_scores=prompt_scores,
        )

        # Add sample responses and all responses
        ari_score.sample_responses = sample_responses
        ari_score.all_responses = all_responses

        return ari_score

    def get_available_providers(self) -> list[str]:
        """Get list of configured provider names."""
        return [p.value for p in self.providers.keys()]


# Singleton instance
_prompt_runner: PromptRunner | None = None


def get_prompt_runner() -> PromptRunner:
    """Get the prompt runner instance."""
    global _prompt_runner
    if _prompt_runner is None:
        _prompt_runner = PromptRunner()
    return _prompt_runner
