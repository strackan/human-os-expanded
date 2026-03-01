"""Output formatters for EnhancementPack — serialize to different delivery formats."""

import json
from enum import Enum

from app.models.article import EnhancementPack, EnhanceResponse


class OutputFormat(str, Enum):
    HTML_BLOCKS = "html_blocks"
    JSON = "json"
    RSS_FRAGMENT = "rss_fragment"


def format_response(response: EnhanceResponse, output: OutputFormat) -> dict:
    """Format an EnhanceResponse for the requested output mode."""
    if output == OutputFormat.JSON:
        return response.model_dump()
    elif output == OutputFormat.RSS_FRAGMENT:
        return _format_rss(response)
    else:
        return _format_html_blocks(response)


def _format_html_blocks(response: EnhanceResponse) -> dict:
    """Return enhancement blocks as discrete, paste-ready HTML strings.

    Each field is a self-contained HTML fragment an editor can copy
    directly into a CMS textarea or rich text field.
    """
    e = response.enhancements
    return {
        "blocks": {
            "ai_summary": e.ai_summary_html,
            "key_findings": e.key_findings_html,
            "faq": e.faq_html,
            "schema_jsonld": e.schema_jsonld,
            "meta_description": e.meta_description,
        },
        "score": response.analysis.score.model_dump(),
    }


def _format_rss(response: EnhanceResponse) -> dict:
    """Return enhancements as an RSS-injectable XML fragment.

    Produces a block suitable for injection into <content:encoded>
    or a custom XML element in an RSS feed.
    """
    e = response.enhancements

    parts = []
    if e.ai_summary_html:
        parts.append(f'<div class="ade-summary">\n<h3>AI Summary</h3>\n{e.ai_summary_html}\n</div>')
    if e.key_findings_html:
        parts.append(f'<div class="ade-findings">\n{e.key_findings_html}\n</div>')
    if e.faq_html:
        parts.append(f'<div class="ade-faq">\n<h3>Frequently Asked Questions</h3>\n{e.faq_html}\n</div>')

    rss_block = "\n\n".join(parts)

    return {
        "rss_content_block": rss_block,
        "schema_jsonld": e.schema_jsonld,
        "meta_description": e.meta_description,
        "score": response.analysis.score.model_dump(),
    }
