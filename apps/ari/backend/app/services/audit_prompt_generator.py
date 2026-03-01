"""8-dimension audit prompt matrix generator.

Implements the Fancy Robot methodology's Phase 3 prompt dimensions:
category_default (20%), use_case (15%), comparison (10%), attribute_specific (15%),
gift_social (10%), founder_brand (15%), geographic (5%), adjacent_category (10%).

Target: ~60 prompts distributed proportionally across dimensions.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime

from app.models.audit import AuditPromptDimension, AuditRenderedPrompt, BrandProfile

logger = logging.getLogger(__name__)

# Dimension weights (must sum to 1.0)
DIMENSION_WEIGHTS: dict[AuditPromptDimension, float] = {
    AuditPromptDimension.CATEGORY_DEFAULT: 0.20,
    AuditPromptDimension.USE_CASE: 0.15,
    AuditPromptDimension.COMPARISON: 0.10,
    AuditPromptDimension.ATTRIBUTE_SPECIFIC: 0.15,
    AuditPromptDimension.GIFT_SOCIAL: 0.10,
    AuditPromptDimension.FOUNDER_BRAND: 0.15,
    AuditPromptDimension.GEOGRAPHIC: 0.05,
    AuditPromptDimension.ADJACENT_CATEGORY: 0.10,
}

TARGET_TOTAL_PROMPTS = 60


@dataclass
class AuditPromptConfig:
    """Configuration for prompt matrix generation."""

    dimension_weights: dict[AuditPromptDimension, float] = field(
        default_factory=lambda: dict(DIMENSION_WEIGHTS)
    )
    target_total: int = TARGET_TOTAL_PROMPTS


def generate_audit_matrix(
    profile: BrandProfile,
    config: AuditPromptConfig | None = None,
) -> list[AuditRenderedPrompt]:
    """Generate the full 8-dimension prompt matrix from a brand profile.

    Returns ~60 prompts distributed across 8 dimensions proportional to weights.
    """
    config = config or AuditPromptConfig()
    prompts: list[AuditRenderedPrompt] = []

    year = str(datetime.now().year)
    entity_type = profile.entity_type or "company"
    category = profile.industry or "this category"
    company = profile.company_name

    # Calculate target count per dimension
    dim_targets: dict[AuditPromptDimension, int] = {}
    for dim, weight in config.dimension_weights.items():
        dim_targets[dim] = max(2, round(config.target_total * weight))

    # Generate per dimension
    prompts.extend(_category_default(profile, dim_targets[AuditPromptDimension.CATEGORY_DEFAULT], entity_type, category, year))
    prompts.extend(_use_case(profile, dim_targets[AuditPromptDimension.USE_CASE], entity_type, category))
    prompts.extend(_comparison(profile, dim_targets[AuditPromptDimension.COMPARISON], entity_type, category))
    prompts.extend(_attribute_specific(profile, dim_targets[AuditPromptDimension.ATTRIBUTE_SPECIFIC], entity_type, category))
    prompts.extend(_gift_social(profile, dim_targets[AuditPromptDimension.GIFT_SOCIAL], entity_type, category))
    prompts.extend(_founder_brand(profile, dim_targets[AuditPromptDimension.FOUNDER_BRAND], company))
    prompts.extend(_geographic(profile, dim_targets[AuditPromptDimension.GEOGRAPHIC], entity_type, category))
    prompts.extend(_adjacent_category(profile, dim_targets[AuditPromptDimension.ADJACENT_CATEGORY]))

    logger.info(f"Generated {len(prompts)} audit prompts across {len(DIMENSION_WEIGHTS)} dimensions")
    return prompts


# --- Dimension Generators ---


def _category_default(
    profile: BrandProfile, target: int, entity_type: str, category: str, year: str
) -> list[AuditRenderedPrompt]:
    """Category default: 'Best X in Y', 'Top X companies', persona variations."""
    templates = [
        f"What is the best {entity_type} in {year}?",
        f"What are the top {entity_type} companies?",
        f"Who are the leading {category} companies?",
        f"What {entity_type} would you recommend?",
        f"What are the most trusted {category} brands?",
        f"If I need a {entity_type}, which company should I choose?",
        f"What are the top 5 {category} companies in {year}?",
        f"Which {entity_type} has the best reputation?",
    ]

    # Add persona variants
    for persona in profile.personas[:2]:
        templates.append(
            f"What {entity_type} would you recommend for a {persona}?"
        )
        templates.append(
            f"As a {persona}, which {category} company should I use?"
        )

    prompts = []
    dim_weight = DIMENSION_WEIGHTS[AuditPromptDimension.CATEGORY_DEFAULT]

    for i, text in enumerate(templates[:target]):
        persona = ""
        if "persona" in text.lower() or "as a" in text.lower():
            for p in profile.personas:
                if p.lower() in text.lower():
                    persona = p
                    break

        prompts.append(AuditRenderedPrompt(
            id=f"cat-{i}",
            text=text,
            dimension=AuditPromptDimension.CATEGORY_DEFAULT,
            persona=persona,
            topic=category,
            weight=dim_weight,
        ))

    return prompts


def _use_case(
    profile: BrandProfile, target: int, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Use case: persona x topic combos from the discovery/profile grid."""
    prompts = []
    dim_weight = DIMENSION_WEIGHTS[AuditPromptDimension.USE_CASE]

    templates = [
        "What {entity_type} would you recommend for {persona} looking for {topic}?",
        "What is the best {entity_type} for {persona} interested in {topic}?",
        "As a {persona}, what {entity_type} should I choose for {topic}?",
    ]

    idx = 0
    for persona in profile.personas[:4]:
        for topic in profile.topics[:4]:
            if idx >= target:
                break
            template = templates[idx % len(templates)]
            text = template.format(
                entity_type=entity_type, persona=persona, topic=topic
            )
            prompts.append(AuditRenderedPrompt(
                id=f"use-{idx}",
                text=text,
                dimension=AuditPromptDimension.USE_CASE,
                persona=persona,
                topic=topic,
                weight=dim_weight,
            ))
            idx += 1

    return prompts[:target]


