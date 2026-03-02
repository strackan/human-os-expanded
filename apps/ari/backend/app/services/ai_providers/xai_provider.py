"""xAI (Grok) provider implementation via OpenAI-compatible API."""

import time

from openai import AsyncOpenAI, APIError

from app.models.response import AIProvider
from app.services.ai_providers.base import AIProviderBase, ProviderResponse


class XAIProvider(AIProviderBase):
    """xAI/Grok provider for ARI queries.

    Uses the OpenAI-compatible endpoint at https://api.x.ai/v1.
    """

    def __init__(self, api_key: str, model: str):
        super().__init__(api_key, model)
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1",
        )

    @property
    def provider_name(self) -> AIProvider:
        return AIProvider.XAI

    async def query(self, prompt: str, max_tokens: int = 2000, **kwargs) -> ProviderResponse:
        """Query Grok with a prompt."""
        start_time = time.perf_counter()

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant providing recommendations and information. Be direct and specific in your responses.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=max_tokens,
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
                error=f"xAI API error: {e.message}",
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
        """Check if xAI is accessible."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=100,
            )
            return bool(response.choices)
        except Exception:
            return False
