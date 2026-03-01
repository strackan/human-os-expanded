"""Run USMR Gold IRA article through Phase 2 (Editor) + Phase 4 (HTML Converter)."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.article_editor import ArticleEditor
from app.services.article_html_converter import ArticleHtmlConverter
from app.models.article_pipeline import EditorInput, ConverterInput

ARI = Path(__file__).parent.parent.parent
OUT_DIR = ARI / "customers/usmoneyreserve/articles"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Extract Article 3 (Gold IRA Guide) from deliverables
drafts = (ARI / "customers/usmoneyreserve/deliverables/03-article-drafts.md").read_text(encoding="utf-8")
start_marker = "# Gold IRAs in 2026:"
end_marker = "## Article 4:"
start_idx = drafts.find(start_marker)
end_idx = drafts.find(end_marker)
raw_article = drafts[start_idx:end_idx].strip() if end_idx > 0 else drafts[start_idx:].strip()

# Clean up editorial markers like **[SECTION 1: THE BASICS]**, **[LEAD]**, etc.
import re
raw_article = re.sub(r'\*\*\[(?:HEADLINE|SUBHEAD|LEAD|SECTION \d+[^]]*|CLOSING|CTA|SEO KEYWORDS INCLUDED)\]\*\*\n?', '', raw_article)
# Remove the SEO keywords block at the end
kw_idx = raw_article.find("- gold IRA 2026")
if kw_idx > 0:
    raw_article = raw_article[:kw_idx].rstrip().rstrip("-").rstrip()

source_words = len(raw_article.split())
print(f"Source article: {source_words} words")
print(f"Title: {raw_article.split(chr(10))[0]}")
print()


async def main():
    # === Phase 2: Editor ===
    print("=" * 60)
    print("PHASE 2: Editor Hardening")
    print("=" * 60)

    editor = ArticleEditor()
    editor_output = await editor.edit(EditorInput(
        article_markdown=raw_article,
        client_name="U.S. Money Reserve",
        domain="usmoneyreserve.com",
    ))

    print(f"Word count: {editor_output.word_count}")
    print(f"Total changes: {editor_output.editors_log.total_changes}")
    print(f"Passes: {len(editor_output.editors_log.passes)}")
    print(f"AIO scorecard: {editor_output.editors_log.aio_scorecard}")
    print(f"Provider: {editor_output.provider_used}")
    print(f"Latency: {editor_output.latency_ms}ms")

    # Save hardened markdown
    hardened_path = OUT_DIR / "03-ira-hardened.md"
    hardened_path.write_text(editor_output.hardened_markdown, encoding="utf-8")
    print(f"Saved: {hardened_path}")
    print()

    # === Phase 4: HTML Converter ===
    print("=" * 60)
    print("PHASE 4: HTML Converter")
    print("=" * 60)

    converter = ArticleHtmlConverter()
    converter_output = await converter.convert(ConverterInput(
        article_markdown=editor_output.hardened_markdown,
        client_name="U.S. Money Reserve",
        domain="usmoneyreserve.com",
        author_name="NewsUSA",
    ))

    print(converter_output.optimizers_log)

    # Save HTML
    html_path = OUT_DIR / "03-ira-optimized.html"
    html_path.write_text(converter_output.article_html, encoding="utf-8")
    print(f"Saved: {html_path}")

    # Save log
    log_path = OUT_DIR / "03-ira-optimizer-log.txt"
    log_path.write_text(converter_output.optimizers_log, encoding="utf-8")
    print(f"Saved: {log_path}")

    # Quick title check
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(converter_output.article_html, "html.parser")
    title = soup.find("title")
    print(f"Title: [{title.get_text(strip=True) if title else 'MISSING'}]")


asyncio.run(main())