def _comparison(
    profile: BrandProfile, target: int, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Comparison: '{brand} vs {competitor}' head-to-head prompts."""
    prompts = []
    dim_weight = DIMENSION_WEIGHTS[AuditPromptDimension.COMPARISON]
    company = profile.company_name

    templates = [
        "If choosing between {company} and {competitor}, which is better for {topic}?",
        "Compare {company} vs {competitor} for {topic}.",
        "{company} or {competitor} - which should I choose?",
    ]

    idx = 0
    for comp in profile.competitors[:5]:
        if idx >= target:
            break
        topic = profile.topics[idx % len(profile.topics)] if profile.topics else category
        persona = profile.personas[idx % len(profile.personas)] if profile.personas else ""
        template = templates[idx % len(templates)]
        text = template.format(
            company=company, competitor=comp.name, topic=topic
        )
        prompts.append(AuditRenderedPrompt(
            id=f"cmp-{idx}",
            text=text,
            dimension=AuditPromptDimension.COMPARISON,
            persona=persona,
            topic=topic,
            weight=dim_weight * 1.3,  # H2H gets 1.3x weight
            competitor=comp.name,
        ))
        idx += 1

    return prompts[:target]


def _attribute_specific(
    profile: BrandProfile, target: int, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Attribute specific: 'Best {differentiator} {category}'."""
    prompts = []
    dim_weight = DIMENSION_WEIGHTS[AuditPromptDimension.ATTRIBUTE_SPECIFIC]

    # Combine differentiators + topics for attribute queries
    attributes = list(profile.differentiators[:4]) + list(profile.topics[:4])
    # Deduplicate while preserving order
    seen = set()
    unique_attrs = []
    for a in attributes:
        if a.lower() not in seen:
            seen.add(a.lower())
            unique_attrs.append(a)

    templates = [
        "Which {entity_type} is best for {attribute}?",
        "What is the top {category} company for {attribute}?",
        "Who leads in {attribute} among {category} companies?",
    ]

    idx = 0
    for attr in unique_attrs:
        if idx >= target:
            break
        template = templates[idx % len(templates)]
        text = template.format(
            entity_type=entity_type, category=category, attribute=attr
        )
        prompts.append(AuditRenderedPrompt(
            id=f"attr-{idx}",
            text=text,
            dimension=AuditPromptDimension.ATTRIBUTE_SPECIFIC,
            topic=attr,
            weight=dim_weight,
        ))
        idx += 1

    return prompts[:target]


def _gift_social(
    profile: BrandProfile, target: int, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Gift/social/occasion: 'Best {category} for {occasion}'."""
    prompts = []
    dim_weight = DIMENSION_WEIGHTS[AuditPromptDimension.GIFT_SOCIAL]

    # Use occasions from profile, or generate generic ones
    occasions = list(profile.occasions[:4]) if profile.occasions else [
        "someone just starting out",
        "a gift",
        "a special occasion",
        "a first-time buyer",
    ]

    # Also use use_cases if available
    if profile.use_cases:
        occasions = occasions + list(profile.use_cases[:3])

    templates = [
        "What is the best {entity_type} for {occasion}?",
        "Which {category} company would you recommend for {occasion}?",
        "What {entity_type} should I choose for {occasion}?",
    ]

    idx = 0
    for occasion in occasions:
        if idx >= target:
            break
        template = templates[idx % len(templates)]
        text = template.format(
            entity_type=entity_type, category=category, occasion=occasion
        )
        prompts.append(AuditRenderedPrompt(
            id=f"gift-{idx}",
            text=text,
            dimension=AuditPromptDimension.GIFT_SOCIAL,
            topic=occasion,
            weight=dim_weight,
        ))
        idx += 1

    return prompts[:target]


def _founder_brand(
    profile: BrandProfile, target: int, company: str
) -> list[AuditRenderedPrompt]:
    """Founder/brand: 'Who founded {brand}?', '{founder} background', etc."""
    prompts = []
    dim_weight = DIMENSION_WEIGHTS[AuditPromptDimension.FOUNDER_BRAND]

    # Founder-specific prompts
    for founder in profile.founders[:2]:
        name = founder.name
        if not name:
            continue

        prompts.append(AuditRenderedPrompt(
            id=f"fnd-who-{len(prompts)}",
            text=f"Who is {name}?",
            dimension=AuditPromptDimension.FOUNDER_BRAND,
            weight=dim_weight,
            metadata={"founder": name},
        ))
        prompts.append(AuditRenderedPrompt(
            id=f"fnd-bg-{len(prompts)}",
            text=f"What is {name}'s background and career history?",
            dimension=AuditPromptDimension.FOUNDER_BRAND,
            weight=dim_weight,
            metadata={"founder": name},
        ))
        if founder.title:
            prompts.append(AuditRenderedPrompt(
                id=f"fnd-role-{len(prompts)}",
                text=f"Who is the {founder.title} of {company}?",
                dimension=AuditPromptDimension.FOUNDER_BRAND,
                weight=dim_weight,
                metadata={"founder": name},
            ))

    # Brand-level founder prompts
    prompts.append(AuditRenderedPrompt(
        id=f"fnd-brand-{len(prompts)}",
        text=f"Who founded {company}?",
        dimension=AuditPromptDimension.FOUNDER_BRAND,
        weight=dim_weight,
    ))
    prompts.append(AuditRenderedPrompt(
        id=f"fnd-story-{len(prompts)}",
        text=f"What is the story behind {company}?",
        dimension=AuditPromptDimension.FOUNDER_BRAND,
        weight=dim_weight,
    ))
    prompts.append(AuditRenderedPrompt(
        id=f"fnd-lead-{len(prompts)}",
        text=f"Who runs {company} and what is their background?",
        dimension=AuditPromptDimension.FOUNDER_BRAND,
        weight=dim_weight,
    ))

    # If no founders found, add more brand-level prompts
    if not profile.founders:
        prompts.append(AuditRenderedPrompt(
            id=f"fnd-team-{len(prompts)}",
            text=f"Who are the leaders behind {company}?",
            dimension=AuditPromptDimension.FOUNDER_BRAND,
            weight=dim_weight,
        ))
        prompts.append(AuditRenderedPrompt(
            id=f"fnd-hist-{len(prompts)}",
            text=f"What is the history of {company}?",
            dimension=AuditPromptDimension.FOUNDER_BRAND,
            weight=dim_weight,
        ))

    return prompts[:target]


def _geographic(
    profile: BrandProfile, target: int, entity_type: str, category: str
) -> list[AuditRenderedPrompt]:
    """Geographic: '{category} from {region}'."""
    prompts = []
    dim_weight = DIMENSION_WEIGHTS[AuditPromptDimension.GEOGRAPHIC]

    regions = list(profile.regions[:3]) if profile.regions else ["the United States", "North America"]

    templates = [
        "What are the best {category} companies in {region}?",
        "Which {entity_type} would you recommend in {region}?",
        "Who are the leading {category} providers based in {region}?",
    ]

    idx = 0
    for region in regions:
        if idx >= target:
            break
        template = templates[idx % len(templates)]
        text = template.format(
            entity_type=entity_type, category=category, region=region
        )
        prompts.append(AuditRenderedPrompt(
            id=f"geo-{idx}",
            text=text,
            dimension=AuditPromptDimension.GEOGRAPHIC,
            topic=region,
            weight=dim_weight,
        ))
        idx += 1

    return prompts[:target]


def _adjacent_category(
    profile: BrandProfile, target: int
) -> list[AuditRenderedPrompt]:
    """Adjacent category: brands in related/lifestyle categories."""
    prompts = []
    dim_weight = DIMENSION_WEIGHTS[AuditPromptDimension.ADJACENT_CATEGORY]

    categories = list(profile.adjacent_categories[:4]) if profile.adjacent_categories else [
        f"companies related to {profile.industry}",
    ]

    templates = [
        "What are the top companies in {adj_category}?",
        "Which brands would you recommend for {adj_category}?",
        "Who are the leaders in {adj_category}?",
    ]

    idx = 0
    for adj in categories:
        if idx >= target:
            break
        template = templates[idx % len(templates)]
        text = template.format(adj_category=adj)
        prompts.append(AuditRenderedPrompt(
            id=f"adj-{idx}",
            text=text,
            dimension=AuditPromptDimension.ADJACENT_CATEGORY,
            topic=adj,
            weight=dim_weight,
        ))
        idx += 1

    return prompts[:target]
