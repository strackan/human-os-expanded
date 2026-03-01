"""Google Gemini provider implementation using google-genai SDK."""

import time

from google import genai
from google.genai import types

from app.models.response import AIProvider
from app.services.ai_providers.base import AIProviderBase, ProviderResponse


class GeminiProvider(AIProviderBase):
    """Google Gemini provider for ARI queries."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        super().__init__(api_key, model)
        self.client = genai.Client(api_key=api_key)

    @property
    def provider_name(self) -> AIProvider:
        return AIProvider.GEMINI

    async def query(self, prompt: str) -> ProviderResponse:
        """Query Gemini with a prompt."""
        start_time = time.perf_counter()

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=1000,
                    temperature=0.7,
                    system_instruction="You are a helpful assistant providing recommendations and information. Be direct and specific in your responses.",
                ),
            )

            latency_ms = int((time.perf_counter() - start_time) * 1000)

            text = response.text or ""

            # Get token counts if available
            tokens_used = None
            if response.usage_metadata:
                tokens_used = (
                    response.usage_metadata.prompt_token_count
                    + response.usage_metadata.candidates_token_count
                )

            return ProviderResponse(
                text=text,
                model_version=self.model,
                tokens_used=tokens_used,
                latency_ms=latency_ms,
            )

        except Exception as e:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return ProviderResponse(
                text="",
                model_version=self.model,
                tokens_used=None,
                latency_ms=latency_ms,
                error=f"Gemini error: {str(e)}",
            )

    async def health_check(self) -> bool:
        """Check if Gemini is accessible."""
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents="Hello",
                config=types.GenerateContentConfig(max_output_tokens=5),
            )
            return bool(response.text)
        except Exception:
            return False
