"""Data models for the full audit pipeline (Fancy Robot methodology)."""

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.models.lite_report import CompetitorInfo, DiscoveryResult


# --- Enums ---


class SeverityBand(str, Enum):
    """Severity classification based on overall ARI score."""

    CRITICAL = "critical"        # 0-15
    POOR = "poor"                # 16-30
    BELOW_AVERAGE = "below_avg"  # 31-45
    MODERATE = "moderate"        # 46-60
    GOOD = "good"                # 61-75
    STRONG = "strong"            # 76-90
    DOMINANT = "dominant"        # 91-100


class AuditPromptDimension(str, Enum):
    """The 8 prompt dimensions from the Fancy Robot methodology."""

    CATEGORY_DEFAULT = "category_default"
    USE_CASE = "use_case"
    COMPARISON = "comparison"
    ATTRIBUTE_SPECIFIC = "attribute_specific"
    GIFT_SOCIAL = "gift_social"
    FOUNDER_BRAND = "founder_brand"
    GEOGRAPHIC = "geographic"
    ADJACENT_CATEGORY = "adjacent_category"


class AntiPatternType(str, Enum):
    """The 10 named anti-patterns from the spec."""

    KLEENEX_EFFECT = "kleenex_effect"
    PREMIUM_TAX = "premium_tax"
    MESSY_MIDDLE = "messy_middle"
    FOUNDER_INVISIBILITY = "founder_invisibility"
    AWARD_AMNESIA = "award_amnesia"
    NAME_FRAGMENTATION = "name_fragmentation"
    DUAL_CATEGORY_TRAP = "dual_category_trap"
    SOCIAL_PROOF_NOT_AI_PROOF = "social_proof_not_ai_proof"
    PORTFOLIO_ISOLATION = "portfolio_isolation"
    AFFILIATE_DISTORTION = "affiliate_distortion"


class GapType(str, Enum):
    """Types of visibility gaps."""

    CONTENT = "content"
    NARRATIVE = "narrative"
    COMPETITIVE = "competitive"
    STRUCTURAL = "structural"
    CATEGORY = "category"


# --- Brand Profile (superset of DiscoveryResult) ---


class FounderProfile(BaseModel):
    """Detailed founder/leader profile."""

    name: str
    title: str = ""
    background: str = ""
    prior_companies: list[str] = Field(default_factory=list)
    ai_name_collision_risk: bool = False


class ProductInfo(BaseModel):
    """A product or service line."""

    name: str
    category: str = ""
    description: str = ""
    differentiators: list[str] = Field(default_factory=list)


class BrandProfile(BaseModel):
    """Deep brand profile - superset of DiscoveryResult with audit-specific fields."""

    # Core (from discovery)
    company_name: str
    domain: str
    industry: str = ""
    description: str = ""
    entity_type: str = "company"
    competitors: list[CompetitorInfo] = Field(default_factory=list)
    personas: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    differentiators: list[str] = Field(default_factory=list)

    # Extended (audit-specific)
    legal_entity: str = ""
    aliases: list[str] = Field(default_factory=list)
    founded: str = ""
    headquarters: str = ""
    founders: list[FounderProfile] = Field(default_factory=list)
    products: list[ProductInfo] = Field(default_factory=list)
    distribution_channels: list[str] = Field(default_factory=list)
    awards: list[str] = Field(default_factory=list)
    press_mentions: list[str] = Field(default_factory=list)
    brand_voice: str = ""
    use_cases: list[str] = Field(default_factory=list)
    occasions: list[str] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)
    adjacent_categories: list[str] = Field(default_factory=list)
    category_leader: str = ""  # The "Kleenex brand" for this category
    category_maturity: str = ""  # emerging, growing, mature, saturated
    sibling_brands: list[str] = Field(default_factory=list)

    @classmethod
    def from_discovery(cls, discovery: DiscoveryResult) -> "BrandProfile":
        """Upgrade a DiscoveryResult to a BrandProfile."""
        return cls(
            company_name=discovery.company_name,
            domain=discovery.domain,
            industry=discovery.industry,
            description=discovery.description,
            entity_type=discovery.entity_type,
            competitors=discovery.competitors,
            personas=discovery.personas,
            topics=discovery.topics,
            differentiators=discovery.differentiators,
        )


# --- Prompt Models ---


class AuditRenderedPrompt(BaseModel):
    """A single rendered prompt for the audit pipeline."""

    id: str
    text: str
    dimension: AuditPromptDimension
    persona: str = ""
    topic: str = ""
    weight: float = 1.0
    competitor: str = ""
    metadata: dict = Field(default_factory=dict)


# --- Analysis Results ---


class PromptAnalysisResult(BaseModel):
    """Result of a single prompt across one provider."""

    prompt_id: str
    prompt_text: str
    dimension: AuditPromptDimension
    persona: str = ""
    topic: str = ""
    provider: str
    model_version: str = ""
    raw_response: str = ""
    brand_mentioned: bool = False
    position: int | None = None
    recommendation_type: str = "not_mentioned"
    sentiment: str = "neutral"
    confidence: float = 0.0
    context: str = ""
    latency_ms: int = 0
    tokens_used: int | None = None


