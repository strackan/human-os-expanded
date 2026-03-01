"""Generic deliverable PDF renderer (markdown -> PDF) using fpdf2."""

import re
from datetime import datetime

import markdown2

from app.services.pdf.base import (
    DARK,
    GRAY,
    GREEN,
    MARGIN,
    PAGE_W,
    WHITE,
    FancyRobotPDF,
)


def generate(markdown_content: str, title: str, customer_name: str) -> bytes:
    """Generate a branded PDF from markdown content. Always succeeds (pure Python)."""
    date_str = datetime.now().strftime("%B %Y")

    pdf = FancyRobotPDF(
        title=f"{title} - {customer_name}",
        footer_text=f"Confidential - Prepared for {customer_name} by Fancy Robot AI Intelligence Division",
    )

    # ── Cover Page ──
    pdf.cover_page(
        title=title,
        company_name=customer_name,
        date_str=date_str,
        meta_lines=[],
    )

    # ── Content Pages ──
    pdf.add_page()

    # Convert markdown to HTML, then use write_html
    html_content = markdown2.markdown(
        markdown_content,
        extras=[
            "tables",
            "fenced-code-blocks",
            "header-ids",
            "strike",
            "task_list",
            "cuddled-lists",
        ],
    )

    # Strip the first H1 and subtitle (already on cover page)
    html_content = _strip_cover_elements(html_content)

    # Inject basic styling for write_html
    styled_html = _wrap_with_style(html_content)

    pdf.write_html(styled_html)

    return pdf.to_bytes()


def _strip_cover_elements(html: str) -> str:
    """Remove first H1, subtitle H2, leading HRs, and metadata lines."""
    lines = html.split("\n")
    filtered = []
    skipped_h1 = False
    skip_next_h2 = False

    for line in lines:
        stripped = line.strip()

        # Skip first H1
        if not skipped_h1 and stripped.startswith("<h1"):
            skipped_h1 = True
            skip_next_h2 = True
            continue

        # Skip subtitle H2 right after H1
        if skip_next_h2 and stripped.startswith("<h2"):
            skip_next_h2 = False
            continue

        # Skip leading HRs
        if stripped == "<hr />" and len(filtered) < 3:
            continue

        # Skip metadata lines
        if "Prepared by:" in stripped or "Date:</strong>" in stripped:
            continue

        skip_next_h2 = False
        filtered.append(line)

    return "\n".join(filtered)


def _wrap_with_style(html: str) -> str:
    """Wrap HTML content with basic inline styles for fpdf2 write_html."""
    # fpdf2's write_html supports a subset of HTML. We add minimal styling.
    # It supports: h1-h6, p, b, i, u, br, hr, a, img, table, tr, td, th,
    # ul, ol, li, blockquote, code, pre, font (color, size, face)
    return html
