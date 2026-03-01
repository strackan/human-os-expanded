"""Data models for the lite report (AI Visibility Snapshot) pipeline."""

from enum import Enum

from pydantic import BaseModel, Field


class LiteReportStatus(str, Enum):
    """Status progression for a lite report job."""

    DISCOVERING = "discovering"
    ANALYZING = "analyzing"
    SCORING = "scoring"
    SYNTHESIZING = "synthesizing"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class CompetitorInfo(BaseModel):
    """A competitor discovered during domain analysis."""

    name: str
    domain: str = ""


class DiscoveryResult(BaseModel):
    """Output of the discovery service: everything we learn about a domain."""

    company_name: str
    domain: str
    industry: str = ""
    description: str = ""
    entity_type: str = "company"
    competitors: list[CompetitorInfo] = Field(default_factory=list)
    personas: list[str] = Field(default_factory=list, description="4 audience personas")
    topics: list[str] = Field(default_factory=list, description="4 key topics")
    differentiators: list[str] = Field(default_factory=list)


class PersonaBreakdown(BaseModel):
    """Visibility breakdown for a single audience persona."""

    persona: str
    mention_count: int = 0
    total_prompts: int = 0
    mention_rate: float = 0.0
    avg_position: float | None = None
    top_competitor: str = ""


class TopicBreakdown(BaseModel):
    """Visibility breakdown for a single topic."""

    topic: str
    mention_count: int = 0
    total_prompts: int = 0
    mention_rate: float = 0.0
    avg_position: float | None = None


class CompetitorScore(BaseModel):
    """Aggregated score for a competitor entity."""

    name: str
    mention_count: int = 0
    mention_rate: float = 0.0
    avg_position: float | None = None
    source: str = "known"           # "known" or "discovered"
    ari_score: float | None = None  # position-weighted score (0-100)


class ArticleTeaser(BaseModel):
    """A recommended article topic that addresses a visibility gap."""

    title: str
    rationale: str = ""
    target_gap: str = ""


class LiteAnalysisResult(BaseModel):
    """Complete analysis result from the lite report pipeline."""

    overall_score: float = 0.0
    mention_rate: float = 0.0
    total_prompts: int = 0
    mentions_count: int = 0
    competitor_scores: list[CompetitorScore] = Field(default_factory=list)
    persona_breakdown: list[PersonaBreakdown] = Field(default_factory=list)
    topic_breakdown: list[TopicBreakdown] = Field(default_factory=list)
    key_findings: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    article_teasers: list[ArticleTeaser] = Field(default_factory=list)
    executive_summary: str = ""
    headline_stat: str = ""
    report_title: str = ""
    core_finding: str = ""
    core_finding_detail: str = ""
    strategic_recommendations: list[str] = Field(default_factory=list)
