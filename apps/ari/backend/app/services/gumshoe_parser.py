"""Gumshoe CSV parser — converts exported Gumshoe data into structured payloads.

Reads questions_export.csv and mentions-*.csv from a customer directory,
filters by persona/brand, and produces a GumshoePayload with competitive
landscape data and a pre-formatted markdown payload for the Editor's Pass 5.
"""

import csv
import logging
from collections import Counter, defaultdict
from pathlib import Path

from app.models.article_pipeline import (
    CompetitorMention,
    GumshoePayload,
    GumshoeQuery,
)

logger = logging.getLogger(__name__)

# Base directory for customer data (ari/customers/ — one level above backend/)
CUSTOMERS_DIR = Path(__file__).parent.parent.parent.parent / "customers"


def parse_gumshoe(
    customer_slug: str,
    brand_domain: str,
    persona_filter: str = "",
) -> GumshoePayload:
    """Parse Gumshoe CSVs for a customer and return a structured payload.

    Args:
        customer_slug: Directory name under customers/ (e.g. "usmoneyreserve")
        brand_domain: Brand domain to track (e.g. "usmoneyreserve.com")
        persona_filter: If set, only include queries for this persona

    Returns:
        GumshoePayload with queries, competitor landscape, and markdown payload
    """
    customer_dir = CUSTOMERS_DIR / customer_slug
    if not customer_dir.is_dir():
        raise FileNotFoundError(f"Customer directory not found: {customer_dir}")

    # Find CSV files
    questions_file = customer_dir / "questions_export.csv"
    if not questions_file.exists():
        raise FileNotFoundError(f"questions_export.csv not found in {customer_dir}")

    mentions_files = sorted(customer_dir.glob("mentions-*.csv"))
    if not mentions_files:
        raise FileNotFoundError(f"No mentions-*.csv files found in {customer_dir}")

    source_files = [questions_file.name] + [f.name for f in mentions_files]

    # Parse questions
    queries = _parse_questions(questions_file, brand_domain, persona_filter)

    # Parse mentions
    all_mentions: list[CompetitorMention] = []
    for mf in mentions_files:
        all_mentions.extend(_parse_mentions(mf, persona_filter))

    # Build competitive landscape: domain → total mention count
    landscape: Counter[str] = Counter()
    for m in all_mentions:
        landscape[m.brand_domain] += 1

    # Filter to competitor mentions only (exclude the client brand)
    brand_domain_clean = brand_domain.lower().strip()
    competitor_mentions = [m for m in all_mentions if m.brand_domain.lower() != brand_domain_clean]

    # Build binding checklist: topics where brand is NOT mentioned at all
    query_ids_with_brand = set()
    for m in all_mentions:
        if m.brand_domain.lower() == brand_domain_clean:
            query_ids_with_brand.add(m.prompt_id)

    binding_checklist: list[str] = []
    for q in queries:
        if q.id not in query_ids_with_brand and q.topics:
            for topic in q.topics:
                if topic not in binding_checklist:
                    binding_checklist.append(topic)

    # Build markdown payload for Editor Pass 5
    payload_md = _build_payload_markdown(
        queries=queries,
        competitor_mentions=competitor_mentions,
        landscape=landscape,
        binding_checklist=binding_checklist,
        brand_domain=brand_domain,
        persona_filter=persona_filter,
    )

    return GumshoePayload(
        customer_slug=customer_slug,
        brand_domain=brand_domain,
        persona_filter=persona_filter,
        queries=queries,
        competitor_mentions=competitor_mentions,
        competitive_landscape=dict(landscape.most_common()),
        binding_checklist=binding_checklist,
        payload_markdown=payload_md,
        source_files=source_files,
    )


def _parse_questions(
    filepath: Path,
    brand_domain: str,
    persona_filter: str,
) -> list[GumshoeQuery]:
    """Parse questions_export.csv into GumshoeQuery objects."""
    queries: list[GumshoeQuery] = []
    brand_domain_clean = brand_domain.lower().strip()

    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            persona = row.get("persona", "").strip()
            if persona_filter and persona.lower() != persona_filter.lower():
                continue

            query_id = int(row.get("id", 0))
            query_text = row.get("query", "").strip()

            # Extract topic columns (t-*)
            topics = [
                col[2:]  # strip "t-" prefix
                for col in row
                if col.startswith("t-") and row[col].strip().upper() == "X"
            ]

            # Extract model mention ranks (m-*)
            model_mentions: dict[str, int | None] = {}
            for col in row:
                if col.startswith("m-"):
                    val = row[col].strip()
                    model_name = col[2:]  # strip "m-" prefix
                    if val and val.isdigit():
                        model_mentions[model_name] = int(val)
                    elif val:
                        model_mentions[model_name] = None  # mentioned but no rank

            queries.append(
                GumshoeQuery(
                    id=query_id,
                    persona=persona,
                    query=query_text,
                    topics=topics,
                    model_mentions=model_mentions,
                )
            )

    return queries


