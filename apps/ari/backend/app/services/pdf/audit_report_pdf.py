"""Full Audit Report PDF renderer using fpdf2."""

from datetime import datetime

from app.models.audit import SEVERITY_DISPLAY
from app.services.pdf.base import (
    CREAM_ALT,
    DARK,
    GRAY,
    GREEN,
    MARGIN,
    PAGE_W,
    SEV_CRITICAL,
    SEV_BELOW,
    SEVERITY_COLORS,
    TAN,
    WHITE,
    FancyRobotPDF,
)


def generate(profile, analysis, anti_patterns, gaps, report) -> bytes:
    """Generate the branded audit PDF. Always succeeds (pure Python)."""
    date_str = datetime.now().strftime("%B %d, %Y")
    company = profile.company_name
    domain = profile.domain
    industry = profile.industry

    severity_band = analysis.severity_band.value
    severity_display = SEVERITY_DISPLAY.get(analysis.severity_band, str(analysis.severity_band))

    pdf = FancyRobotPDF(
        title=f"AI Visibility Audit - {company}",
        footer_text=f"AI Visibility Audit for {company} | Prepared by Fancy Robot AI Intelligence Division | {date_str}",
    )

    # ── Page 1: Cover ──
    pdf.cover_page(
        title="AI Visibility Audit",
        company_name=company,
        domain=domain,
        industry=industry,
        date_str=date_str,
        score=f"{analysis.overall_ari:.0f}",
        severity_band=severity_band,
        severity_display=severity_display,
        meta_lines=[
            f"Analysis: {analysis.total_prompts} prompts across {len(analysis.provider_scores)} AI models",
        ],
    )

    # ── Page 2: Executive Summary ──
    pdf.section_header("Executive Summary")

    # 4-Factor Score Breakdown
    pdf.sub_heading(f"4-Factor ARI Score: {analysis.overall_ari:.0f}/100", color=GREEN, size=11)

    _score_bar(pdf, "Mention Frequency (40%)", analysis.mention_frequency, "%")
    _score_bar(pdf, "Position Quality (25%)", analysis.position_quality, "/100")
    _score_bar(pdf, "Narrative Accuracy (20%)", analysis.narrative_accuracy, "/100", bar_color=TAN)
    _score_bar(pdf, "Founder Retrieval (15%)", analysis.founder_retrieval, "/100", bar_color=TAN)

    pdf.ln(4)

    # Stats
    stats = [
        ("Total Prompts:", str(analysis.total_prompts)),
        ("AI Models:", str(len(analysis.provider_scores))),
        ("Total Responses:", str(analysis.total_responses)),
        ("Mentions:", str(analysis.mentions_count)),
        ("Industry:", industry),
    ]
    pdf.set_font("Helvetica", "", 9)
    for label, val in stats:
        pdf.set_x(MARGIN)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK)
        pdf.cell(35, 5, label)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(80, 5, val)
        pdf.ln(5.5)

    pdf.ln(4)
    pdf.paragraphs(report.executive_summary)

    # ── Page 3: The Core Problem ──
    pdf.section_header(f"The Core Problem: {report.core_problem_name}")

    # Problem callout (red border)
    w = PAGE_W - 2 * MARGIN
    y = pdf.get_y()
    pdf.set_fill_color(255, 247, 237)  # #FFF7ED
    pdf.set_font("Helvetica", "B", 13)
    lines = pdf.multi_cell(w - 16, 7, report.core_problem_name, dry_run=True, output="LINES")
    h = len(lines) * 7 + 12
    pdf.rect(MARGIN, y, w, h, "F")
    pdf.set_fill_color(*SEV_CRITICAL)
    pdf.rect(MARGIN, y, 2, h, "F")
    pdf.set_text_color(*DARK)
    pdf.set_xy(MARGIN + 8, y + 6)
    pdf.multi_cell(w - 16, 7, report.core_problem_name)
    pdf.set_y(y + h + 6)

    pdf.paragraphs(report.core_problem)

    # ── Page 4: Competitive Landscape ──
    pdf.section_header("Competitive Landscape")

    # Competitor mention rates
    comp_rates = sorted(
        analysis.competitor_mention_rates.items(),
        key=lambda x: x[1],
        reverse=True,
    )

    pdf.bar_chart_row(company, analysis.mention_frequency, bar_color=TAN)
    for comp_name, comp_rate in comp_rates:
        pdf.bar_chart_row(comp_name, comp_rate * 100, bar_color=GREEN)

    pdf.ln(3)

    # Table
    comp_table_rows = [[company, f"{analysis.mention_frequency:.0f}%", ""]]
    for comp_name, comp_rate in comp_rates:
        comp_table_rows.append([comp_name, f"{comp_rate * 100:.0f}%", ""])
    pdf.data_table(
        ["Company", "Mention Rate", "Visibility"],
        comp_table_rows,
        col_widths=[30, 18, 52],
    )

    pdf.ln(3)
    pdf.paragraphs(report.competitive_landscape)

    # ── Page 5: Prompt Analysis by Dimension ──
    pdf.section_header("Prompt Analysis by Dimension")

    dim_rows = []
    for ds in analysis.dimension_scores:
        dim_name = ds.dimension.value.replace("_", " ").title()
        rate = f"{ds.mention_rate * 100:.0f}%"
        score = f"{ds.score:.0f}/100"
        dim_rows.append([dim_name, rate, score, ""])
    pdf.data_table(
        ["Dimension", "Mention Rate", "Score", "Visibility"],
        dim_rows,
        col_widths=[30, 18, 15, 37],
    )

    # Visual bars for dimensions
    pdf.ln(2)
    for ds in analysis.dimension_scores:
        dim_name = ds.dimension.value.replace("_", " ").title()
        pdf.bar_chart_row(dim_name, ds.mention_rate * 100, bar_color=GREEN)

    pdf.ln(3)
    pdf.paragraphs(report.dimension_analysis)

    # ── Page 6: Anti-Patterns ──
    if anti_patterns:
        pdf.section_header("Anti-Patterns Detected")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*DARK)
        pdf.set_x(MARGIN)
        pdf.multi_cell(PAGE_W - 2 * MARGIN, 5, "These are recurring AI visibility failure modes detected in your audit results.")
        pdf.ln(3)

        for ap in anti_patterns:
            _anti_pattern_card(pdf, ap)

    # ── Page 7: Gap Analysis ──
    if gaps:
        pdf.section_header("Gap Analysis")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*DARK)
        pdf.set_x(MARGIN)
        pdf.multi_cell(PAGE_W - 2 * MARGIN, 5, "Visibility gaps ranked by priority (impact x coverage / effort).")
        pdf.ln(3)

        gap_rows = []
        for gap in gaps[:10]:
            gap_rows.append([
                f"{gap.priority_score:.2f}",
                gap.gap_type.value.title(),
                gap.description,
                gap.recommendation[:120] + ("..." if len(gap.recommendation) > 120 else ""),
            ])
        pdf.data_table(
            ["Priority", "Type", "Description", "Recommendation"],
            gap_rows,
            col_widths=[12, 12, 40, 36],
        )

    # ── Page 8: Strategic Recommendations ──
    pdf.section_header("Strategic Recommendations")
    for para in report.recommendations.split("\n\n"):
        para = para.strip()
        if para:
            pdf.rec_item(para)

    # ── Page 9: The Pitch ──
    pdf.section_header("The Pitch")
    pdf.pitch_box(report.pitch_hook)

    # ── Page 10: Next Steps ──
    pdf.section_header("Next Steps")

    pdf.cta_box(
        "Ready to improve your AI visibility?",
        f"This audit analyzed {analysis.total_prompts} prompts across {len(analysis.provider_scores)} AI models using the 8-dimension Fancy Robot methodology. Your ARI score of {analysis.overall_ari:.0f}/100 puts you in the {severity_display} band.",
    )

    pdf.sub_heading("Recommended Actions", size=12)
    timeline_rows = [
        ["Week 1-2", "Address critical anti-patterns and highest-priority gaps"],
        ["Month 1", "Publish foundational content targeting weakest dimensions"],
        ["Month 2-3", "Execute competitive positioning strategy and founder visibility campaign"],
        ["Ongoing", "Monthly ARI monitoring to track score trajectory"],
    ]
    pdf.data_table(["Timeline", "Action"], timeline_rows, col_widths=[15, 85])

    pdf.sub_heading("Contact", size=12)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.cell(0, 5, "Fancy Robot AI Intelligence Division")
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(MARGIN)
    pdf.cell(0, 5, "Powered by the ARI (AI Recommendation Index) Platform")

    return pdf.to_bytes()


