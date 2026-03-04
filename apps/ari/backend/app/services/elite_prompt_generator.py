"""Elite complementary prompt generator.

Produces ~30 prompts that fill gaps between Gumshoe CSV coverage (category_default,
use_case) and the standard audit matrix's 8 dimensions. Targets the 6 dimensions
Gumshoe doesn't touch, plus 2 new Elite-only dimensions (negative_sentiment,
anti_pattern_probe).

Designed to be additive — called after generate_audit_matrix() when elite=True.
"""

import logging

from app.models.audit import AuditPromptDimension, AuditRenderedPrompt, BrandProfile
from app.services.audit_prompt_generator import DIMENSION_WEIGHTS

logger = logging.getLogger(__name__)

# Weights for Elite-only dimensions
ELITE_DIMENSION_WEIGHTS: dict[AuditPromptDimension, float] = {
    AuditPromptDimension.NEGATIVE_SENTIMENT: 0.08,
    AuditPromptDimension.ANTI_PATTERN_PROBE: 0.07,
}


def generate_elite_complementary(
    profile: BrandProfile,
    target_total: int = 30,
) -> list[AuditRenderedPrompt]:
    """Generate ~30 complementary prompts for Elite reports.

    Covers 6 existing dimensions (comparison, attribute_specific, gift_social,
    founder_brand, geographic, adjacent_category) with different templates than
    the standard audit generator, plus 2 new dimensions (negative_sentiment,
    anti_pattern_probe).

    Gracefully degrades when BrandProfile fields are empty — minimum ~12 prompts
    (comparison + attribute_specific + negative_sentiment).
    """
    prompts: list[AuditRenderedPrompt] = []

    company = profile.company_name
    entity_type = profile.entity_type or "company"
    category = profile.industry or "this category"

    # --- 6 existing dimensions (different templates from audit_prompt_generator) ---

    prompts.extend(_comparison(profile, company, entity_type, category))
    prompts.extend(_attribute_specific(profile, entity_type, category))
    prompts.extend(_gift_social(profile, entity_type, category))
    prompts.extend(_founder_brand(profile, company))
    prompts.extend(_geographic(profile, entity_type, category))
    prompts.extend(_adjacent_category(profile))

    # --- 2 new Elite-only dimensions ---

    prompts.extend(_negative_sentiment(profile, company, entity_type, category))
    prompts.extend(_anti_pattern_probe(profile, company, entity_type, category))

    logger.info(
        f"Generated {len(prompts)} elite complementary prompts "
        f"across {len(set(p.dimension for p in prompts))} dimensions"
    )
    return prompts


# --- Dimension Generators ---


