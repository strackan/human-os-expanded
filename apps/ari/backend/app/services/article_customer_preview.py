"""
Phase 5: Customer Preview Generator

Takes Phase 4 distribution-ready HTML (with JSON-LD, FAQ schema, section summaries)
and produces a clean customer-review version suitable for client approval.

Transformations:
  1. Strip pipeline stats line from article body
  2. Fix og:description / meta description with actual article description
  3. Remove <aside class="section-summary"> elements (LLM-only markup)
  4. Remove <nav aria-label="Table of Contents"> (LLM structural markup)
  5. Remove rendered FAQ <section> (keep JSON-LD in <head> untouched)
  6. Strip citation markers like [1], [2], [3][4], [original] from body text
  7. Clean up blockquote cite with full spokesperson info
  8. Add minimal inline CSS for clean browser rendering
  9. Add "LLM Additive Materials" reference section at bottom
"""

import re
import sys
import os
from typing import Optional
from bs4 import BeautifulSoup, NavigableString, Tag


CUSTOMER_PREVIEW_CSS = """
body {
    margin: 0;
    padding: 0;
    background: #fafafa;
    color: #1a1a1a;
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: 17px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
}
.preview-wrapper {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 24px 64px;
    background: #fff;
    min-height: 100vh;
    box-shadow: 0 0 40px rgba(0,0,0,0.04);
}
.preview-badge {
    display: inline-block;
    background: #f0f0f0;
    color: #666;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 3px;
    margin-bottom: 32px;
}
article h1 {
    font-size: 2em;
    line-height: 1.2;
    margin: 0 0 24px;
    color: #111;
    font-weight: 700;
}
article h2 {
    font-size: 1.4em;
    line-height: 1.3;
    margin: 36px 0 16px;
    color: #222;
    font-weight: 600;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
}
article h3 {
    font-size: 1.15em;
    line-height: 1.35;
    margin: 28px 0 12px;
    color: #333;
    font-weight: 600;
}
article p {
    margin: 0 0 18px;
}
article ul, article ol {
    margin: 0 0 18px;
    padding-left: 28px;
}
article li {
    margin-bottom: 6px;
}
article blockquote {
    margin: 28px 0;
    padding: 20px 24px;
    border-left: 4px solid #c9a84c;
    background: #fdfbf5;
    font-style: italic;
    color: #444;
}
article blockquote cite {
    display: block;
    margin-top: 12px;
    font-style: normal;
    font-size: 0.9em;
    color: #666;
    font-weight: 600;
}
article a {
    color: #2a5db0;
    text-decoration: none;
    border-bottom: 1px solid rgba(42, 93, 176, 0.25);
}
article a:hover {
    border-bottom-color: #2a5db0;
}
article strong {
    font-weight: 700;
    color: #111;
}
article hr {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 32px 0;
}
.additive-separator {
    border: none;
    border-top: 2px solid #d4a843;
    margin: 56px 0 32px;
}
.additive-section {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #555;
    background: #f8f6f0;
    padding: 28px 24px;
    border-radius: 6px;
    margin-top: 8px;
}
.additive-section h2 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 1.1em;
    color: #8b7332;
    margin: 0 0 16px;
    padding: 0;
    border: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.additive-section h3 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 0.95em;
    color: #666;
    margin: 20px 0 8px;
    font-weight: 600;
}
.additive-section p {
    margin: 0 0 10px;
    font-size: 13px;
}
.additive-section ul {
    margin: 4px 0 12px;
    padding-left: 20px;
}
.additive-section li {
    margin-bottom: 4px;
    font-size: 13px;
}
.additive-section dl {
    margin: 8px 0;
}
.additive-section dt {
    font-weight: 600;
    color: #444;
    margin-top: 12px;
}
.additive-section dd {
    margin: 4px 0 0 0;
    color: #666;
}
.additive-section .summary-block {
    background: #fff;
    padding: 12px 16px;
    border-radius: 4px;
    margin: 8px 0;
    border-left: 3px solid #d4a843;
}
.additive-section .citation-note {
    font-style: italic;
    color: #888;
    font-size: 12px;
}
""".strip()


