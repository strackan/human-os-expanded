"""Prompt template models."""

from enum import Enum

from pydantic import BaseModel, Field


class Intent(str, Enum):
    """The intent/purpose of a prompt."""

    BEST = "best"
    TOP = "top"
    RECOMMEND = "recommend"
    COMPARE = "compare"
    DISCOVER = "discover"
    EVALUATE = "evaluate"


class PromptTemplate(BaseModel):
    """A prompt template with metadata for scoring."""

    id: str = Field(..., description="Unique template identifier")
    template: str = Field(..., description="Prompt template with {placeholders}")
    intent: Intent = Field(..., description="The intent being tested")
    list_size: int | None = Field(None, description="Expected list size (1, 3, 5)")
    entity_type: str = Field(..., description="Target entity type (person, company)")
    weight: float = Field(1.0, description="Scoring weight multiplier")
    active: bool = Field(True, description="Whether template is active")

    def render(self, **kwargs: str) -> str:
        """Render the template with provided variables."""
        return self.template.format(**kwargs)


class RenderedPrompt(BaseModel):
    """A fully rendered prompt ready for execution."""

    template_id: str
    prompt_text: str
    entity_type: str
    list_size: int | None = None
    intent: Intent | None = None
    weight: float = 1.0
    variables: dict[str, str] = Field(default_factory=dict)
