"""Article optimizer service: parse, score, and optimize articles for AI readability."""

import json
import re
from functools import lru_cache
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.config import get_settings
from app.models.article import (
    BeforeAfterMetrics,
    EnhancementPack,
    EnhanceResponse,
    FAQItem,
    LLMResults,
    OptimizedContent,
    OptimizeResponse,
    OriginalAnalysis,
    ScoreBreakdown,
    ScoreData,
    ScrapedData,
)
from app.services.ai_providers.openai_provider import OpenAIProvider


ANALYSIS_PROMPT = """Analyze this article and return structured JSON.

## Article Text (truncated)
{body_text}

## Instructions
Analyze the article and return ONLY valid JSON in this exact format:
{{
  "weaknesses": ["list of structural/content weaknesses for AI discoverability"],
  "entities": ["list of key entities (people, companies, products) mentioned"],
  "themes": ["list of 3-5 core themes"],
  "tone_analysis": "brief tone description (e.g. 'professional and informative')",
  "target_audience": "who this article is written for",
  "summary": "2-3 sentence summary of the article",
  "faq": [
    {{"question": "suggested FAQ question based on content", "answer": "concise answer from the article"}}
  ],
  "schema_suggestion": "what JSON-LD schema type fits best (e.g. Article, NewsArticle, FAQPage)"
}}

Generate 3-5 FAQ items that an AI would find useful for answering user questions.
Return ONLY valid JSON, no markdown formatting or code blocks."""


OPTIMIZATION_PROMPT = """Rewrite this article to be maximally useful for AI systems answering questions.

## Original Article
{body_text}

## Analysis Results
- Weaknesses: {weaknesses}
- Key Entities: {entities}
- Themes: {themes}
- Target Audience: {target_audience}

## Instructions
Create an optimized version that:
1. Uses clear markdown headings (H1, H2, H3)
2. Includes bullet points and data blocks
3. Names entities explicitly and repeatedly
4. Has a clear FAQ section with 4-6 Q&A pairs
5. Is structured for easy extraction by AI models

Return ONLY valid JSON in this exact format:
{{
  "ai_summary": "2-3 sentence AI-friendly summary",
  "key_facts": ["list of 5-8 key extractable facts"],
  "rewritten_markdown": "full rewritten article in markdown format with headings, bullets, and clear structure",
  "faq": [
    {{"question": "question text", "answer": "answer text"}}
  ],
  "schema_json": {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "...",
    "description": "...",
    "author": {{"@type": "Person or Organization", "name": "..."}},
    "mainEntity": {{
      "@type": "FAQPage",
      "mainEntity": [
        {{
          "@type": "Question",
          "name": "question",
          "acceptedAnswer": {{"@type": "Answer", "text": "answer"}}
        }}
      ]
    }}
  }},
  "meta_description": "SEO meta description under 160 chars"
}}

Return ONLY valid JSON, no markdown formatting or code blocks."""


ENHANCEMENT_PROMPT = """Generate AI-discoverability enhancement blocks for this article.
Do NOT rewrite or alter the original article. Generate ONLY additive content blocks.

## Original Article
{body_text}

## Analysis Context
- Key Entities: {entities}
- Themes: {themes}
- Target Audience: {target_audience}

## Instructions
Generate enhancement blocks that will be placed alongside (not replacing) the original article
to make it more discoverable by AI answer engines (ChatGPT, Perplexity, Gemini, Google AI Overviews).

Return ONLY valid JSON in this exact format:
{{
  "ai_summary_html": "<ul><li>Takeaway 1</li><li>Takeaway 2</li><li>Takeaway 3</li><li>Takeaway 4</li><li>Takeaway 5</li></ul>",
  "key_findings_html": "<div class='key-findings'><h3>Key Findings</h3><ul><li><strong>Finding label:</strong> Detail</li></ul></div>",
  "faq": [
    {{"question": "Natural question an AI user would ask", "answer": "Concise answer sourced from the article"}}
  ],
  "schema_json": {{
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "...",
    "description": "...",
    "author": {{"@type": "Organization", "name": "..."}},
    "mainEntity": {{
      "@type": "FAQPage",
      "mainEntity": [
        {{
          "@type": "Question",
          "name": "question",
          "acceptedAnswer": {{"@type": "Answer", "text": "answer"}}
        }}
      ]
    }}
  }},
  "meta_description": "SEO meta description under 160 chars"
}}

Rules:
- ai_summary_html: Exactly 3-5 bullet points as an HTML <ul>. Each bullet is a self-contained, citable takeaway.
- key_findings_html: Structured HTML div with factual highlights. Use <strong> for labels. Include data points, names, numbers.
- faq: 4-6 Q&A pairs. Questions should match how a real person would ask an AI assistant. Answers sourced ONLY from the article — no fabrication.
- schema_json: Valid JSON-LD. Use NewsArticle + embedded FAQPage. Include all FAQ items.
- meta_description: Under 160 characters. Summarize the article's value proposition.
- All HTML must be valid, self-contained, and safe to paste into a CMS rich text field.

Return ONLY valid JSON, no markdown formatting or code blocks."""