# Pattern to match citation markers: [1], [2][3], [original], etc.
CITATION_PATTERN = re.compile(r'\[(?:\d+|original)\](?:\[\d+\])*')

# Pattern to match the pipeline stats paragraph
STATS_PATTERN = re.compile(
    r'<p>\s*<strong>Word Count:?</strong>\s*:?\s*\d+.*?</p>',
    re.DOTALL | re.IGNORECASE,
)


def _extract_first_paragraph_text(soup: BeautifulSoup) -> str:
    """Extract the first meaningful paragraph text from the article body
    to use as the meta description."""
    article = soup.find("article")
    if not article:
        return ""

    for p in article.find_all("p"):
        text = p.get_text(strip=True)
        # Skip stats lines and very short paragraphs
        if text and len(text) > 60 and "Word Count" not in text:
            # Truncate to ~160 chars for meta description
            if len(text) > 160:
                # Cut at last space before 160
                cut = text[:160].rfind(" ")
                if cut > 100:
                    text = text[:cut] + "..."
                else:
                    text = text[:160] + "..."
            return text
    return ""


def _collect_section_summaries(soup: BeautifulSoup) -> list[dict]:
    """Collect section summaries before removing them."""
    summaries = []
    for aside in soup.find_all("aside", class_="section-summary"):
        parent_section = aside.find_parent("section")
        section_label = ""
        if parent_section:
            section_label = parent_section.get("aria-label", "")
            if not section_label:
                h2 = parent_section.find("h2")
                if h2:
                    section_label = h2.get_text(strip=True)
        summaries.append({
            "section": section_label,
            "text": aside.get_text(strip=True),
        })
    return summaries


def _collect_faq_items(soup: BeautifulSoup) -> list[dict]:
    """Collect FAQ items from the rendered FAQ section before removing it."""
    faq_items = []

    # Check rendered FAQ section
    faq_section = soup.find("section", attrs={"aria-label": "Frequently Asked Questions"})
    if not faq_section:
        faq_section = soup.find("section", attrs={
            "aria-label": lambda v: v and "frequently asked" in v.lower()
        })

    if faq_section:
        dl = faq_section.find("dl")
        if dl:
            dts = dl.find_all("dt")
            dds = dl.find_all("dd")
            for dt, dd in zip(dts, dds):
                faq_items.append({
                    "question": dt.get_text(strip=True),
                    "answer": dd.get_text(strip=True),
                })

    return faq_items


def _collect_citations(html: str) -> list[str]:
    """Collect unique citation markers found in the text."""
    found = CITATION_PATTERN.findall(html)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for c in found:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    return unique


def _strip_citations_from_text(soup: BeautifulSoup) -> None:
    """Walk all text nodes and remove citation markers."""
    article = soup.find("article")
    target = article if article else soup

    for text_node in list(target.find_all(string=True)):
        # Skip script/style tags (preserve JSON-LD)
        if text_node.parent and text_node.parent.name in ("script", "style"):
            continue
        original = str(text_node)
        cleaned = CITATION_PATTERN.sub("", original)
        if cleaned != original:
            text_node.replace_with(NavigableString(cleaned))


def _fix_spokesperson_cite(
    soup: BeautifulSoup,
    spokesperson_name: str,
    spokesperson_title: str,
    spokesperson_org: str,
) -> None:
    """Fix blockquote cite elements with full spokesperson info."""
    if not spokesperson_name:
        return

    full_attribution = f"— {spokesperson_name}"
    if spokesperson_title:
        full_attribution += f", {spokesperson_title}"
    if spokesperson_org:
        full_attribution += f", {spokesperson_org}"

    for cite in soup.find_all("cite"):
        cite_text = cite.get_text(strip=True)
        # Check if cite starts with the spokesperson's first or last name
        # but is incomplete (missing title/org)
        name_parts = spokesperson_name.split()
        is_match = False
        for part in name_parts:
            if part.lower() in cite_text.lower():
                is_match = True
                break

        if is_match and (
            spokesperson_title not in cite_text
            or spokesperson_org not in cite_text
        ):
            cite.string = full_attribution


