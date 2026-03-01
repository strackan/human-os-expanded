"""Perplexity provider implementation."""

import time

import httpx

from app.models.response import AIProvider
from app.services.ai_providers.base import AIProviderBase, ProviderResponse


class PerplexityProvider(AIProviderBase):
    """Perplexity AI provider for ARI queries."""

    BASE_URL = "https://api.perplexity.ai"

    def __init__(self, api_key: str, model: str = "llama-3.1-sonar-large-128k-online"):
        super().__init__(api_key, model)
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    @property
    def provider_name(self) -> AIProvider:
        return AIProvider.PERPLEXITY

    async def query(self, prompt: str, max_tokens: int = 1000, system: str | None = None) -> ProviderResponse:
        """Query Perplexity with a prompt."""
        start_time = time.perf_counter()
        sys_prompt = system or "You are a helpful assistant providing recommendations and information. Be direct and specific in your responses."

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers=self.headers,
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": sys_prompt,
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "max_tokens": max_tokens,
                        "temperature": 0.7,
                    },
                )

                latency_ms = int((time.perf_counter() - start_time) * 1000)

                if response.status_code != 200:
                    return ProviderResponse(
                        text="",
                        model_version=self.model,
                        tokens_used=None,
                        latency_ms=latency_ms,
                        error=f"Perplexity API error: {response.status_code} - {response.text}",
                    )

                data = response.json()

                text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                usage = data.get("usage", {})
                tokens_used = usage.get("total_tokens")

                # Extract citations/sources if available
                citations = data.get("citations", [])
                if citations:
                    text += "\n\n**Sources:**\n" + "\n".join(f"[{i+1}] {url}" for i, url in enumerate(citations))

                return ProviderResponse(
                    text=text,
                    model_version=data.get("model", self.model),
                    tokens_used=tokens_used,
                    latency_ms=latency_ms,
                )

        except httpx.TimeoutException:
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            return ProviderResponse(
                text="",
                model_version=self.model,
                tokens_used=None,
                latency_ms=latency_ms,
                error="Perplexity request timed out",
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
        """Check if Perplexity is accessible."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers=self.headers,
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": "Hello"}],
                        "max_tokens": 5,
                    },
                )
                return response.status_code == 200
        except Exception:
            return False