def _comparison(
    profile: BrandProfile, company: str, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Comparison prompts — different templates from audit_prompt_generator."""
    prompts: list[AuditRenderedPrompt] = []
    weight = DIMENSION_WEIGHTS[AuditPromptDimension.COMPARISON] * 1.3  # H2H 1.3x

    competitors = [c.name for c in profile.competitors[:4] if c.name]
    if not competitors:
        return prompts

    templates = [
        "Compare {company} and {competitor} for {differentiator}.",
        "{company} vs {competitor} — which is better for {use_case}?",
        "What are the pros and cons of {company} compared to {competitor}?",
        "Between {company} and {competitor}, which would you recommend and why?",
    ]

    differentiators = profile.differentiators or [category]
    use_cases = profile.use_cases or profile.topics or [category]

    idx = 0
    for i, comp in enumerate(competitors):
        template = templates[i % len(templates)]
        text = template.format(
            company=company,
            competitor=comp,
            differentiator=differentiators[i % len(differentiators)],
            use_case=use_cases[i % len(use_cases)],
        )
        prompts.append(AuditRenderedPrompt(
            id=f"elite-cmp-{idx}",
            text=text,
            dimension=AuditPromptDimension.COMPARISON,
            competitor=comp,
            weight=weight,
        ))
        idx += 1

    return prompts


def _attribute_specific(
    profile: BrandProfile, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Attribute-specific prompts — focuses on differentiators."""
    prompts: list[AuditRenderedPrompt] = []
    weight = DIMENSION_WEIGHTS[AuditPromptDimension.ATTRIBUTE_SPECIFIC]

    differentiators = list(profile.differentiators[:4])
    if not differentiators:
        differentiators = list(profile.topics[:2]) if profile.topics else [category]

    templates = [
        "Which {category} company is best known for {differentiator}?",
        "Who leads in {differentiator} among {category} brands?",
        "What {category} company has the strongest {differentiator}?",
        "If {differentiator} is my top priority, which {entity_type} should I choose?",
    ]

    idx = 0
    for i, diff in enumerate(differentiators):
        template = templates[i % len(templates)]
        text = template.format(
            category=category, entity_type=entity_type, differentiator=diff
        )
        prompts.append(AuditRenderedPrompt(
            id=f"elite-attr-{idx}",
            text=text,
            dimension=AuditPromptDimension.ATTRIBUTE_SPECIFIC,
            topic=diff,
            weight=weight,
        ))
        idx += 1

    return prompts


def _gift_social(
    profile: BrandProfile, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Gift/social/occasion prompts — persona x occasion focus."""
    prompts: list[AuditRenderedPrompt] = []
    weight = DIMENSION_WEIGHTS[AuditPromptDimension.GIFT_SOCIAL]

    occasions = list(profile.occasions[:3]) if profile.occasions else []
    if not occasions:
        return prompts

    personas = profile.personas[:2] if profile.personas else ["someone"]

    templates = [
        "What {category} would you recommend for {occasion}?",
        "Best {entity_type} to recommend to {persona} for {occasion}?",
        "What's a great {entity_type} choice for {occasion}?",
    ]

    idx = 0
    for i, occasion in enumerate(occasions):
        persona = personas[i % len(personas)]
        template = templates[i % len(templates)]
        text = template.format(
            category=category, entity_type=entity_type,
            occasion=occasion, persona=persona,
        )
        prompts.append(AuditRenderedPrompt(
            id=f"elite-gift-{idx}",
            text=text,
            dimension=AuditPromptDimension.GIFT_SOCIAL,
            persona=persona,
            topic=occasion,
            weight=weight,
        ))
        idx += 1

    return prompts


def _founder_brand(
    profile: BrandProfile, company: str
) -> list[AuditRenderedPrompt]:
    """Founder/brand prompts — only emitted when founders exist."""
    prompts: list[AuditRenderedPrompt] = []
    weight = DIMENSION_WEIGHTS[AuditPromptDimension.FOUNDER_BRAND]

    if not profile.founders:
        return prompts

    templates_per_founder = [
        "Who is {founder}?",
        "What is {founder}'s background?",
    ]

    idx = 0
    for founder in profile.founders[:2]:
        if not founder.name:
            continue
        for template in templates_per_founder:
            text = template.format(founder=founder.name)
            prompts.append(AuditRenderedPrompt(
                id=f"elite-fnd-{idx}",
                text=text,
                dimension=AuditPromptDimension.FOUNDER_BRAND,
                weight=weight,
                metadata={"founder": founder.name},
            ))
            idx += 1

    # Brand-level
    prompts.append(AuditRenderedPrompt(
        id=f"elite-fnd-{idx}",
        text=f"Who founded {company}?",
        dimension=AuditPromptDimension.FOUNDER_BRAND,
        weight=weight,
    ))
    idx += 1
    prompts.append(AuditRenderedPrompt(
        id=f"elite-fnd-{idx}",
        text=f"Who runs {company}?",
        dimension=AuditPromptDimension.FOUNDER_BRAND,
        weight=weight,
    ))

    return prompts


def _geographic(
    profile: BrandProfile, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Geographic prompts — only emitted when regions exist."""
    prompts: list[AuditRenderedPrompt] = []
    weight = DIMENSION_WEIGHTS[AuditPromptDimension.GEOGRAPHIC]

    if not profile.regions:
        return prompts

    templates = [
        "Best {category} companies in {region}?",
        "Which {entity_type} would you recommend in {region}?",
        "Who are the top {category} providers in {region}?",
    ]

    idx = 0
    for i, region in enumerate(profile.regions[:3]):
        template = templates[i % len(templates)]
        text = template.format(
            category=category, entity_type=entity_type, region=region
        )
        prompts.append(AuditRenderedPrompt(
            id=f"elite-geo-{idx}",
            text=text,
            dimension=AuditPromptDimension.GEOGRAPHIC,
            topic=region,
            weight=weight,
        ))
        idx += 1

    return prompts


def _adjacent_category(
    profile: BrandProfile,
) -> list[AuditRenderedPrompt]:
    """Adjacent category prompts — only emitted when adjacent_categories exist."""
    prompts: list[AuditRenderedPrompt] = []
    weight = DIMENSION_WEIGHTS[AuditPromptDimension.ADJACENT_CATEGORY]

    if not profile.adjacent_categories:
        return prompts

    templates = [
        "Top companies in {adj_category}?",
        "What brands would you recommend for {adj_category}?",
        "If I'm interested in {adj_category}, what companies should I know about?",
        "Who are the leaders in {adj_category}?",
    ]

    idx = 0
    for i, adj in enumerate(profile.adjacent_categories[:4]):
        template = templates[i % len(templates)]
        text = template.format(adj_category=adj)
        prompts.append(AuditRenderedPrompt(
            id=f"elite-adj-{idx}",
            text=text,
            dimension=AuditPromptDimension.ADJACENT_CATEGORY,
            topic=adj,
            weight=weight,
        ))
        idx += 1

    return prompts


# --- New Elite-only dimensions ---


def _negative_sentiment(
    profile: BrandProfile, company: str, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Negative sentiment — probes for complaints, risks, things to avoid."""
    weight = ELITE_DIMENSION_WEIGHTS[AuditPromptDimension.NEGATIVE_SENTIMENT]

    templates = [
        f"What are common complaints about {company}?",
        f"What problems do customers have with {category} companies?",
        f"What are the biggest risks when choosing a {entity_type}?",
        f"What should I avoid when selecting a {category} provider?",
    ]

    return [
        AuditRenderedPrompt(
            id=f"elite-neg-{i}",
            text=text,
            dimension=AuditPromptDimension.NEGATIVE_SENTIMENT,
            weight=weight,
        )
        for i, text in enumerate(templates)
    ]


def _anti_pattern_probe(
    profile: BrandProfile, company: str, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Anti-pattern probes — targeted queries that surface known anti-patterns."""
    prompts: list[AuditRenderedPrompt] = []
    weight = ELITE_DIMENSION_WEIGHTS[AuditPromptDimension.ANTI_PATTERN_PROBE]

    idx = 0

    # Name fragmentation probe
    if profile.aliases:
        alias = profile.aliases[0]
        prompts.append(AuditRenderedPrompt(
            id=f"elite-ap-{idx}",
            text=f"Is {company} the same as {alias}?",
            dimension=AuditPromptDimension.ANTI_PATTERN_PROBE,
            weight=weight,
            metadata={"anti_pattern": "name_fragmentation"},
        ))
        idx += 1

    # Dual category trap probe
    if profile.adjacent_categories:
        adj = profile.adjacent_categories[0]
        prompts.append(AuditRenderedPrompt(
            id=f"elite-ap-{idx}",
            text=f"Does {company} also do {adj}?",
            dimension=AuditPromptDimension.ANTI_PATTERN_PROBE,
            weight=weight,
            metadata={"anti_pattern": "dual_category_trap"},
        ))
        idx += 1

    # Narrative accuracy probe
    if profile.differentiators:
        diff = profile.differentiators[0]
        prompts.append(AuditRenderedPrompt(
            id=f"elite-ap-{idx}",
            text=f"Are {company}'s {diff} claims accurate?",
            dimension=AuditPromptDimension.ANTI_PATTERN_PROBE,
            weight=weight,
            metadata={"anti_pattern": "narrative_accuracy"},
        ))
        idx += 1

    # Kleenex effect probe
    if profile.category_leader:
        prompts.append(AuditRenderedPrompt(
            id=f"elite-ap-{idx}",
            text=f"How does {company} compare to {profile.category_leader}?",
            dimension=AuditPromptDimension.ANTI_PATTERN_PROBE,
            weight=weight,
            metadata={"anti_pattern": "kleenex_effect"},
        ))
        idx += 1

    # Fallback: always emit at least 1 generic anti-pattern probe
    if not prompts:
        prompts.append(AuditRenderedPrompt(
            id=f"elite-ap-{idx}",
            text=f"What do people get wrong about {company}?",
            dimension=AuditPromptDimension.ANTI_PATTERN_PROBE,
            weight=weight,
            metadata={"anti_pattern": "generic"},
        ))

    return prompts