def _build_additive_section(
    section_summaries: list[dict],
    faq_items: list[dict],
    citations: list[str],
) -> str:
    """Build the LLM Additive Materials reference section."""
    parts = []
    parts.append('<hr class="additive-separator"/>')
    parts.append('<div class="additive-section">')
    parts.append('<h2>LLM Additive Materials</h2>')
    parts.append(
        "<p>The following elements were included in the distribution version "
        "to enhance AI discoverability and search engine understanding. They "
        "are not part of the article text itself and are shown here for "
        "reference.</p>"
    )

    # Section summaries
    if section_summaries:
        parts.append("<h3>Section Summaries</h3>")
        parts.append(
            '<p class="citation-note">These hidden summaries help LLMs quickly '
            "understand each section's content.</p>"
        )
        for s in section_summaries:
            label = s["section"] or "Untitled Section"
            parts.append(f'<div class="summary-block">')
            parts.append(f"<strong>{_escape(label)}</strong>")
            parts.append(f"<p>{_escape(s['text'])}</p>")
            parts.append("</div>")

    # FAQ
    if faq_items:
        parts.append("<h3>FAQ Schema (JSON-LD retained in page head)</h3>")
        parts.append(
            '<p class="citation-note">These Q&amp;A pairs are embedded as '
            "structured data for search engines and AI assistants.</p>"
        )
        parts.append("<dl>")
        for item in faq_items:
            parts.append(f"<dt>{_escape(item['question'])}</dt>")
            parts.append(f"<dd>{_escape(item['answer'])}</dd>")
        parts.append("</dl>")

    # Citations
    if citations:
        parts.append("<h3>Source Citations</h3>")
        parts.append(
            '<p class="citation-note">Citation markers (e.g. '
            + ", ".join(citations[:6])
            + ") were embedded in the distribution text to attribute "
            "source material. They have been removed from the article "
            "body above for readability.</p>"
        )

    parts.append("</div>")
    return "\n".join(parts)


