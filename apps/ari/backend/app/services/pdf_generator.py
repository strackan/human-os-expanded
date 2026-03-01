"""PDF generation service — delegates to fpdf2-based renderer."""

import logging

logger = logging.getLogger(__name__)


def generate_pdf(markdown_content: str, title: str, customer_name: str) -> bytes:
    """Generate a branded PDF from markdown content.

    Uses fpdf2 (pure Python) — works on Vercel serverless without system libs.
    """
    from app.services.pdf.deliverable_pdf import generate

    return generate(markdown_content, title, customer_name)