def _parse_mentions(filepath: Path, persona_filter: str) -> list[CompetitorMention]:
    """Parse a mentions-*.csv file into CompetitorMention objects."""
    mentions: list[CompetitorMention] = []

    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            persona = row.get("Persona", "").strip()
            if persona_filter and persona.lower() != persona_filter.lower():
                continue

            rank_str = row.get("Recommended Rank", "").strip()
            rank = int(rank_str) if rank_str and rank_str.isdigit() else None

            mentions.append(
                CompetitorMention(
                    brand_name=row.get("Brand Name", "").strip(),
                    brand_domain=row.get("Brand Domain", "").strip(),
                    model=row.get("Model", "").strip(),
                    rank=rank,
                    snippet=row.get("Answer", "").strip()[:500],
                    prompt_id=int(row.get("Prompt ID", 0) or 0),
                )
            )

    return mentions


def _build_payload_markdown(
    queries: list[GumshoeQuery],
    competitor_mentions: list[CompetitorMention],
    landscape: Counter,
    binding_checklist: list[str],
    brand_domain: str,
    persona_filter: str,
) -> str:
    """Build the pre-formatted markdown payload for Editor Pass 5 injection."""
    lines: list[str] = []

    lines.append("# Gumshoe AI Visibility Analysis")
    lines.append("")
    lines.append(f"**Brand:** {brand_domain}")
    if persona_filter:
        lines.append(f"**Persona:** {persona_filter}")
    lines.append(f"**Total Queries Analyzed:** {len(queries)}")
    lines.append("")

    # Competitive Landscape
    lines.append("## Competitive Landscape")
    lines.append("")
    lines.append("| Competitor | Total Mentions |")
    lines.append("|-----------|---------------|")
    for domain, count in landscape.most_common(15):
        marker = " **(CLIENT)**" if domain.lower() == brand_domain.lower() else ""
        lines.append(f"| {domain}{marker} | {count} |")
    lines.append("")

    # Queries where brand IS mentioned (with rank)
    brand_queries = [q for q in queries if any(v is not None for v in q.model_mentions.values())]
    if brand_queries:
        lines.append("## Queries Where Brand Appears")
        lines.append("")
        for q in brand_queries[:10]:
            ranks = [f"{m}: #{r}" for m, r in q.model_mentions.items() if r is not None]
            lines.append(f"- **Q{q.id}:** {q.query}")
            if ranks:
                lines.append(f"  - Ranks: {', '.join(ranks)}")
        lines.append("")

    # Binding Checklist — topics with ZERO visibility
    if binding_checklist:
        lines.append("## Binding Checklist — Zero Visibility Topics")
        lines.append("")
        lines.append("The brand has **no AI mentions** for these topics. The article MUST address them:")
        lines.append("")
        for topic in binding_checklist:
            lines.append(f"- [ ] {topic}")
        lines.append("")

    # Top competitor snippets (sample for context)
    top_competitors = landscape.most_common(5)
    competitor_domains = [d for d, _ in top_competitors if d.lower() != brand_domain.lower()]
    if competitor_domains:
        lines.append("## Competitor Snippet Samples")
        lines.append("")
        # Group by competitor
        by_competitor: dict[str, list[CompetitorMention]] = defaultdict(list)
        for m in competitor_mentions:
            if m.brand_domain.lower() in [d.lower() for d in competitor_domains[:3]]:
                by_competitor[m.brand_domain].append(m)

        for comp_domain, mentions in list(by_competitor.items())[:3]:
            lines.append(f"### {comp_domain}")
            for m in mentions[:2]:
                snippet = m.snippet[:300] + "..." if len(m.snippet) > 300 else m.snippet
                lines.append(f"- [{m.model}, Rank {m.rank}]: {snippet}")
            lines.append("")

    return "\n".join(lines)
