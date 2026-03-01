"""Application configuration using pydantic-settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Find .env file - check backend dir first, then project root
_env_file = Path(__file__).parent.parent / ".env"
if not _env_file.exists():
    _env_file = Path(__file__).parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(_env_file) if _env_file.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # AI Provider API Keys (stripped to handle trailing whitespace in env vars)
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    perplexity_api_key: str = ""
    google_api_key: str = ""

    def model_post_init(self, __context) -> None:
        """Strip whitespace from all API keys."""
        object.__setattr__(self, "openai_api_key", self.openai_api_key.strip())
        object.__setattr__(self, "anthropic_api_key", self.anthropic_api_key.strip())
        object.__setattr__(self, "perplexity_api_key", self.perplexity_api_key.strip())
        object.__setattr__(self, "google_api_key", self.google_api_key.strip())
        object.__setattr__(self, "supabase_url", self.supabase_url.strip())
        object.__setattr__(self, "supabase_key", self.supabase_key.strip())
        object.__setattr__(self, "brave_search_api_key", self.brave_search_api_key.strip())
        object.__setattr__(self, "brave_answers_api_key", self.brave_answers_api_key.strip())
        object.__setattr__(self, "resend_api_key", self.resend_api_key.strip())

    # AI Model Versions (Updated December 2025)
    openai_model: str = "gpt-5-mini"
    anthropic_model: str = "claude-3-5-haiku-latest"
    perplexity_model: str = "sonar"  # Default Perplexity model
    gemini_model: str = "gemini-2.5-flash"  # Stable 2.5 Flash

    # Parser Model (fast + cheap for response extraction)
    parser_model: str = "gpt-5-mini"

    # Supabase Configuration
    supabase_url: str = ""
    supabase_key: str = ""

    # Brave Search (brand discovery) + Brave Answers (competitor enrichment)
    brave_search_api_key: str = ""
    brave_answers_api_key: str = ""

    # Resend (email notifications)
    resend_api_key: str = ""

    # Application Settings
    debug: bool = False
    log_level: str = "INFO"

    # API Settings
    api_v1_prefix: str = "/api/v1"

    def has_openai(self) -> bool:
        """Check if OpenAI is configured."""
        return bool(self.openai_api_key)

    def has_anthropic(self) -> bool:
        """Check if Anthropic is configured."""
        return bool(self.anthropic_api_key)

    def has_perplexity(self) -> bool:
        """Check if Perplexity is configured."""
        return bool(self.perplexity_api_key)

    def has_gemini(self) -> bool:
        """Check if Gemini is configured."""
        return bool(self.google_api_key)

    def has_supabase(self) -> bool:
        """Check if Supabase is configured."""
        return bool(self.supabase_url and self.supabase_key)

    def has_brave(self) -> bool:
        """Check if Brave Search is configured."""
        return bool(self.brave_search_api_key)

    def has_brave_answers(self) -> bool:
        """Check if Brave Answers (chat completions) is configured."""
        return bool(self.brave_answers_api_key)

    def has_resend(self) -> bool:
        """Check if Resend is configured."""
        return bool(self.resend_api_key)

    def get_available_providers(self) -> list[str]:
        """Get list of configured AI providers."""
        providers = []
        if self.has_openai():
            providers.append("openai")
        if self.has_anthropic():
            providers.append("anthropic")
        if self.has_perplexity():
            providers.append("perplexity")
        if self.has_gemini():
            providers.append("gemini")
        return providers


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
