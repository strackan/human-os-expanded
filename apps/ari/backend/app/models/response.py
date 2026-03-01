"""AI response models."""

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class AIProvider(str, Enum):
    """Supported AI providers."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    PERPLEXITY = "perplexity"
    GEMINI = "gemini"


class RecommendationType(str, Enum):
    """How the entity was recommended in the response."""

    EXPLICIT = "explicit"  # "I recommend X"
    RANKED = "ranked"  # Part of a ranked list
    LISTED = "listed"  # Mentioned as an option
    MENTIONED = "mentioned"  # Just mentioned
    NOT_MENTIONED = "not_mentioned"  # Not in response


class Sentiment(str, Enum):
    """Sentiment of the mention."""

    POSITIVE = "positive"
    NEUTRAL = "neutral"
    MIXED = "mixed"
    CAUTIONARY = "cautionary"
    NEGATIVE = "negative"


class ParsedMention(BaseModel):
    """A single entity mention extracted from an AI response."""

    entity_name: str = Field(..., description="Name as it appears in response")
    normalized_name: str = Field(..., description="Normalized for matching")
    position: int | None = Field(None, description="Position in list (1-indexed)")
    recommendation_type: RecommendationType
    sentiment: Sentiment = Sentiment.NEUTRAL
    context: str = Field("", description="Surrounding text snippet")
    confidence: float = Field(1.0, ge=0, le=1, description="Extraction confidence")


class AIResponse(BaseModel):
    """Full AI response with metadata."""

    id: UUID = Field(default_factory=uuid4)
    prompt_run_id: UUID
    prompt_template_id: str
    provider: AIProvider
    model_version: str
    raw_response: str
    parsed_mentions: list[ParsedMention] = Field(default_factory=list)
    latency_ms: int
    tokens_used: int | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    error: str | None = None

    class Config:
        from_attributes = True