class DimensionScore(BaseModel):
    """Score breakdown for a single prompt dimension."""

    dimension: AuditPromptDimension
    score: float = 0.0
    mention_rate: float = 0.0
    prompt_count: int = 0
    avg_position: float | None = None


class ProviderAuditScore(BaseModel):
    """Score breakdown for a single provider."""

    provider: str
    score: float = 0.0
    mention_rate: float = 0.0
    prompt_count: int = 0
    avg_position: float | None = None


class AuditAnalysisResult(BaseModel):
    """Complete audit analysis result with 4-factor scoring."""

    # Overall
    overall_ari: float = 0.0
    severity_band: SeverityBand = SeverityBand.CRITICAL

    # 4-factor scores (each 0-100)
    mention_frequency: float = 0.0    # 40% weight
    position_quality: float = 0.0     # 25% weight
    narrative_accuracy: float = 0.0   # 20% weight
    founder_retrieval: float = 0.0    # 15% weight

    # Breakdowns
    dimension_scores: list[DimensionScore] = Field(default_factory=list)
    provider_scores: list[ProviderAuditScore] = Field(default_factory=list)
    persona_breakdown: dict[str, float] = Field(default_factory=dict)
    topic_breakdown: dict[str, float] = Field(default_factory=dict)
    competitor_mention_rates: dict[str, float] = Field(default_factory=dict)

    # Raw data
    total_prompts: int = 0
    total_responses: int = 0
    mentions_count: int = 0
    all_results: list[PromptAnalysisResult] = Field(default_factory=list)

    # Cost tracking
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0


# --- Anti-Patterns ---


class DetectedAntiPattern(BaseModel):
    """A detected anti-pattern with evidence."""

    pattern_type: AntiPatternType
    display_name: str
    severity: str = "medium"  # low, medium, high, critical
    evidence: str = ""
    recommendation: str = ""


class GapAnalysis(BaseModel):
    """A visibility gap with priority scoring."""

    gap_type: GapType
    description: str
    impact: float = 0.0       # 0-1
    effort: float = 0.5       # 0-1 (lower = easier)
    coverage: float = 0.0     # 0-1 (how much of the problem this addresses)
    priority_score: float = 0.0  # impact * coverage * (1/effort)
    recommendation: str = ""


# --- Report ---


class AuditReport(BaseModel):
    """The final audit report with all narrative sections."""

    executive_summary: str = ""
    core_problem: str = ""
    core_problem_name: str = ""  # e.g. "The Premium Tax"
    competitive_landscape: str = ""
    dimension_analysis: str = ""
    anti_patterns_section: str = ""
    recommendations: str = ""
    pitch_hook: str = ""
    full_markdown: str = ""


# --- Top-level Audit Run ---


class AuditRunStatus(str, Enum):
    """Status progression for an audit run."""

    PENDING = "pending"
    PROFILING = "profiling"
    GENERATING_MATRIX = "generating_matrix"
    ANALYZING = "analyzing"
    SCORING = "scoring"
    DETECTING_PATTERNS = "detecting_patterns"
    COMPOSING_REPORT = "composing_report"
    GENERATING_PDF = "generating_pdf"
    COMPLETED = "completed"
    FAILED = "failed"


class AuditRun(BaseModel):
    """A complete audit run record."""

    id: UUID = Field(default_factory=uuid4)
    domain: str
    company_name: str = ""
    status: AuditRunStatus = AuditRunStatus.PENDING
    report_type: str = "full_audit"

    # Results
    brand_profile: BrandProfile | None = None
    analysis_result: AuditAnalysisResult | None = None
    anti_patterns: list[DetectedAntiPattern] = Field(default_factory=list)
    gap_analysis: list[GapAnalysis] = Field(default_factory=list)
    report: AuditReport | None = None
    pdf_url: str = ""

    # Denormalized
    overall_score: float = 0.0
    severity_band: SeverityBand = SeverityBand.CRITICAL

    # Cost
    cost_usd: float = 0.0

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None

    # GFT link
    gft_company_id: str | None = None


# --- Utility ---


def get_severity_band(score: float) -> SeverityBand:
    """Map a 0-100 score to a severity band."""
    if score <= 15:
        return SeverityBand.CRITICAL
    elif score <= 30:
        return SeverityBand.POOR
    elif score <= 45:
        return SeverityBand.BELOW_AVERAGE
    elif score <= 60:
        return SeverityBand.MODERATE
    elif score <= 75:
        return SeverityBand.GOOD
    elif score <= 90:
        return SeverityBand.STRONG
    else:
        return SeverityBand.DOMINANT


SEVERITY_DISPLAY = {
    SeverityBand.CRITICAL: "Critical (0-15)",
    SeverityBand.POOR: "Poor (16-30)",
    SeverityBand.BELOW_AVERAGE: "Below Average (31-45)",
    SeverityBand.MODERATE: "Moderate (46-60)",
    SeverityBand.GOOD: "Good (61-75)",
    SeverityBand.STRONG: "Strong (76-90)",
    SeverityBand.DOMINANT: "Dominant (91-100)",
}