def _escape(text: str) -> str:
    """Basic HTML escaping."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def generate_customer_preview(
    html: str,
    spokesperson_name: str = "",
    spokesperson_title: str = "",
    spokesperson_org: str = "",
) -> str:
    """
    Transform Phase 4 distribution HTML into a clean customer preview.

    Args:
        html: Raw Phase 4 HTML string (distribution-ready with JSON-LD, FAQ, etc.)
        spokesperson_name: Full name of the spokesperson (e.g. "Philip N. Diehl")
        spokesperson_title: Title (e.g. "President")
        spokesperson_org: Organization (e.g. "U.S. Money Reserve")

    Returns:
        Clean HTML string suitable for customer review.
    """
    # Collect materials before we start removing things
    citations = _collect_citations(html)

    soup = BeautifulSoup(html, "html.parser")

    section_summaries = _collect_section_summaries(soup)
    faq_items = _collect_faq_items(soup)

    # --- 1. Strip pipeline stats paragraph ---
    for p in soup.find_all("p"):
        text = p.get_text(strip=True)
        if text.startswith("Word Count") or (
            "Word Count" in text and "Source:" in text
        ):
            # Also remove the <hr> immediately following the stats line
            next_sib = p.find_next_sibling()
            if next_sib and next_sib.name == "hr":
                next_sib.decompose()
            p.decompose()
            break

    # --- 2. Fix meta/og descriptions ---
    first_para_text = _extract_first_paragraph_text(soup)
    if first_para_text:
        for meta in soup.find_all("meta"):
            name_attr = meta.get("name", "").lower()
            prop_attr = meta.get("property", "").lower()
            if name_attr == "description" or prop_attr == "og:description":
                content = meta.get("content", "")
                # Replace if content looks like stats
                if "Word Count" in content or "Source:" in content or len(content) < 20:
                    meta["content"] = first_para_text

    # --- 3. Remove section summaries ---
    for aside in soup.find_all("aside", class_="section-summary"):
        aside.decompose()

    # --- 4. Remove table of contents nav ---
    for nav in soup.find_all("nav", attrs={"aria-label": "Table of Contents"}):
        nav.decompose()
    # Also try case-insensitive
    for nav in soup.find_all("nav", attrs={
        "aria-label": lambda v: v and "table of contents" in v.lower()
    }):
        nav.decompose()

    # --- 5. Remove rendered FAQ section (keep JSON-LD in head) ---
    for section in soup.find_all("section", attrs={
        "aria-label": lambda v: v and "frequently asked" in v.lower()
    }):
        section.decompose()

    # --- 6. Strip citation markers ---
    _strip_citations_from_text(soup)

    # --- 7. Fix spokesperson cite ---
    _fix_spokesperson_cite(soup, spokesperson_name, spokesperson_title, spokesperson_org)

    # --- Build the final document ---
    # Extract what we have
    head_content = ""
    head = soup.find("head")
    if head:
        head_content = head.decode_contents()

    # Find the article
    article = soup.find("article")
    article_html = str(article) if article else str(soup)

    # Build additive materials section
    additive_html = _build_additive_section(section_summaries, faq_items, citations)

    # --- 8 & 9. Assemble final document with inline CSS ---
    final_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
{head_content.strip()}
<style>
{CUSTOMER_PREVIEW_CSS}
</style>
</head>
<body>
<div class="preview-wrapper">
<div class="preview-badge">Customer Preview</div>
{article_html}
{additive_html}
</div>
</body>
</html>"""

    # Clean up any duplicate meta charset / viewport that might exist from original head
    # (we added them above, and they may also be in head_content)
    final_soup = BeautifulSoup(final_html, "html.parser")
    head_tag = final_soup.find("head")
    if head_tag:
        # Deduplicate charset meta
        charset_metas = head_tag.find_all("meta", attrs={"charset": True})
        if len(charset_metas) > 1:
            for dup in charset_metas[1:]:
                dup.decompose()
        # Deduplicate viewport meta
        viewport_metas = [
            m for m in head_tag.find_all("meta")
            if m.get("name", "").lower() == "viewport"
        ]
        if len(viewport_metas) > 1:
            for dup in viewport_metas[1:]:
                dup.decompose()

    return str(final_soup)


def main():
    """CLI entry point: python article_customer_preview.py <input.html> [--name ...] [--title ...] [--org ...]"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Phase 5: Generate customer preview from Phase 4 distribution HTML"
    )
    parser.add_argument(
        "input_file",
        help="Path to Phase 4 HTML file",
    )
    parser.add_argument(
        "--name",
        default="",
        help="Spokesperson full name (e.g. 'Philip N. Diehl')",
    )
    parser.add_argument(
        "--title",
        default="",
        help="Spokesperson title (e.g. 'President')",
    )
    parser.add_argument(
        "--org",
        default="",
        help="Spokesperson organization (e.g. 'U.S. Money Reserve')",
    )
    parser.add_argument(
        "-o", "--output",
        default="",
        help="Output file path (default: {basename}-customer-preview.html)",
    )

    args = parser.parse_args()

    input_path = args.input_file
    if not os.path.isfile(input_path):
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    result = generate_customer_preview(
        html=html_content,
        spokesperson_name=args.name,
        spokesperson_title=args.title,
        spokesperson_org=args.org,
    )

    if args.output:
        output_path = args.output
    else:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}-customer-preview{ext}"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(result)

    print(f"Customer preview written to: {output_path}")


if __name__ == "__main__":
    main()
