"""Base class for AI provider integrations."""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.models.response import AIProvider


@dataclass
class ProviderResponse:
    """Response from an AI provider."""

    text: str
    model_version: str
    tokens_used: int | None
    latency_ms: int
    error: str | None = None

    @property
    def success(self) -> bool:
        """Check if the response was successful."""
        return self.error is None and bool(self.text)


class AIProviderBase(ABC):
    """Abstract base class for AI providers."""

    def __init__(self, api_key: str, model: str):
        """
        Initialize the provider.

        Args:
            api_key: API key for the provider
            model: Model identifier to use
        """
        self.api_key = api_key
        self.model = model

    @property
    @abstractmethod
    def provider_name(self) -> AIProvider:
        """Get the provider enum value."""
        pass

    @abstractmethod
    async def query(self, prompt: str) -> ProviderResponse:
        """
        Execute a prompt and return the response.

        Args:
            prompt: The prompt to send to the AI

        Returns:
            ProviderResponse with text, metadata, and any errors
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if the provider is accessible.

        Returns:
            True if provider is healthy, False otherwise
        """
        pass

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(model={self.model})"