def _score_bar(pdf: FancyRobotPDF, label: str, value: float, suffix: str, bar_color=GREEN):
    """Render a labeled score bar for the 4-factor breakdown."""
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*GRAY)
    pdf.set_x(MARGIN)
    pdf.cell(0, 4, f"{label}: {value:.0f}{suffix}")
    pdf.ln(4)
    pdf.bar_chart_row("", value, max_val=100, bar_color=bar_color, label_suffix="")
    # Overwrite the empty label area
    pdf.set_y(pdf.get_y() - 8)
    pdf.set_y(pdf.get_y() + 2)


def _anti_pattern_card(pdf: FancyRobotPDF, ap):
    """Render an anti-pattern card with severity badge."""
    w = PAGE_W - 2 * MARGIN
    y = pdf.get_y()

    # Determine border color by severity
    sev = getattr(ap, "severity", "medium")
    if sev == "critical" or sev == "high":
        border_c = SEV_CRITICAL
    elif sev == "medium":
        border_c = SEV_BELOW
    else:
        border_c = GRAY

    # Measure content
    pdf.set_font("Helvetica", "B", 10)
    name_lines = pdf.multi_cell(w - 12, 5, ap.display_name, dry_run=True, output="LINES")
    pdf.set_font("Helvetica", "", 8)
    ev_text = getattr(ap, "evidence", "")
    ev_lines = pdf.multi_cell(w - 12, 4, ev_text, dry_run=True, output="LINES") if ev_text else []
    h = len(name_lines) * 5 + len(ev_lines) * 4 + 18

    # Page break check
    if y + h > 260:
        pdf.add_page()
        y = pdf.get_y()

    # Card background
    pdf.set_fill_color(*CREAM_ALT)
    pdf.rect(MARGIN, y, w, h, "F")
    # Left border
    pdf.set_fill_color(*border_c)
    pdf.rect(MARGIN, y, 1.5, h, "F")

    # Name
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.set_xy(MARGIN + 6, y + 3)
    pdf.multi_cell(w - 12, 5, ap.display_name)

    # Severity badge
    sev_color = SEVERITY_COLORS.get(sev, GRAY)
    pdf.set_fill_color(*sev_color)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 7)
    sev_text = sev.upper()
    badge_w = pdf.get_string_width(sev_text) + 6
    pdf.set_x(MARGIN + 6)
    pdf.cell(badge_w, 4, sev_text, fill=True, align="C")
    pdf.ln(5)

    # Evidence
    if ev_text:
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*GRAY)
        pdf.set_x(MARGIN + 6)
        pdf.multi_cell(w - 12, 4, ev_text)

    pdf.set_y(y + h + 3)
