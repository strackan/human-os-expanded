"""Entity models for companies, people, and products."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class EntityType(str, Enum):
    """Type of entity being tracked."""

    PERSON = "person"
    COMPANY = "company"
    PRODUCT = "product"


class EntityBase(BaseModel):
    """Base entity fields."""

    name: str = Field(..., description="Primary name of the entity")
    type: EntityType = Field(..., description="Type of entity")
    category: str = Field(..., description="Category for prompt context")
    aliases: list[str] = Field(default_factory=list, description="Alternative names")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class EntityCreate(EntityBase):
    """Schema for creating a new entity."""

    pass


class Entity(EntityBase):
    """Full entity with ID and timestamps."""

    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


# Demo entities for Rick (use Entity so they have stable IDs)
DEMO_ENTITIES = [
    Entity(
        id=UUID("650fc234-d5c6-416e-b621-7a35d05222b9"),
        name="NewsUSA",
        type=EntityType.COMPANY,
        category="content_syndication",
        aliases=["News USA", "newsusa.com"],
        metadata={
            "founded": 1987,
            "revenue": "$22.6M",
            "reach": "2,500+ news sites",
            "description": "Content syndication and guaranteed media placement service",
        },
    ),
    Entity(
        id=UUID("f3ac6236-a6ac-4a06-8c24-34cd88e071bf"),
        name="NAPS",
        type=EntityType.COMPANY,
        category="content_syndication",
        aliases=["North American Precis Syndicate", "napsnet.com"],
        metadata={
            "founded": 1958,
            "revenue": "~$15M",
            "reach": "10,000+ newspapers (claimed)",
            "description": "Content syndication service, competitor to NewsUSA",
        },
    ),
    Entity(
        id=UUID("1811ca98-8c83-4ae7-abac-383e2d198964"),
        name="Rick Smith",
        type=EntityType.PERSON,
        category="content_syndication",
        aliases=["Rick Smith NewsUSA", "NewsUSA founder"],
        metadata={
            "role": "Founder & CEO",
            "company": "NewsUSA",
            "description": "Founder of NewsUSA content syndication service",
        },
    ),
    Entity(
        id=UUID("16612c82-6273-4a72-9bf4-cbfc2b18b141"),
        name="Dorothy York",
        type=EntityType.PERSON,
        category="content_syndication",
        aliases=["Dorothy York NAPS", "NAPS CEO"],
        metadata={
            "role": "President & CEO",
            "company": "NAPS",
            "description": "President & CEO of North American Precis Syndicate",
        },
    ),
    # Additional competitors for comparison
    Entity(
        id=UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"),
        name="PR Newswire",
        type=EntityType.COMPANY,
        category="content_syndication",
        aliases=["PRNewswire", "prnewswire.com"],
        metadata={
            "founded": 1954,
            "parent": "Cision",
            "description": "Press release distribution service",
        },
    ),
    Entity(
        id=UUID("b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e"),
        name="Business Wire",
        type=EntityType.COMPANY,
        category="content_syndication",
        aliases=["BusinessWire", "businesswire.com"],
        metadata={
            "founded": 1961,
            "parent": "Berkshire Hathaway",
            "description": "Press release distribution and regulatory disclosure service",
        },
    ),
    Entity(
        id=UUID("c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f"),
        name="GlobeNewswire",
        type=EntityType.COMPANY,
        category="content_syndication",
        aliases=["Globe Newswire", "globenewswire.com"],
        metadata={
            "founded": 1995,
            "parent": "Intrado",
            "description": "Press release distribution and investor relations service",
        },
    ),
]
