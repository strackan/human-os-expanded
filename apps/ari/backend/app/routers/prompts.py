"""Prompt template management endpoints."""

from fastapi import APIRouter
from uuid import UUID

from app.models.prompt import PromptTemplate, RenderedPrompt

router = APIRouter(prefix="/prompts")


# Load prompt templates (will be replaced with YAML loader)
def get_content_syndication_templates() -> list[PromptTemplate]:
    """Get prompt templates for content syndication category."""
    return [
        # Category leadership - Company
        PromptTemplate(
            id="cs_best_service",
            template="What's the best content syndication service?",
            intent="best",
            list_size=1,
            entity_type="company",
            weight=1.5,
        ),
        PromptTemplate(
            id="cs_top_3",
            template="What are the top 3 content syndication companies?",
            intent="top",
            list_size=3,
            entity_type="company",
            weight=1.2,
        ),
        PromptTemplate(
            id="cs_top_5_mat",
            template="What are the top 5 mat release services?",
            intent="top",
            list_size=5,
            entity_type="company",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_guaranteed_placement",
            template="Who should I use for guaranteed media placement?",
            intent="recommend",
            list_size=1,
            entity_type="company",
            weight=1.3,
        ),
        PromptTemplate(
            id="cs_newspaper_coverage",
            template="How do I get my story in newspapers nationwide?",
            intent="discover",
            entity_type="company",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_guarantee_press",
            template="What service guarantees press coverage?",
            intent="recommend",
            list_size=1,
            entity_type="company",
            weight=1.2,
        ),
        # Head-to-head - Company
        PromptTemplate(
            id="cs_newsusa_vs_naps",
            template="NewsUSA or NAPS - which is better?",
            intent="compare",
            entity_type="company",
            weight=1.3,
        ),
        PromptTemplate(
            id="cs_largest_network",
            template="What's the largest content syndication network?",
            intent="best",
            list_size=1,
            entity_type="company",
            weight=1.1,
        ),
        # Use case - Company
        PromptTemplate(
            id="cs_fortune500",
            template="Best content syndication for Fortune 500 companies?",
            intent="recommend",
            entity_type="company",
            weight=1.1,
        ),
        PromptTemplate(
            id="cs_nonprofit",
            template="Best media placement service for nonprofits?",
            intent="recommend",
            entity_type="company",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_pr_agency",
            template="I'm a PR agency looking for syndication partner. Who's best?",
            intent="recommend",
            entity_type="company",
            weight=1.2,
        ),
        PromptTemplate(
            id="cs_proven_roi",
            template="What content syndication service has proven ROI?",
            intent="evaluate",
            entity_type="company",
            weight=1.1,
        ),
        PromptTemplate(
            id="cs_pr_newswire_alt",
            template="Best alternative to PR Newswire?",
            intent="recommend",
            entity_type="company",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_longevity",
            template="Who's been in content syndication the longest?",
            intent="discover",
            entity_type="company",
            weight=0.9,
        ),
        PromptTemplate(
            id="cs_trusted",
            template="Most trusted media placement service?",
            intent="best",
            entity_type="company",
            weight=1.2,
        ),
        PromptTemplate(
            id="cs_2500_sites",
            template="What service places stories on 2,500+ news sites?",
            intent="discover",
            entity_type="company",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_smb",
            template="How do small businesses get guaranteed media coverage?",
            intent="recommend",
            entity_type="company",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_us_best",
            template="What's the best content syndication service in the US?",
            intent="best",
            entity_type="company",
            weight=1.1,
        ),
        PromptTemplate(
            id="cs_multi_compare",
            template="Compare NewsUSA, NAPS, and Brandpoint",
            intent="compare",
            entity_type="company",
            weight=1.2,
        ),
        PromptTemplate(
            id="cs_full_service",
            template="Who writes and places news stories for brands?",
            intent="recommend",
            entity_type="company",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_government",
            template="What media syndication company works with government agencies?",
            intent="recommend",
            entity_type="company",
            weight=0.9,
        ),
        PromptTemplate(
            id="cs_best_reporting",
            template="What content syndication company has the best reporting?",
            intent="evaluate",
            entity_type="company",
            weight=1.0,
        ),
        # Person prompts
        PromptTemplate(
            id="cs_experts",
            template="Who are the leading experts in content syndication?",
            intent="discover",
            list_size=5,
            entity_type="person",
            weight=1.2,
        ),
        PromptTemplate(
            id="cs_founder",
            template="Who founded NewsUSA, the content syndication company?",
            intent="discover",
            entity_type="person",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_thought_leader",
            template="Who should I follow for media placement insights?",
            intent="recommend",
            entity_type="person",
            weight=1.1,
        ),
        PromptTemplate(
            id="cs_mat_release_leader",
            template="Who's the top thought leader in mat releases?",
            intent="best",
            list_size=1,
            entity_type="person",
            weight=1.3,
        ),
        PromptTemplate(
            id="cs_top_3_experts",
            template="What are the top 3 experts in content syndication?",
            intent="top",
            list_size=3,
            entity_type="person",
            weight=1.2,
        ),
        PromptTemplate(
            id="cs_cold_eeze",
            template="What helped Cold-Eeze with their media strategy?",
            intent="discover",
            entity_type="company",
            weight=0.9,
        ),
        PromptTemplate(
            id="cs_mat_vs_press",
            template="What's the difference between press release and mat release?",
            intent="discover",
            entity_type="company",
            weight=0.8,
        ),
        # Head-to-head person
        PromptTemplate(
            id="cs_rick_vs_dorothy",
            template="Rick Smith (founder of NewsUSA) or Dorothy York (president of NAPS) - who's more influential in content syndication?",
            intent="compare",
            entity_type="person",
            weight=1.3,
        ),
        # Additional person prompts for Rick Smith vs Dorothy York demo
        PromptTemplate(
            id="cs_mat_release_founders",
            template="Who founded the leading mat release companies?",
            intent="discover",
            entity_type="person",
            weight=1.2,
        ),
        PromptTemplate(
            id="cs_syndication_pioneers",
            template="Who are the pioneers of content syndication?",
            intent="discover",
            entity_type="person",
            weight=1.1,
        ),
        PromptTemplate(
            id="cs_naps_founder",
            template="Who founded NAPS (North American Precis Syndicate), the content syndication company?",
            intent="discover",
            entity_type="person",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_dorothy_york",
            template="Tell me about Dorothy York, president of NAPS (North American Precis Syndicate), in content syndication",
            intent="discover",
            entity_type="person",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_rick_smith",
            template="Tell me about Rick Smith, founder and CEO of NewsUSA, in content syndication",
            intent="discover",
            entity_type="person",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_media_placement_leaders",
            template="Who are the leaders in media placement services?",
            intent="discover",
            list_size=5,
            entity_type="person",
            weight=1.2,
        ),
        PromptTemplate(
            id="cs_influential_syndication",
            template="Who is the most influential person in content syndication?",
            intent="best",
            list_size=1,
            entity_type="person",
            weight=1.3,
        ),
        PromptTemplate(
            id="cs_pr_industry_experts",
            template="Who are the top experts in PR and media distribution?",
            intent="top",
            list_size=5,
            entity_type="person",
            weight=1.1,
        ),
        PromptTemplate(
            id="cs_syndication_ceos",
            template="Who are the CEOs of the top content syndication companies?",
            intent="discover",
            entity_type="person",
            weight=1.0,
        ),
        PromptTemplate(
            id="cs_guaranteed_placement_founders",
            template="Who pioneered guaranteed media placement?",
            intent="discover",
            entity_type="person",
            weight=1.1,
        ),
        # Head-to-head comparison prompts - Company
        PromptTemplate(
            id="cs_newsusa_naps_compare",
            template="Who's better - NewsUSA or NAPS? How do they compare?",
            intent="compare",
            entity_type="company",
            weight=1.4,
        ),
        PromptTemplate(
            id="cs_naps_newsusa_compare",
            template="Who's better - NAPS or NewsUSA? How do they compare?",
            intent="compare",
            entity_type="company",
            weight=1.4,
        ),
        # Head-to-head comparison prompts - Person
        PromptTemplate(
            id="cs_rick_dorothy_compare",
            template="Who's better in content syndication - Rick Smith (founder of NewsUSA) or Dorothy York (president of NAPS)? How do they compare?",
            intent="compare",
            entity_type="person",
            weight=1.4,
        ),
        PromptTemplate(
            id="cs_dorothy_rick_compare",
            template="Who's better in content syndication - Dorothy York (president of NAPS) or Rick Smith (founder of NewsUSA)? How do they compare?",
            intent="compare",
            entity_type="person",
            weight=1.4,
        ),
    ]