class ArticleOptimizer:
    """Parses, scores, and optimizes articles for AI readability."""

    def __init__(self) -> None:
        settings = get_settings()
        self.settings = settings

        # Reuse OpenAI provider pattern from ResponseParser
        if settings.has_openai():
            self.analysis_provider = OpenAIProvider(
                api_key=settings.openai_api_key,
                model=settings.parser_model,
            )
            self.optimization_provider = OpenAIProvider(
                api_key=settings.openai_api_key,
                model=settings.parser_model,
            )
        else:
            self.analysis_provider = None
            self.optimization_provider = None

    async def optimize(
        self, content: str | None, format: str = "auto", url: str | None = None
    ) -> OptimizeResponse:
        """Run the full optimization pipeline."""
        # Step 0: Fetch URL if needed
        if not content and url:
            content = await self._fetch_url(url)

        if not content:
            raise ValueError("No content to optimize.")

        # Step 1: Detect format
        if format == "auto":
            format = self._detect_format(content)

        # Step 2: Parse
        scraped = self._parse(content, format)

        # Step 3: Score original
        original_score = self._score(scraped)

        # Step 4 & 5: LLM analysis + optimization
        llm_results = LLMResults()
        optimized = OptimizedContent()

        if self.analysis_provider:
            llm_results = await self._llm_analyze(scraped)
            optimized = await self._llm_optimize(scraped, llm_results)

        # Step 6: Score optimized content
        if optimized.rewritten_markdown:
            optimized_scraped = self._parse(optimized.rewritten_markdown, "text")
            # Credit generated schema and FAQ
            if optimized.schema_jsonld:
                optimized_scraped.has_json_ld = True
            if optimized.faq:
                optimized_scraped.has_faq_schema = True
            optimized_score = self._score(optimized_scraped)
        else:
            optimized_score = original_score

        return OptimizeResponse(
            original_analysis=OriginalAnalysis(
                scraped=scraped,
                score=original_score,
                llm=llm_results,
            ),
            optimized_content=optimized,
            metrics=BeforeAfterMetrics(
                original_score=original_score.total_score,
                optimized_score=optimized_score.total_score,
                improvement=round(optimized_score.total_score - original_score.total_score, 1),
                original_word_count=scraped.word_count,
                optimized_word_count=len(optimized.rewritten_markdown.split()) if optimized.rewritten_markdown else 0,
            ),
        )

    async def enhance(
        self, content: str | None, format: str = "auto", url: str | None = None
    ) -> EnhanceResponse:
        """Generate non-destructive enhancement blocks for an article.

        This is the v2 pipeline: parse → score → analyze → generate enhancement blocks.
        The original article is never rewritten — only additive blocks are produced.
        """
        if not content and url:
            content = await self._fetch_url(url)
        if not content:
            raise ValueError("No content to enhance.")

        if format == "auto":
            format = self._detect_format(content)

        scraped = self._parse(content, format)
        score = self._score(scraped)

        llm_results = LLMResults()
        enhancements = EnhancementPack()

        if self.analysis_provider:
            llm_results = await self._llm_analyze(scraped)
            enhancements = await self._llm_enhance(scraped, llm_results)

        return EnhanceResponse(
            analysis=OriginalAnalysis(scraped=scraped, score=score, llm=llm_results),
            enhancements=enhancements,
        )

    async def score_only(
        self, content: str | None, format: str = "auto", url: str | None = None
    ) -> dict[str, Any]:
        """Parse and score without LLM calls."""
        if not content and url:
            content = await self._fetch_url(url)

        if not content:
            raise ValueError("No content to score.")

        if format == "auto":
            format = self._detect_format(content)

        scraped = self._parse(content, format)
        score = self._score(scraped)

        return {
            "scraped": scraped.model_dump(),
            "score": score.model_dump(),
        }

    async def _fetch_url(self, url: str) -> str:
        """Fetch HTML content from a URL."""
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; ARI-Optimizer/1.0; +https://ari.ai)",
            },
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text

    def _detect_format(self, content: str) -> str:
        """Detect whether content is HTML or plain text."""
        html_patterns = re.compile(r"<(p|div|h[1-6]|article|section|span|ul|ol|li|a|img)\b", re.I)
        if html_patterns.search(content):
            return "html"
        return "text"

    def _parse(self, content: str, format: str) -> ScrapedData:
        """Parse content into structured data."""
        if format == "html":
            return self._parse_html(content)
        return self._parse_text(content)

    def _parse_html(self, html: str) -> ScrapedData:
        """Parse HTML content with BeautifulSoup."""
        soup = BeautifulSoup(html, "html.parser")

        # Extract title
        title = ""
        title_tag = soup.find("title")
        if title_tag:
            title = title_tag.get_text(strip=True)

        # Extract meta description
        meta_desc = ""
        meta_tag = soup.find("meta", attrs={"name": "description"})
        if meta_tag:
            meta_desc = meta_tag.get("content", "")

        # Extract headings
        h1 = [tag.get_text(strip=True) for tag in soup.find_all("h1")]
        h2 = [tag.get_text(strip=True) for tag in soup.find_all("h2")]
        h3 = [tag.get_text(strip=True) for tag in soup.find_all("h3")]

        # Check for JSON-LD and FAQ schema BEFORE removing script tags
        has_json_ld = bool(soup.find("script", attrs={"type": "application/ld+json"}))
        has_faq_schema = False
        for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
            try:
                ld = json.loads(script.string or "")
                if isinstance(ld, dict) and ld.get("@type") == "FAQPage":
                    has_faq_schema = True
                elif isinstance(ld, list):
                    for item in ld:
                        if isinstance(item, dict) and item.get("@type") == "FAQPage":
                            has_faq_schema = True
            except (json.JSONDecodeError, TypeError):
                pass

        # Count bullets before removing tags
        bullets_count = len(soup.find_all("li"))

        # Extract body text — remove non-content tags
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        body_text = soup.get_text(separator="\n", strip=True)

        word_count = len(body_text.split())

        return ScrapedData(
            title=title,
            meta_description=meta_desc,
            h1=h1,
            h2=h2,
            h3=h3,
            body_text=body_text,
            word_count=word_count,
            has_json_ld=has_json_ld,
            has_faq_schema=has_faq_schema,
            bullets_count=bullets_count,
        )

    def _parse_text(self, text: str) -> ScrapedData:
        """Parse plain text / markdown content."""
        h1 = re.findall(r"^# (.+)$", text, re.MULTILINE)
        h2 = re.findall(r"^## (.+)$", text, re.MULTILINE)
        h3 = re.findall(r"^### (.+)$", text, re.MULTILINE)

        # Count bullet patterns (-, *, numbered lists)
        bullets = re.findall(r"^\s*[-*]\s+.+$", text, re.MULTILINE)
        numbered = re.findall(r"^\s*\d+[.)]\s+.+$", text, re.MULTILINE)
        bullets_count = len(bullets) + len(numbered)

        word_count = len(text.split())

        # Use first H1 as title, or first line
        title = h1[0] if h1 else text.split("\n")[0][:100]

        return ScrapedData(
            title=title,
            h1=h1,
            h2=h2,
            h3=h3,
            body_text=text,
            word_count=word_count,
            bullets_count=bullets_count,
        )

    def _score(self, scraped: ScrapedData) -> ScoreData:
        """Calculate deterministic AI-readiness score. No LLM needed."""
        breakdown = ScoreBreakdown()

        # 1. Structured Headings (0-20)
        heading_score = 0.0
        if scraped.h1:
            heading_score += 8
        heading_score += min(8, len(scraped.h2) * 2)
        heading_score += min(4, len(scraped.h3) * 1)
        breakdown.structured_headings = min(20, heading_score)

        # 2. FAQ Presence (0-20)
        faq_score = 0.0
        if scraped.has_faq_schema:
            faq_score = 20
        else:
            # Check for FAQ-like patterns in body text
            faq_patterns = re.findall(
                r"(?:^|\n)\s*(?:Q:|FAQ|question|what is|how do|why do|can I|should I)",
                scraped.body_text,
                re.IGNORECASE,
            )
            faq_score = min(12, len(faq_patterns) * 3)
        breakdown.faq_presence = min(20, faq_score)

        # 3. Clear Entity Mentions (0-20)
        # Find repeated proper nouns: multi-word capitalized names (per line to avoid cross-line matches)
        # Also catch single-word brand names (all-caps 3+ chars like "NASA", "NewsUSA")
        from collections import Counter
        proper_nouns: list[str] = []
        for line in scraped.body_text.split("\n"):
            proper_nouns.extend(re.findall(r"\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b", line))
            proper_nouns.extend(re.findall(r"\b[A-Z][A-Za-z]{2,}\b", line))
        entity_counts = Counter(proper_nouns)
        repeated_entities = sum(1 for count in entity_counts.values() if count >= 2)
        entity_score = min(20, repeated_entities * 4)
        breakdown.clear_entity_mentions = float(entity_score)

        # 4. Bullet/Data Blocks (0-20)
        bullet_score = min(10, scraped.bullets_count * 1.5)
        # Data patterns: percentages, dollar amounts, years
        data_patterns = re.findall(
            r"\b\d+(?:\.\d+)?%|\$\d+|\b(?:19|20)\d{2}\b",
            scraped.body_text,
        )
        data_score = min(10, len(data_patterns) * 2)
        breakdown.bullet_data_blocks = min(20, bullet_score + data_score)

        # 5. Extractability Clarity (0-10)
        sentences = re.split(r"[.!?]+", scraped.body_text)
        sentences = [s.strip() for s in sentences if s.strip()]
        if sentences:
            avg_sentence_len = sum(len(s.split()) for s in sentences) / len(sentences)
            # Optimal: 15-25 words per sentence
            if 10 <= avg_sentence_len <= 25:
                clarity_score = 5.0
            elif avg_sentence_len < 10:
                clarity_score = 3.0
            else:
                clarity_score = max(1.0, 5.0 - (avg_sentence_len - 25) * 0.2)
        else:
            clarity_score = 0.0

        # Heading density bonus
        total_headings = len(scraped.h1) + len(scraped.h2) + len(scraped.h3)
        if scraped.word_count > 0:
            heading_density = total_headings / (scraped.word_count / 100)
            clarity_score += min(5.0, heading_density * 2)
        breakdown.extractability_clarity = min(10, round(clarity_score, 1))

        # 6. Structured Metadata (0-10)
        meta_score = 0.0
        if scraped.has_json_ld:
            meta_score += 5
        if scraped.meta_description:
            meta_score += 3
        if scraped.title:
            meta_score += 2
        breakdown.structured_metadata = min(10, meta_score)

        total = (
            breakdown.structured_headings
            + breakdown.faq_presence
            + breakdown.bullet_data_blocks
            + breakdown.clear_entity_mentions
            + breakdown.extractability_clarity
            + breakdown.structured_metadata
        )

        return ScoreData(
            total_score=round(min(100, total), 1),
            breakdown=breakdown,
        )

    async def _llm_analyze(self, scraped: ScrapedData) -> LLMResults:
        """Run LLM analysis on the article."""
        if not self.analysis_provider:
            return LLMResults()

        body_truncated = scraped.body_text[:8000]
        prompt = ANALYSIS_PROMPT.format(body_text=body_truncated)

        response = await self.analysis_provider.query(prompt)
        if not response.success:
            return LLMResults()

        try:
            data = self._extract_json(response.text)
            faq_items = [
                FAQItem(question=f["question"], answer=f["answer"])
                for f in data.get("faq", [])
                if "question" in f and "answer" in f
            ]
            return LLMResults(
                weaknesses=data.get("weaknesses", []),
                entities=data.get("entities", []),
                themes=data.get("themes", []),
                tone_analysis=data.get("tone_analysis", ""),
                target_audience=data.get("target_audience", ""),
                summary=data.get("summary", ""),
                faq=faq_items,
                schema_suggestion=data.get("schema_suggestion", ""),
            )
        except (json.JSONDecodeError, KeyError, ValueError):
            return LLMResults()

    async def _llm_optimize(self, scraped: ScrapedData, analysis: LLMResults) -> OptimizedContent:
        """Run LLM optimization to generate improved content."""
        if not self.optimization_provider:
            return OptimizedContent()

        body_truncated = scraped.body_text[:8000]
        prompt = OPTIMIZATION_PROMPT.format(
            body_text=body_truncated,
            weaknesses=", ".join(analysis.weaknesses) or "none identified",
            entities=", ".join(analysis.entities) or "none identified",
            themes=", ".join(analysis.themes) or "none identified",
            target_audience=analysis.target_audience or "general",
        )

        response = await self.optimization_provider.query(prompt, max_completion_tokens=4096)
        if not response.success:
            return OptimizedContent()

        try:
            data = self._extract_json(response.text)
            faq_items = [
                FAQItem(question=f["question"], answer=f["answer"])
                for f in data.get("faq", [])
                if "question" in f and "answer" in f
            ]
            return OptimizedContent(
                ai_summary=data.get("ai_summary", ""),
                key_facts=data.get("key_facts", []),
                rewritten_markdown=data.get("rewritten_markdown", ""),
                faq=faq_items,
                schema_jsonld=data.get("schema_json"),
                meta_description=data.get("meta_description", ""),
            )
        except (json.JSONDecodeError, KeyError, ValueError):
            return OptimizedContent()

    async def _llm_enhance(self, scraped: ScrapedData, analysis: LLMResults) -> EnhancementPack:
        """Generate non-destructive enhancement blocks via LLM."""
        if not self.optimization_provider:
            return EnhancementPack()

        body_truncated = scraped.body_text[:8000]
        prompt = ENHANCEMENT_PROMPT.format(
            body_text=body_truncated,
            entities=", ".join(analysis.entities) or "none identified",
            themes=", ".join(analysis.themes) or "none identified",
            target_audience=analysis.target_audience or "general",
        )

        response = await self.optimization_provider.query(prompt, max_completion_tokens=4096)
        if not response.success:
            return EnhancementPack()

        try:
            data = self._extract_json(response.text)

            # Build structured FAQ list
            faq_items = [
                FAQItem(question=f["question"], answer=f["answer"])
                for f in data.get("faq", [])
                if "question" in f and "answer" in f
            ]

            # Build FAQ HTML from structured data
            faq_html = data.get("faq_html", "")
            if not faq_html and faq_items:
                faq_html = "<dl>\n"
                for item in faq_items:
                    faq_html += f"  <dt>{item.question}</dt>\n"
                    faq_html += f"  <dd>{item.answer}</dd>\n"
                faq_html += "</dl>"

            # Build complete <script> tag from schema JSON
            schema_jsonld = ""
            schema_json = data.get("schema_json")
            if schema_json:
                schema_str = json.dumps(schema_json, indent=2)
                schema_jsonld = f'<script type="application/ld+json">\n{schema_str}\n</script>'

            return EnhancementPack(
                ai_summary_html=data.get("ai_summary_html", ""),
                key_findings_html=data.get("key_findings_html", ""),
                faq_html=faq_html,
                schema_jsonld=schema_jsonld,
                meta_description=data.get("meta_description", ""),
                faq_structured=faq_items,
            )
        except (json.JSONDecodeError, KeyError, ValueError):
            return EnhancementPack()

    def _extract_json(self, text: str) -> dict[str, Any]:
        """Extract JSON from text that may have markdown formatting."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())


@lru_cache
def get_article_optimizer() -> ArticleOptimizer:
    """Get cached ArticleOptimizer instance."""
    return ArticleOptimizer()
