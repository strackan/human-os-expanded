"""Anthropic (Claude) provider implementation."""

import asyncio
import time

from anthropic import Anthropic, APIError

from app.models.response import AIProvider
from app.services.ai_providers.base import AIProviderBase, ProviderResponse


class AnthropicProvider(AIProviderBase):
    """Anthropic/Claude provider for ARI queries.

    Uses the sync client with asyncio.to_thread() for reliable
    operation in serverless environments (e.g. Vercel).
    """

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        super().__init__(api_key, model)
        self.client = Anthropic(api_key=api_key)

    @property
    def provider_name(self) -> AIProvider:
        return AIProvider.ANTHROPIC

    def _query_sync(self, prompt: str, max_tokens: int, system: str):
        """Synchronous query — runs in a thread via to_thread()."""
        return self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            system=system,
        )

    async def query(self, prompt: str, max_tokens: int = 1000, system: str | None = None) -> ProviderResponse:
        """Query Claude with a prompt."""
        start_time = time.perf_counter()
        sys_prompt = system or "You are a helpful assistant providing recommendations and information. Be direct and specific in your responses."

        try:
            response = await asyncio.to_thread(
                self._query_sync, prompt, max_tokens, sys_prompt
            )

            latency_ms = int((time.perf_counter() - start_time) * 1000)

            # Extract text from content blocks
            text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    text += block.text

            # Calculate tokens (input + output)
            tokens_used = None
            if response.usage:
                tokens_used = response.usage.input_tokens + response.usage.output_tokens

            return ProviderResponse(
                text=text,
                model_version=response.model,
                tokens_used=tokens_used,
                latency_ms=latency_ms,
            )

        except APIError as e:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return ProviderResponse(
                text="",
                model_version=self.model,
                tokens_used=None,
                latency_ms=latency_ms,
                error=f"Anthropic API error: {str(e)}",
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
        """Check if Anthropic is accessible."""
        try:
            response = await asyncio.to_thread(
                self.client.messages.create,
                model=self.model,
                max_tokens=5,
                messages=[{"role": "user", "content": "Hello"}],
            )
            return bool(response.content)
        except Exception:
            return False
