"""Pydantic models for publications, distributors, and article placements.

Three-list Venn diagram:
  A = Inventory (NewsUSA purchasable)
  B = Gumshoe (AI-cited sources)
  C = Strategy (curated recommendations)

Seven tiers:
  1 = A∩B∩C  — Buyable + Cited + Strategic (slam dunk)
  2 = A∩B    — Buyable + Cited (high value, citation evidence)
  3 = A∩C    — Buyable + Strategic (educated bet)
  4 = B∩C    — Cited + Strategic, NOT buyable (find distributor!)
  5 = C only — Strategic only
  6 = B only — Cited only (organic, informational)
  7 = A only — Buyable only (lowest priority)
"""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# --- Enums ---


class PlacementStatus(str, Enum):
    PLANNED = "planned"
    SUBMITTED = "submitted"
    PUBLISHED = "published"
    REJECTED = "rejected"


class GroupType(str, Enum):
    TIER = "tier"
    INDUSTRY = "industry"
    REGION = "region"
    BUDGET = "budget"
    CLIENT = "client"


class PublicationType(str, Enum):
    NEWS = "news"
    VIDEO = "video"
    FORUM = "forum"
    BLOG = "blog"
    REVIEW = "review"
    REFERENCE = "reference"
    GOVERNMENT = "government"
    ACADEMIC = "academic"
    SOCIAL = "social"
    AGGREGATOR = "aggregator"
    INDUSTRY = "industry"


# Tier labels for display
TIER_LABELS = {
    1: "A∩B∩C — Buyable + Cited + Strategic",
    2: "A∩B — Buyable + Cited",
    3: "A∩C — Buyable + Strategic",
    4: "B∩C — Cited + Strategic (need distributor)",
    5: "C — Strategic only",
    6: "B — Cited only",
    7: "A — Buyable only",
}

TIER_COLORS = {
    1: "#10b981",  # emerald  — best
    2: "#3b82f6",  # blue     — high value
    3: "#8b5cf6",  # violet   — strategic bet
    4: "#f59e0b",  # amber    — action needed
    5: "#6b7280",  # gray     — monitor
    6: "#94a3b8",  # slate    — informational
    7: "#d1d5db",  # light gray — lowest
}


# --- Distributors ---


class DistributorCreate(BaseModel):
    name: str = Field(..., description="Distributor company name")
    website: str = Field("", description="Distributor website URL")
    description: str = Field("", description="Brief description")


class Distributor(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    slug: str
    website: str = ""
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Publications ---


class Publication(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    distributor_id: UUID | None = None
    name: str
    url: str = ""
    domain: str = ""
    domain_authority: int | None = None
    domain_rating: int | None = None
    ai_score: float | None = None
    ai_tier: str = ""
    common_crawl: str = ""
    price_usd: int | None = None
    turnaround: str = ""
    region: str = ""
    dofollow: bool = False
    publication_type: str = "news"
    category: str = ""
    citation_count: int = 0
    source_lists: list[str] = Field(default_factory=list)
    recommendation_tier: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Citations ---


class PublicationCitation(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    publication_id: UUID
    source_url: str
    domain: str
    model: str
    persona: str = ""
    question: str = ""
    topics: list[str] = Field(default_factory=list)
    answer_id: str = ""
    prompt_id: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Publication Groups ---


class PublicationGroupCreate(BaseModel):
    name: str = Field(..., description="Group name")
    group_type: GroupType = Field(..., description="Group classification")
    description: str = Field("", description="Group description")
    metadata: dict[str, Any] = Field(default_factory=dict)


class PublicationGroup(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    slug: str
    group_type: GroupType
    description: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GroupMemberAdd(BaseModel):
    publication_ids: list[UUID] = Field(..., description="Publication IDs to add")


# --- Article Publications ---


class ArticlePublicationCreate(BaseModel):
    publication_ids: list[UUID] = Field(..., description="Publication IDs to assign")
    status: PlacementStatus = Field(PlacementStatus.PLANNED, description="Initial status")


class ArticlePublication(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    article_run_id: UUID
    publication_id: UUID
    status: PlacementStatus = PlacementStatus.PLANNED
    published_url: str = ""
    published_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Import Requests ---


class CSVImportRequest(BaseModel):
    customer_slug: str = Field(..., description="Customer directory slug (e.g. 'usmoneyreserve')")
    filename: str = Field(..., description="CSV filename within customer directory")
    distributor_name: str = Field(..., description="Distributor name (e.g. 'NewsUSA')")


class CSVImportResult(BaseModel):
    distributor_id: str
    distributor_name: str
    publications_imported: int
    publications_updated: int
    groups_created: list[str]


class SourcesImportRequest(BaseModel):
    customer_slug: str = Field(..., description="Customer directory slug")
    filename: str = Field("sources-38512.csv", description="Gumshoe sources CSV filename")


class SourcesImportResult(BaseModel):
    domains_imported: int
    domains_updated: int
    citations_created: int
    total_publications: int


class StrategyImportRequest(BaseModel):
    """Import a curated strategy recommendation list.

    Accepts a list of domain strings. Each domain will be tagged as 'strategy'
    in source_lists. Creates publications for domains not yet in the system.
    """
    domains: list[str] = Field(..., description="List of domain strings to tag as strategic targets")
    customer_slug: str = Field("", description="Optional customer context")


class StrategyImportResult(BaseModel):
    domains_tagged: int
    domains_created: int
    total_strategy: int
