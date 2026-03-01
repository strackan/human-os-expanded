"""Lite Report (AI Visibility Snapshot) PDF renderer using fpdf2."""

from datetime import datetime

from app.models.lite_report import DiscoveryResult, LiteAnalysisResult
from app.services.pdf.base import (
    CREAM_ALT,
    DARK,
    GRAY,
    GREEN,
    MARGIN,
    PAGE_W,
    TAN,
    WHITE,
    FancyRobotPDF,
)


def generate(discovery: DiscoveryResult, analysis: LiteAnalysisResult) -> bytes:
    """Generate the branded snapshot PDF. Always succeeds (pure Python)."""
    date_str = datetime.now().strftime("%B %d, %Y")
    company = discovery.company_name
    domain = discovery.domain
    industry = discovery.industry

    pdf = FancyRobotPDF(
        title=f"AI Visibility Snapshot - {company}",
        footer_text=f"AI Visibility Snapshot for {company} | Prepared by Fancy Robot -- fancyrobot.ai | {date_str}",
    )

    # ── Page 1: Cover ──
    pdf.cover_page(
        title="AI Visibility Snapshot",
        subtitle=analysis.report_title or "",
        company_name=company,
        domain=domain,
        industry=industry,
        date_str=date_str,
        meta_lines=[
            f"Analysis: {analysis.total_prompts} AI prompts across 4 personas and 4 topics",
        ],
    )

    # ── Page 2: Executive Summary ──
    pdf.section_header("Executive Summary")

    if analysis.headline_stat:
        pdf.callout_box(analysis.headline_stat, bold=True)

    # Score badge + stats side by side
    y_start = pdf.get_y()
    # Left: score badge
    pdf.set_fill_color(*GREEN)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 26)
    pdf.set_xy(MARGIN, y_start)
    pdf.cell(30, 20, f"{analysis.overall_score:.0f}", fill=True, align="C")
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(*GRAY)
    pdf.set_xy(MARGIN, y_start + 20)
    pdf.cell(30, 4, "ARI Score (0-100)", align="C")

    # Right: stats
    stats = [
        ("Mention Rate:", f"{analysis.mention_rate * 100:.0f}% ({analysis.mentions_count} of {analysis.total_prompts} prompts)"),
        ("Prompts Tested:", str(analysis.total_prompts)),
        ("Industry:", industry),
    ]
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    sy = y_start + 2
    for label, val in stats:
        pdf.set_xy(MARGIN + 38, sy)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(30, 5, label)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(100, 5, val)
        sy += 6

    pdf.set_y(y_start + 30)

    if analysis.executive_summary:
        pdf.sub_heading("Overview", size=12)
        pdf.paragraphs(analysis.executive_summary)

    # ── Page 3: Competitor Landscape ──
    pdf.section_header("Competitor Landscape")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.multi_cell(
        PAGE_W - 2 * MARGIN, 5,
        f"How often AI models recommend {company} vs. key competitors when asked about {industry.lower()}.",
    )
    pdf.ln(3)

    # Build competitor table
    headers = ["Company", "Mention Rate", "Avg Position", "Visibility"]
    rows = [
        [company, f"{analysis.mention_rate * 100:.0f}%", "N/A", _bar_text(analysis.mention_rate * 100)],
    ]
    for comp in analysis.competitor_scores:
        rate = comp.mention_rate * 100
        pos = f"{comp.avg_position:.1f}" if comp.avg_position else "N/A"
        rows.append([comp.name, f"{rate:.0f}%", pos, _bar_text(rate)])
    pdf.data_table(headers, rows, col_widths=[30, 18, 18, 34])

    # Bar charts (visual)
    pdf.ln(2)
    pdf.bar_chart_row(company, analysis.mention_rate * 100, bar_color=TAN)
    for comp in analysis.competitor_scores:
        pdf.bar_chart_row(comp.name, comp.mention_rate * 100, bar_color=GREEN)

    if discovery.differentiators:
        pdf.sub_heading("Company Differentiators", size=12)
        for d in discovery.differentiators:
            pdf.finding_item(d, border_color=GREEN)

    # ── Page 4: Audience & Topic Analysis ──
    pdf.section_header("Audience & Topic Analysis")

    pdf.sub_heading("By Audience Persona", size=12)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.multi_cell(PAGE_W - 2 * MARGIN, 5, f"How often {company} appears when AI is asked questions from each audience perspective.")
    pdf.ln(2)

    persona_rows = []
    for pb in analysis.persona_breakdown:
        rate_str = f"{pb.mention_rate * 100:.0f}%"
        persona_rows.append([
            pb.persona,
            rate_str,
            f"{pb.mention_count}/{pb.total_prompts}",
            pb.top_competitor or "\u2014",
        ])
    pdf.data_table(
        ["Persona", "Mention Rate", "Mentions", "Top Competitor"],
        persona_rows,
        col_widths=[30, 18, 18, 34],
    )

    pdf.sub_heading("By Topic", size=12)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.multi_cell(PAGE_W - 2 * MARGIN, 5, f"Visibility across key topics in the {industry.lower()} space.")
    pdf.ln(2)

    topic_rows = []
    for tb in analysis.topic_breakdown:
        rate_str = f"{tb.mention_rate * 100:.0f}%"
        pos_str = f"{tb.avg_position:.1f}" if tb.avg_position else "N/A"
        topic_rows.append([tb.topic, rate_str, f"{tb.mention_count}/{tb.total_prompts}", pos_str])
    pdf.data_table(
        ["Topic", "Mention Rate", "Mentions", "Avg Position"],
        topic_rows,
        col_widths=[35, 20, 20, 25],
    )

    # ── Page 5: Key Findings ──
    pdf.section_header("Key Findings")

    if analysis.core_finding:
        pdf.set_font("Helvetica", "B", 7)
        pdf.set_text_color(*TAN)
        pdf.set_x(MARGIN)
        pdf.cell(0, 4, "CORE FINDING")
        pdf.ln(5)
        pdf.callout_box(analysis.core_finding, border_color=TAN, bold=True)
        if analysis.core_finding_detail:
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(*GRAY)
            pdf.set_x(MARGIN)
            pdf.multi_cell(PAGE_W - 2 * MARGIN, 5, analysis.core_finding_detail)
            pdf.ln(4)

    if analysis.key_findings:
        for finding in analysis.key_findings:
            pdf.finding_item(finding)

    # ── Page 6: Strategic Recommendations ──
    pdf.section_header("Strategic Recommendations")

    if analysis.strategic_recommendations:
        for i, rec in enumerate(analysis.strategic_recommendations, 1):
            pdf.rec_item(f"{i}. {rec}")

    if analysis.article_teasers:
        pdf.sub_heading("Content Gap Recommendations", size=12)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*DARK)
        pdf.set_x(MARGIN)
        pdf.multi_cell(PAGE_W - 2 * MARGIN, 5, "These content pieces are designed to close specific AI visibility gaps identified in this analysis.")
        pdf.ln(3)

        for teaser in analysis.article_teasers:
            _teaser_card(pdf, teaser)

    # ── Page 7: Next Steps / CTA ──
    pdf.section_header("Next Steps")

    pdf.cta_box(
        "Ready to improve your AI visibility?",
        f"This snapshot analyzed {analysis.total_prompts} prompts across 1 AI model. Our full Fancy Robot AI Visibility Audit uses 9-11 models, 70+ prompts, and 7+ personas for a comprehensive view of your AI discoverability.",
    )

    pdf.sub_heading("What You Get with the Full Analysis", size=12)
    comparison_rows = [
        ["AI Models Tested", "1 (GPT)", "9-11 models"],
        ["Prompts Analyzed", str(analysis.total_prompts), "70-80+"],
        ["Audience Personas", "4", "7+"],
        ["Article Drafts", "Topic ideas only", "3-5 full drafts"],
        ["Competitive Deep-Dive", "Basic comparison", "Full competitive matrix"],
        ["Ongoing Monitoring", "\u2014", "Monthly tracking"],
    ]
    pdf.data_table(
        ["Feature", "This Snapshot", "Full Gumshoe Report"],
        comparison_rows,
        col_widths=[40, 30, 30],
    )

    pdf.sub_heading("Contact", size=12)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.cell(0, 5, "Fancy Robot")
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(MARGIN)
    pdf.cell(0, 5, "AI Visibility Intelligence")
    pdf.ln(6)
    pdf.set_x(MARGIN)
    pdf.cell(0, 5, "Learn more at fancyrobot.ai")

    return pdf.to_bytes()


