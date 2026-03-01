"""OpenAI (ChatGPT) provider implementation."""

import time

from openai import AsyncOpenAI, APIError

from app.models.response import AIProvider
from app.services.ai_providers.base import AIProviderBase, ProviderResponse


class OpenAIProvider(AIProviderBase):
    """OpenAI/ChatGPT provider for ARI queries."""

    def __init__(self, api_key: str, model: str = "gpt-4-turbo"):
        super().__init__(api_key, model)
        self.client = AsyncOpenAI(api_key=api_key)

    @property
    def provider_name(self) -> AIProvider:
        return AIProvider.OPENAI

    async def query(self, prompt: str, max_completion_tokens: int = 2000, max_tokens: int | None = None, **kwargs) -> ProviderResponse:
        """Query OpenAI with a prompt."""
        start_time = time.perf_counter()

        # Accept max_tokens as alias for max_completion_tokens (Anthropic compat)
        if max_tokens is not None:
            max_completion_tokens = max_tokens

        try:
            # GPT-5 family models use reasoning tokens from max_completion_tokens budget
            # Use reasoning_effort='low' to minimize reasoning and maximize output
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant providing recommendations and information. Be direct and specific in your responses.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_completion_tokens=max_completion_tokens,
                reasoning_effort="low",
            )

            latency_ms = int((time.perf_counter() - start_time) * 1000)

            return ProviderResponse(
                text=response.choices[0].message.content or "",
                model_version=response.model,
                tokens_used=response.usage.total_tokens if response.usage else None,
                latency_ms=latency_ms,
            )

        except APIError as e:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return ProviderResponse(
                text="",
                model_version=self.model,
                tokens_used=None,
                latency_ms=latency_ms,
                error=f"OpenAI API error: {e.message}",
            )
        except Exception as e:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return ProviderResponse(
                text="",
                model_version=self.model,
                tokens_used=None,
                latency_ms=latency_ms,
                error=f"Unexpected error: {str(e)}",
            )

    async def health_check(self) -> bool:
        """Check if OpenAI is accessible."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_completion_tokens=100,
                reasoning_effort="low",
            )
            return bool(response.choices)
        except Exception:
            return False