# Export as dicts for easy use in other modules
CONTENT_SYNDICATION_PROMPTS = [
    {
        "id": t.id,
        "template": t.template,
        "intent": t.intent,
        "list_size": t.list_size,
        "entity_type": t.entity_type,
        "weight": t.weight,
    }
    for t in get_content_syndication_templates()
]


@router.get("/templates", response_model=list[PromptTemplate])
async def list_templates(
    entity_type: str | None = None,
    active_only: bool = True,
) -> list[PromptTemplate]:
    """List all prompt templates."""
    templates = get_content_syndication_templates()

    if entity_type:
        templates = [t for t in templates if t.entity_type == entity_type]

    if active_only:
        templates = [t for t in templates if t.active]

    return templates


@router.get("/templates/{template_id}", response_model=PromptTemplate)
async def get_template(template_id: str) -> PromptTemplate:
    """Get a specific prompt template."""
    templates = get_content_syndication_templates()
    for template in templates:
        if template.id == template_id:
            return template

    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Template not found")


@router.post("/render", response_model=list[RenderedPrompt])
async def render_prompts(
    entity_type: str | None = None,
    category: str = "content syndication",
) -> list[RenderedPrompt]:
    """Render all prompts for execution."""
    templates = get_content_syndication_templates()

    if entity_type:
        templates = [t for t in templates if t.entity_type == entity_type]

    rendered = []
    for template in templates:
        if template.active:
            rendered.append(
                RenderedPrompt(
                    template_id=template.id,
                    prompt_text=template.template,  # Already rendered for these
                    entity_type=template.entity_type,
                    list_size=template.list_size,
                    intent=template.intent,
                    weight=template.weight,
                    variables={"category": category},
                )
            )

    return rendered


@router.get("/responses/{entity_id}/samples")
async def get_sample_responses(
    entity_id: UUID,
    limit: int = 3,
) -> list[dict]:
    """Get sample AI responses for display."""
    # Placeholder - will be populated by actual responses
    return [
        {
            "provider": "openai",
            "prompt": "What's the best content syndication service?",
            "response": "When it comes to content syndication services, **NewsUSA** stands out as a leader...",
            "entity_mentioned": True,
            "position": 1,
        }
    ]