def _bar_text(pct: float) -> str:
    """Visual representation for the table (text fallback)."""
    bars = int(pct / 5)
    return "\u2588" * bars


def _teaser_card(pdf: FancyRobotPDF, teaser):
    """Render an article teaser card."""
    w = PAGE_W - 2 * MARGIN
    y = pdf.get_y()

    # Measure height
    pdf.set_font("Helvetica", "B", 9)
    title_lines = pdf.multi_cell(w - 12, 5, teaser.title, dry_run=True, output="LINES")
    pdf.set_font("Helvetica", "", 8)
    rat_lines = pdf.multi_cell(w - 12, 4, teaser.rationale, dry_run=True, output="LINES")
    h = len(title_lines) * 5 + len(rat_lines) * 4 + 18

    # Check page break
    if y + h > 260:
        pdf.add_page()
        y = pdf.get_y()

    # Background
    pdf.set_fill_color(*CREAM_ALT)
    pdf.rect(MARGIN, y, w, h, "F")
    # Left border
    pdf.set_fill_color(*GREEN)
    pdf.rect(MARGIN, y, 1.2, h, "F")

    # Title
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.set_xy(MARGIN + 5, y + 3)
    pdf.multi_cell(w - 12, 5, teaser.title)

    # Rationale
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*GRAY)
    pdf.set_x(MARGIN + 5)
    pdf.multi_cell(w - 12, 4, teaser.rationale)

    # Target gap
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(*GREEN)
    pdf.set_x(MARGIN + 5)
    pdf.cell(0, 4, f"Addresses: {teaser.target_gap}")

    pdf.set_y(y + h + 3)
