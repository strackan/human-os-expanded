"""Phase 4 — Article HTML Converter.

Converts hardened markdown articles into distribution-ready HTML with:
- Semantic HTML5 structure (<article>, <section aria-label>, <aside>, <nav>)
- JSON-LD structured data (Article + FAQPage + Organization)
- Open Graph and Twitter Card meta tags
- AI-friendly section summaries via LLM
- Scoring via the existing ArticleOptimizer._score() engine
"""

import json
import logging
import re
import time
from datetime import datetime

import markdown2
from bs4 import BeautifulSoup, Tag

from app.config import get_settings
from app.models.article_pipeline import ConverterInput, OptimizerOutput
from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.article_optimizer import ArticleOptimizer

logger = logging.getLogger(__name__)


SUMMARY_PROMPT = """Generate a concise 1-2 sentence summary for each section of this article.
Return ONLY valid JSON — a list of objects with "heading" and "summary" keys.

## Article Sections

{sections_text}

## Instructions

For each H2 section, write a summary that:
- Captures the key takeaway in 1-2 sentences
- Is self-contained (makes sense without the full article)
- Includes the most important data point or fact from that section

Return format:
[
  {{"heading": "Section Heading Text", "summary": "One or two sentence summary."}},
  ...
]

Return ONLY valid JSON, no markdown formatting or code blocks."""

FAQ_PROMPT = """Extract 4-6 FAQ question-answer pairs from this article.
Return ONLY valid JSON — a list of objects with "question" and "answer" keys.

## Article

{article_text}

## Instructions

- Questions should match how a real person would ask an AI assistant
- Answers should be concise (1-3 sentences) and sourced ONLY from the article
- Cover the most important topics: costs, process, requirements, recommendations
- Do NOT fabricate information — only use what's in the article

Return format:
[
  {{"question": "How much does X cost?", "answer": "According to the article, X typically costs..."}},
  ...
]

Return ONLY valid JSON, no markdown formatting or code blocks."""


