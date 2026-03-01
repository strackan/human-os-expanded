"""Pydantic models for the article optimizer service."""

from pydantic import BaseModel, Field, model_validator


class OptimizeRequest(BaseModel):
    """Request to optimize an article for AI readability."""

    content: str | None = Field(
        None,
        min_length=50,
        description="Article content (HTML or plain text). Min 50 chars.",
    )
    url: str | None = Field(
        None,
        description="URL to fetch article HTML from. Used if content is not provided.",
    )
    format: str = Field(
        "auto",
        description="Content format: 'html', 'text', or 'auto' (detect).",
        pattern="^(html|text|auto)$",
    )

    @model_validator(mode="after")
    def require_content_or_url(self) -> "OptimizeRequest":
        if not self.content and not self.url:
            raise ValueError("Must provide either 'content' or 'url' (or both).")
        return self


class ScrapedData(BaseModel):
    """Structural data extracted from the article."""

    title: str = ""
    meta_description: str = ""
    h1: list[str] = Field(default_factory=list)
    h2: list[str] = Field(default_factory=list)
    h3: list[str] = Field(default_factory=list)
    body_text: str = ""
    word_count: int = 0
    has_json_ld: bool = False
    has_faq_schema: bool = False
    bullets_count: int = 0


class FAQItem(BaseModel):
    """A single FAQ question and answer."""

    question: str
    answer: str


class LLMResults(BaseModel):
    """Results from LLM analysis of the article."""

    weaknesses: list[str] = Field(default_factory=list)
    entities: list[str] = Field(default_factory=list)
    themes: list[str] = Field(default_factory=list)
    tone_analysis: str = ""
    target_audience: str = ""
    summary: str = ""
    faq: list[FAQItem] = Field(default_factory=list)
    schema_suggestion: str = ""


class ScoreBreakdown(BaseModel):
    """Breakdown of the AI-readiness score by category."""

    structured_headings: float = Field(0, ge=0, le=20)
    faq_presence: float = Field(0, ge=0, le=20)
    clear_entity_mentions: float = Field(0, ge=0, le=20)
    bullet_data_blocks: float = Field(0, ge=0, le=20)
    extractability_clarity: float = Field(0, ge=0, le=10)
    structured_metadata: float = Field(0, ge=0, le=10)


class ScoreData(BaseModel):
    """AI-readiness score for an article."""

    total_score: float = Field(0, ge=0, le=100)
    breakdown: ScoreBreakdown = Field(default_factory=ScoreBreakdown)


class EnhancementPack(BaseModel):
    """Discrete, paste-ready enhancement blocks generated from article content.

    Non-destructive: these are additive blocks that sit alongside the original
    article body, never replacing it.
    """

    ai_summary_html: str = Field("", description="HTML <ul> with 3-5 bullet takeaways")
    key_findings_html: str = Field("", description="HTML <div> with structured factual highlights")
    faq_html: str = Field("", description="HTML <dl> formatted Q&A block")
    schema_jsonld: str = Field("", description="Complete <script type='application/ld+json'> tag")
    meta_description: str = Field("", description="SEO meta description, ≤160 chars")
    faq_structured: list[FAQItem] = Field(default_factory=list, description="Raw FAQ data for programmatic use")


# Keep for backwards compat — will remove once frontend is updated
class OptimizedContent(BaseModel):
    """LLM-generated optimized version of the article."""

    model_config = {"populate_by_name": True}

    ai_summary: str = ""
    key_facts: list[str] = Field(default_factory=list)
    rewritten_markdown: str = ""
    faq: list[FAQItem] = Field(default_factory=list)
    schema_jsonld: dict | None = Field(None, serialization_alias="schema_json")
    meta_description: str = ""


class OriginalAnalysis(BaseModel):
    """Analysis of the original article."""

    scraped: ScrapedData = Field(default_factory=ScrapedData)
    score: ScoreData = Field(default_factory=ScoreData)
    llm: LLMResults = Field(default_factory=LLMResults)


class EnhanceResponse(BaseModel):
    """Response from the enhance endpoint — enhancements + original analysis."""

    analysis: OriginalAnalysis = Field(default_factory=OriginalAnalysis)
    enhancements: EnhancementPack = Field(default_factory=EnhancementPack)


class BeforeAfterMetrics(BaseModel):
    """Before/after comparison metrics."""

    original_score: float = 0
    optimized_score: float = 0
    improvement: float = 0
    original_word_count: int = 0
    optimized_word_count: int = 0


class OptimizeResponse(BaseModel):
    """Full response from the optimize endpoint (legacy)."""

    original_analysis: OriginalAnalysis = Field(default_factory=OriginalAnalysis)
    optimized_content: OptimizedContent = Field(default_factory=OptimizedContent)
    metrics: BeforeAfterMetrics = Field(default_factory=BeforeAfterMetrics)
