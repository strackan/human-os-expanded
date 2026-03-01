"""Pydantic models for the article generation pipeline."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# --- Enums ---


class ArticleStatus(str, Enum):
    """Pipeline lifecycle status."""

    PENDING = "pending"
    PREPROCESSING = "preprocessing"
    WRITING = "writing"
    DRAFT_WRITER = "draft_writer"
    EDITING = "editing"
    DRAFT_EDITOR = "draft_editor"
    CONDENSING = "condensing"
    OPTIMIZING = "optimizing"
    COMPLETED = "completed"
    FAILED = "failed"


# --- Shared Components ---


class SpokespersonInfo(BaseModel):
    """Spokesperson for quote attribution."""

    name: str
    title: str
    company: str


# --- Phase 1: Writer ---


class ArticleInput(BaseModel):
    """Input data for article generation."""

    client_name: str = Field(..., description="Company/brand name")
    domain: str = Field(..., description="Client website domain")
    industry: str = Field(..., description="Industry vertical")
    article_topic: str = Field(..., description="Core topic for the article")
    target_keywords: list[str] = Field(default_factory=list, description="SEO target keywords")
    spokesperson: SpokespersonInfo | None = Field(None, description="Client spokesperson for quotes")
    key_claims: list[str] = Field(default_factory=list, description="Client talking points / claims to weave in")
    competitor_context: str = Field("", description="Competitive landscape summary")
    tone: str = Field("journalistic", description="Writing tone: journalistic, educational, authoritative")
    target_word_count: int = Field(1600, ge=800, le=3000, description="Target word count")
    gumshoe_payload: str = Field("", description="Pre-formatted Gumshoe analysis payload markdown")
    customer_slug: str = Field("", description="Customer directory slug for file lookups")


class WriterOutput(BaseModel):
    """Output from Phase 1 — Writer."""

    article_markdown: str = ""
    title: str = ""
    word_count: int = 0
    provider_used: str = ""
    latency_ms: int = 0


# --- Phase 2: Editor ---


class PassResult(BaseModel):
    """Result of a single editor pass."""

    pass_name: str
    changes_made: list[str] = Field(default_factory=list)
    issues_found: int = 0


class EditorsLog(BaseModel):
    """Structured editor's log from all passes."""

    passes: list[PassResult] = Field(default_factory=list)
    total_changes: int = 0
    aio_scorecard: dict[str, Any] = Field(default_factory=dict, description="AI-readiness scorecard")
    summary: str = ""


class EditorInput(BaseModel):
    """Input for Phase 2 — Editor."""

    article_markdown: str = Field(..., min_length=100, description="Draft article from Phase 1")
    client_name: str = Field(..., description="Company/brand name")
    domain: str = Field("", description="Client website domain")
    gumshoe_payload: str = Field("", description="Pre-formatted Gumshoe Pass 5 payload markdown")


class EditorOutput(BaseModel):
    """Output from Phase 2 — Editor."""

    hardened_markdown: str = ""
    editors_log: EditorsLog = Field(default_factory=EditorsLog)
    word_count: int = 0
    provider_used: str = ""
    latency_ms: int = 0


# --- Phase 3: Condenser ---


class CondenserInput(BaseModel):
    """Input for Phase 3 — Condenser (long-form to distribution-length)."""

    article_markdown: str = Field(..., min_length=100, description="Hardened article from Phase 2")
    client_name: str = Field(..., description="Company/brand name")
    domain: str = Field("", description="Client website domain")
    target_word_count: int = Field(400, ge=300, le=600, description="Target word count for condensed version")
    preserve_keywords: list[str] = Field(default_factory=list, description="Keywords that must appear in condensed version")
    spokesperson: SpokespersonInfo | None = Field(None, description="Client spokesperson for quote attribution")


class CondenserOutput(BaseModel):
    """Output from Phase 3 — Condenser."""

    condensed_markdown: str = ""
    title: str = ""
    word_count: int = 0
    source_word_count: int = 0
    compression_ratio: float = 0.0
    entities_preserved: list[str] = Field(default_factory=list, description="Key entities retained from original")
    data_points_preserved: int = 0
    provider_used: str = ""
    latency_ms: int = 0


# --- Phase 4: HTML Converter ---


class ConverterInput(BaseModel):
    """Input for Phase 4 — HTML Converter."""

    article_markdown: str = Field(..., min_length=100, description="Hardened article from Phase 2")
    client_name: str = Field(..., description="Company/brand name")
    domain: str = Field("", description="Client website domain")
    author_name: str = Field("", description="Author attribution")
    publish_date: str = Field("", description="ISO date string for publication")


class OptimizerOutput(BaseModel):
    """Output from Phase 4 — HTML Converter/Optimizer."""

    article_html: str = ""
    structured_data_json: dict[str, Any] = Field(default_factory=dict)
    optimizers_log: str = ""
    score_before: float = 0.0
    score_after: float = 0.0
    latency_ms: int = 0


# --- Gumshoe ---


class GumshoeQuery(BaseModel):
    """A single query from Gumshoe questions export."""

    id: int
    persona: str
    query: str
    topics: list[str] = Field(default_factory=list)
    model_mentions: dict[str, int | None] = Field(
        default_factory=dict,
        description="Model → mention rank (None = not mentioned)",
    )


class CompetitorMention(BaseModel):
    """A competitor mention extracted from Gumshoe."""

    brand_name: str
    brand_domain: str
    model: str
    rank: int | None = None
    snippet: str = ""
    prompt_id: int | None = None


class GumshoePayload(BaseModel):
    """Parsed Gumshoe data for a customer/persona."""

    customer_slug: str
    brand_domain: str
    persona_filter: str = ""
    queries: list[GumshoeQuery] = Field(default_factory=list)
    competitor_mentions: list[CompetitorMention] = Field(default_factory=list)
    competitive_landscape: dict[str, int] = Field(
        default_factory=dict,
        description="Competitor domain → total mention count",
    )
    binding_checklist: list[str] = Field(
        default_factory=list,
        description="Topics the client is NOT mentioned for",
    )
    payload_markdown: str = Field("", description="Pre-formatted markdown for Editor Pass 5 injection")
    source_files: list[str] = Field(default_factory=list)


class GumshoeParseRequest(BaseModel):
    """Request to parse Gumshoe CSVs for a customer."""

    customer_slug: str = Field(..., description="Customer directory name under customers/")
    brand_domain: str = Field(..., description="Brand domain to track (e.g. usmoneyreserve.com)")
    persona_filter: str = Field("", description="Filter to a specific persona (empty = all)")


# --- Pipeline Run ---


class ArticleRun(BaseModel):
    """Full pipeline lifecycle record."""

    id: UUID = Field(default_factory=uuid4)
    customer_slug: str = ""
    domain: str = ""
    article_topic: str = ""
    status: ArticleStatus = ArticleStatus.PENDING
    input_data: ArticleInput | None = None
    writer_output: WriterOutput | None = None
    editor_output: EditorOutput | None = None
    optimizer_output: OptimizerOutput | None = None
    condenser_output: CondenserOutput | None = None
    cost_usd: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