class ArticleHtmlConverter:
    """Phase 4 — Converts markdown articles to distribution-ready HTML."""

    def __init__(self) -> None:
        settings = get_settings()
        self.llm_provider = None
        if settings.has_openai():
            self.llm_provider = OpenAIProvider(
                api_key=settings.openai_api_key,
                model=settings.parser_model,
            )
        self._optimizer = ArticleOptimizer()

    async def convert(self, input_data: ConverterInput) -> OptimizerOutput:
        """Convert a markdown article to distribution-ready HTML."""
        start_time = time.perf_counter()
        md_text = input_data.article_markdown

        # Score the markdown before conversion
        score_before_data = self._optimizer._score(self._optimizer._parse(md_text, "text"))
        score_before = score_before_data.total_score

        # Generate section summaries and FAQ via LLM
        section_summaries = await self._generate_section_summaries(md_text)
        faq_items = await self._generate_faq(md_text)

        # Convert markdown to HTML
        html_body = markdown2.markdown(
            md_text,
            extras=["fenced-code-blocks", "tables", "metadata", "header-ids"],
        )

        # Post-process with BeautifulSoup
        soup = BeautifulSoup(html_body, "html.parser")

        # Wrap in <article>
        article_tag = soup.new_tag("article")
        for child in list(soup.children):
            article_tag.append(child.extract())
        soup.append(article_tag)

        # Extract title from first H1, with markdown fallback
        title = ""
        h1_tag = article_tag.find("h1")
        if h1_tag:
            title = h1_tag.get_text(strip=True)
        if not title:
            # Fallback: extract from raw markdown source
            h1_match = re.search(r"^#\s+(.+)$", md_text, re.MULTILINE)
            if h1_match:
                title = h1_match.group(1).strip()

        # Wrap H2 sections in <section aria-label="...">
        self._wrap_sections(article_tag, soup, section_summaries)

        # Convert attributed quotes to <blockquote>
        self._convert_quotes(article_tag, soup, input_data.client_name)

        # Build table of contents
        toc_html = self._build_toc(article_tag)

        # Build JSON-LD schemas
        publish_date = input_data.publish_date or datetime.utcnow().strftime("%Y-%m-%d")
        article_schema = self._build_article_schema(
            title=title,
            description=self._extract_description(article_tag),
            author=input_data.author_name or input_data.client_name,
            domain=input_data.domain,
            publish_date=publish_date,
        )
        faq_schema = self._build_faq_schema(faq_items)
        org_schema = self._build_org_schema(input_data.client_name, input_data.domain)

        # Build meta tags
        description = self._extract_description(article_tag)
        meta_html = self._build_meta_tags(title, description, input_data.domain)

        # Build FAQ HTML section
        faq_html = self._build_faq_html(faq_items, soup)

        # Assemble full HTML document
        all_schemas = [article_schema]
        if faq_items:
            all_schemas.append(faq_schema)
        all_schemas.append(org_schema)

        full_html = self._assemble_document(
            meta_html=meta_html,
            toc_html=toc_html,
            article_html=str(article_tag),
            faq_html=faq_html,
            schemas=all_schemas,
            title=title,
        )

        # Score the final HTML
        score_after_data = self._optimizer._score(self._optimizer._parse(full_html, "html"))
        score_after = score_after_data.total_score

        latency_ms = int((time.perf_counter() - start_time) * 1000)

        # Build optimizer's log
        log_lines = [
            f"Conversion completed in {latency_ms}ms",
            f"Score: {score_before} → {score_after} (+{score_after - score_before:.1f})",
            f"Sections wrapped: {len(article_tag.find_all('section'))}",
            f"FAQ items: {len(faq_items)}",
            f"JSON-LD schemas: {len(all_schemas)}",
            f"Section summaries: {len(section_summaries)}",
        ]

        return OptimizerOutput(
            article_html=full_html,
            structured_data_json={"schemas": all_schemas, "faq": faq_items},
            optimizers_log="\n".join(log_lines),
            score_before=score_before,
            score_after=score_after,
            latency_ms=latency_ms,
        )

    async def _generate_section_summaries(self, md_text: str) -> dict[str, str]:
        """Generate AI summaries for each H2 section."""
        if not self.llm_provider:
            return {}

        # Extract sections
        sections: list[str] = []
        current_section = ""
        for line in md_text.split("\n"):
            if line.startswith("## "):
                if current_section:
                    sections.append(current_section)
                current_section = line + "\n"
            elif current_section:
                current_section += line + "\n"
        if current_section:
            sections.append(current_section)

        if not sections:
            return {}

        sections_text = "\n---\n".join(s[:500] for s in sections)
        prompt = SUMMARY_PROMPT.format(sections_text=sections_text)

        response = await self.llm_provider.query(prompt, max_completion_tokens=2048)
        if not response.success:
            return {}

        try:
            data = self._extract_json_list(response.text)
            return {item["heading"]: item["summary"] for item in data if "heading" in item and "summary" in item}
        except (json.JSONDecodeError, KeyError, ValueError):
            return {}

    async def _generate_faq(self, md_text: str) -> list[dict[str, str]]:
        """Generate FAQ items from the article."""
        if not self.llm_provider:
            return []

        prompt = FAQ_PROMPT.format(article_text=md_text[:6000])
        response = await self.llm_provider.query(prompt, max_completion_tokens=2048)
        if not response.success:
            return []

        try:
            data = self._extract_json_list(response.text)
            return [
                {"question": item["question"], "answer": item["answer"]}
                for item in data
                if "question" in item and "answer" in item
            ]
        except (json.JSONDecodeError, KeyError, ValueError):
            return []

    def _wrap_sections(self, article_tag: Tag, soup: BeautifulSoup, summaries: dict[str, str]) -> None:
        """Wrap content between H2 tags in <section aria-label="..."> with optional <aside> summaries."""
        h2_tags = article_tag.find_all("h2")
        for h2 in h2_tags:
            heading_text = h2.get_text(strip=True)
            section = soup.new_tag("section")
            section["aria-label"] = heading_text

            # Collect all siblings until next H2 or H1
            siblings_to_move = []
            sibling = h2.next_sibling
            while sibling:
                if isinstance(sibling, Tag) and sibling.name in ("h1", "h2"):
                    break
                next_sib = sibling.next_sibling
                siblings_to_move.append(sibling)
                sibling = next_sib

            # Insert section before the H2
            h2.insert_before(section)

            # Move H2 and its siblings into section
            section.append(h2.extract())

            # Add section summary aside if available
            if heading_text in summaries:
                aside = soup.new_tag("aside")
                aside["class"] = "section-summary"
                aside.string = summaries[heading_text]
                section.append(aside)

            for sib in siblings_to_move:
                section.append(sib.extract())

    def _convert_quotes(self, article_tag: Tag, soup: BeautifulSoup, client_name: str) -> None:
        """Convert paragraphs containing quoted speech to <blockquote> elements."""
        for p in article_tag.find_all("p"):
            text = p.get_text()
            # Match patterns like: "quote text," says Name or "quote text," explains Name
            quote_match = re.search(
                r'"([^"]{20,})"[,.]?\s*(?:says|explains|notes|observes|advises|adds)\s+(.+?)(?:\.|,|$)',
                text,
            )
            if quote_match:
                quote_text = quote_match.group(1)
                attribution = quote_match.group(2).strip().rstrip(".")
                blockquote = soup.new_tag("blockquote")
                blockquote["cite"] = attribution
                q_p = soup.new_tag("p")
                q_p.string = quote_text
                blockquote.append(q_p)
                cite = soup.new_tag("cite")
                cite.string = f"— {attribution}"
                blockquote.append(cite)
                p.replace_with(blockquote)

    def _build_toc(self, article_tag: Tag) -> str:
        """Build a <nav> table of contents from H2 headings."""
        h2_tags = article_tag.find_all("h2")
        if not h2_tags:
            return ""

        items = []
        for h2 in h2_tags:
            text = h2.get_text(strip=True)
            heading_id = h2.get("id", "")
            if not heading_id:
                heading_id = re.sub(r"[^\w\s-]", "", text.lower()).strip().replace(" ", "-")
                h2["id"] = heading_id
            items.append(f'  <li><a href="#{heading_id}">{text}</a></li>')

        return '<nav aria-label="Table of Contents">\n<ol>\n' + "\n".join(items) + "\n</ol>\n</nav>"

    def _extract_description(self, article_tag: Tag) -> str:
        """Extract first meaningful paragraph as meta description."""
        for p in article_tag.find_all("p"):
            text = p.get_text(strip=True)
            if len(text) > 50:
                return text[:155] + "..." if len(text) > 155 else text
        return ""

    def _build_meta_tags(self, title: str, description: str, domain: str) -> str:
        """Build Open Graph and Twitter Card meta tags."""
        canonical = f"https://{domain}" if domain else ""
        return f"""<meta property="og:title" content="{self._escape_attr(title)}">
<meta property="og:description" content="{self._escape_attr(description)}">
<meta property="og:type" content="article">
{f'<meta property="og:url" content="{canonical}">' if canonical else ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{self._escape_attr(title)}">
<meta name="twitter:description" content="{self._escape_attr(description)}">
{f'<link rel="canonical" href="{canonical}">' if canonical else ''}
<meta name="robots" content="index, follow">
<meta name="description" content="{self._escape_attr(description)}">"""

    def _build_article_schema(
        self, title: str, description: str, author: str, domain: str, publish_date: str
    ) -> dict:
        """Build Article JSON-LD schema."""
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "author": {"@type": "Organization", "name": author},
            "datePublished": publish_date,
            "publisher": {
                "@type": "Organization",
                "name": author,
                "url": f"https://{domain}" if domain else "",
            },
        }

    def _build_faq_schema(self, faq_items: list[dict[str, str]]) -> dict:
        """Build FAQPage JSON-LD schema."""
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": item["question"],
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": item["answer"],
                    },
                }
                for item in faq_items
            ],
        }

    def _build_org_schema(self, name: str, domain: str) -> dict:
        """Build Organization JSON-LD schema."""
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": name,
            "url": f"https://{domain}" if domain else "",
        }

    def _build_faq_html(self, faq_items: list[dict[str, str]], soup: BeautifulSoup) -> str:
        """Build an HTML FAQ section."""
        if not faq_items:
            return ""

        lines = ['<section aria-label="Frequently Asked Questions">', "<h2>Frequently Asked Questions</h2>", "<dl>"]
        for item in faq_items:
            q = self._escape_html(item["question"])
            a = self._escape_html(item["answer"])
            lines.append(f"  <dt>{q}</dt>")
            lines.append(f"  <dd>{a}</dd>")
        lines.append("</dl>")
        lines.append("</section>")
        return "\n".join(lines)

    def _assemble_document(
        self,
        meta_html: str,
        toc_html: str,
        article_html: str,
        faq_html: str,
        schemas: list[dict],
        title: str,
    ) -> str:
        """Assemble the complete HTML document."""
        schema_tags = "\n".join(
            f'<script type="application/ld+json">\n{json.dumps(schema, indent=2)}\n</script>'
            for schema in schemas
        )

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{self._escape_html(title)}</title>
{meta_html}
{schema_tags}
</head>
<body>
{toc_html}
{article_html}
{faq_html}
</body>
</html>"""

    def _extract_json_list(self, text: str) -> list[dict]:
        """Extract a JSON list from text that may have markdown formatting."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())

    @staticmethod
    def _escape_attr(text: str) -> str:
        """Escape text for use in HTML attributes."""
        return text.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

    @staticmethod
    def _escape_html(text: str) -> str:
        """Escape text for use in HTML content."""
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
