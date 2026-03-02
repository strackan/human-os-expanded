"""Centralized model registry — single source of truth for every AI model ID.

Import semantic aliases (ARI_SCORING_MODEL, EDITORIAL_MODEL, etc.) in service
files instead of hardcoding model strings.  When a provider ships a new
generation, update ONE file and every consumer follows.
"""

from __future__ import annotations

# ── Anthropic ────────────────────────────────────────────────────────
ANTHROPIC_FAST_CURRENT = "claude-haiku-4-5"
ANTHROPIC_FAST_PREV = None
ANTHROPIC_FAST_NEXT = None

ANTHROPIC_MEDIUM_CURRENT = "claude-sonnet-4-6"
ANTHROPIC_MEDIUM_PREV = "claude-sonnet-4-20250514"
ANTHROPIC_MEDIUM_NEXT = None

ANTHROPIC_HEAVY_CURRENT = "claude-opus-4-6"
ANTHROPIC_HEAVY_PREV = None
ANTHROPIC_HEAVY_NEXT = None

# ── OpenAI ───────────────────────────────────────────────────────────
OPENAI_FAST_CURRENT = "gpt-5-mini"
OPENAI_FAST_PREV = "gpt-4o-mini"
OPENAI_FAST_NEXT = None

OPENAI_MEDIUM_CURRENT = "gpt-5"
OPENAI_MEDIUM_PREV = "gpt-4o"
OPENAI_MEDIUM_NEXT = None

OPENAI_HEAVY_CURRENT = "gpt-5-pro"
OPENAI_HEAVY_PREV = None
OPENAI_HEAVY_NEXT = None

# ── Google (Gemini) ──────────────────────────────────────────────────
GOOGLE_FAST_CURRENT = "gemini-3-flash-preview"
GOOGLE_FAST_PREV = "gemini-2.5-flash"
GOOGLE_FAST_NEXT = None

GOOGLE_MEDIUM_CURRENT = "gemini-2.5-pro"
GOOGLE_MEDIUM_PREV = None
GOOGLE_MEDIUM_NEXT = None

GOOGLE_HEAVY_CURRENT = "gemini-3.1-pro-preview"
GOOGLE_HEAVY_PREV = None
GOOGLE_HEAVY_NEXT = None

# ── Perplexity ───────────────────────────────────────────────────────
PERPLEXITY_FAST_CURRENT = "sonar"
PERPLEXITY_FAST_PREV = None
PERPLEXITY_FAST_NEXT = None

PERPLEXITY_MEDIUM_CURRENT = "sonar-pro"
PERPLEXITY_MEDIUM_PREV = None
PERPLEXITY_MEDIUM_NEXT = None

PERPLEXITY_HEAVY_CURRENT = None
PERPLEXITY_HEAVY_PREV = None
PERPLEXITY_HEAVY_NEXT = None

# ── xAI (Grok) ──────────────────────────────────────────────────────
XAI_FAST_CURRENT = None
XAI_FAST_PREV = None
XAI_FAST_NEXT = None

XAI_MEDIUM_CURRENT = "grok-4-1-fast-non-reasoning"
XAI_MEDIUM_PREV = None
XAI_MEDIUM_NEXT = None

XAI_HEAVY_CURRENT = "grok-4"
XAI_HEAVY_PREV = None
XAI_HEAVY_NEXT = None

# ── Tier flags (cost guard-rails) ───────────────────────────────────
ENABLE_MEDIUM_TIER = False
ENABLE_HEAVY_TIER = False

# ── Semantic aliases (what service files import) ─────────────────────
ARI_SCORING_MODEL = ANTHROPIC_FAST_CURRENT          # lite analysis prompts
PARSER_MODEL = OPENAI_FAST_CURRENT                  # response parsing
EDITORIAL_MODEL = ANTHROPIC_MEDIUM_CURRENT          # synthesis, profiling, articles
REPORT_MODEL = ANTHROPIC_MEDIUM_CURRENT             # report composition
WEB_SEARCH_MODEL = PERPLEXITY_FAST_CURRENT          # article writer
COMPETITOR_VALIDATION_MODEL = ANTHROPIC_MEDIUM_CURRENT
ANALYSIS_MODEL = ANTHROPIC_MEDIUM_CURRENT           # testing endpoints


# ── Helpers ──────────────────────────────────────────────────────────

_PROVIDERS = ("anthropic", "openai", "google", "perplexity", "xai")
_TIERS = ("fast", "medium", "heavy")
_GENERATIONS = ("prev", "current", "next")


def get_model(provider: str, tier: str = "fast", generation: str = "current") -> str | None:
    """Look up a model ID by provider / tier / generation.

    >>> get_model("anthropic", "fast", "current")
    'claude-haiku-4-5'
    """
    key = f"{provider.upper()}_{tier.upper()}_{generation.upper()}"
    return globals().get(key)


def list_models() -> list[dict]:
    """Return every registered model as a list of dicts.

    Each dict has keys: provider, tier, generation, model_id.
    Only entries with a non-None model_id are included.
    """
    models = []
    for provider in _PROVIDERS:
        for tier in _TIERS:
            for gen in _GENERATIONS:
                model_id = get_model(provider, tier, gen)
                if model_id is not None:
                    models.append({
                        "provider": provider,
                        "tier": tier,
                        "generation": gen,
                        "model_id": model_id,
                    })
    return models
