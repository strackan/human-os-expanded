"""Data models for zero-mention probe diagnostics.

When ARI scores a brand and gets zero mentions in a particular persona,
topic, or dimension, the probe follow-up asks the LLM directly "Why didn't
you include this brand?" to surface actionable insights.
"""

from enum import Enum

from pydantic import BaseModel, Field


class ProbeType(str, Enum):
    """Type of follow-up probe."""

    KNOWLEDGE_CHECK = "knowledge_check"
    GAP_DIAGNOSIS = "gap_diagnosis"


class KnowledgeLevel(str, Enum):
    """How well the LLM knows the brand."""

    UNKNOWN = "unknown"
    VAGUELY_KNOWN = "vaguely_known"
    KNOWN_BUT_NOT_COMPETITIVE = "known_but_not_competitive"


class ProbeGapType(str, Enum):
    """Why the brand was omitted from recommendations."""

    CONTENT_GAP = "content_gap"
    AUTHORITY_GAP = "authority_gap"
    CATEGORY_MISMATCH = "category_mismatch"
    PROMPT_SENSITIVITY = "prompt_sensitivity"
    RECENCY_GAP = "recency_gap"


class ZeroMentionProbeResult(BaseModel):
    """Result of a single zero-mention probe."""

    probe_type: ProbeType
    persona: str = ""
    topic: str = ""
    dimension: str = ""  # audit only
    provider: str = ""
    knowledge_level: KnowledgeLevel = KnowledgeLevel.UNKNOWN
    gap_types: list[ProbeGapType] = Field(default_factory=list)
    raw_response: str = ""
    key_insight: str = ""
    suggested_actions: list[str] = Field(default_factory=list)
