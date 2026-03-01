"""ARI score models."""

from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.models.response import AIProvider, RecommendationType


class EntityPromptScore(BaseModel):
    """Score for a single entity from a single prompt."""

    entity_name: str
    prompt_id: str
    provider: AIProvider
    raw_score: float = Field(..., ge=0, le=100)
    weighted_score: float
    prompt_weight: float
    position: int | None = None
    recommendation_type: RecommendationType
    context: str = ""


class ProviderScore(BaseModel):
    """ARI score breakdown for a specific AI provider."""

    provider: AIProvider
    score: float = Field(..., ge=0, le=100)
    mentions_count: int
    prompts_evaluated: int
    average_position: float | None = None


class ARIScore(BaseModel):
    """Complete ARI score for an entity."""

    id: UUID = Field(default_factory=uuid4)
    entity_id: UUID
    entity_name: str
    overall_score: float = Field(..., ge=0, le=100, description="Final ARI score 0-100")
    provider_scores: dict[str, float] = Field(
        default_factory=dict, description="Score by provider"
    )
    provider_details: list[ProviderScore] = Field(default_factory=list)
    prompt_scores: list[EntityPromptScore] = Field(default_factory=list)
    mentions_count: int = 0
    total_prompts: int = 0
    mention_rate: float = Field(0.0, description="% of prompts that mentioned entity")
    sample_responses: list[dict] = Field(
        default_factory=list, description="Example AI responses"
    )
    all_responses: list["PromptResponse"] = Field(
        default_factory=list, description="All prompt/provider responses"
    )
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    prompt_run_id: UUID | None = None

    class Config:
        from_attributes = True


class PromptResponse(BaseModel):
    """Complete response for a single prompt/provider combination."""

    prompt_id: str
    prompt_text: str
    intent: str
    provider: str
    model_version: str | None = None
    raw_response: str
    latency_ms: int | None = None
    tokens_used: int | None = None
    entity_mentioned: bool = False
    entity_position: int | None = None
    recommendation_type: str = "not_mentioned"
    all_mentions: list[dict] = Field(default_factory=list)
    error: str | None = None


class ComparisonResult(BaseModel):
    """Side-by-side comparison of two entities."""

    entity_a: ARIScore
    entity_b: ARIScore
    delta: float = Field(..., description="entity_a.score - entity_b.score")
    provider_deltas: dict[str, float] = Field(
        default_factory=dict, description="Score delta by provider"
    )
    winner: str = Field(..., description="Name of entity with higher score")
    summary: str = Field("", description="Human-readable comparison summary")
