"""Shared PDF base class for all Fancy Robot / ARI reports.

Uses fpdf2 (pure Python) so it works on Vercel serverless without Cairo.
"""

import re
from datetime import datetime

from fpdf import FPDF

# Brand colors (RGB tuples)
GREEN = (124, 152, 133)       # #7C9885
TAN = (196, 167, 125)         # #C4A77D
DARK = (45, 42, 38)           # #2D2A26
CREAM = (250, 249, 247)       # #FAF9F7
CREAM_ALT = (245, 242, 237)   # #F5F2ED
GRAY = (107, 101, 96)         # #6B6560
BORDER = (232, 229, 225)      # #E8E5E1
WHITE = (255, 255, 255)

# Severity badge colors
SEV_CRITICAL = (220, 38, 38)   # #DC2626
SEV_POOR = (234, 88, 12)       # #EA580C
SEV_BELOW = (217, 119, 6)      # #D97706
SEV_MODERATE = (202, 138, 4)   # #CA8A04
SEV_GOOD = (101, 163, 13)      # #65A30D
SEV_STRONG = (22, 163, 74)     # #16A34A
SEV_DOMINANT = (5, 150, 105)   # #059669

SEVERITY_COLORS = {
    "critical": SEV_CRITICAL,
    "poor": SEV_POOR,
    "below_avg": SEV_BELOW,
    "moderate": SEV_MODERATE,
    "good": SEV_GOOD,
    "strong": SEV_STRONG,
    "dominant": SEV_DOMINANT,
}

# Emoji badge → colored text badge mapping
BADGE_MAP = {
    "\U0001f534": ("[CRITICAL GAP]", SEV_CRITICAL),
    "\U0001f7e2": ("[STRENGTH]", SEV_STRONG),
    "\U0001f7e1": ("[OPPORTUNITY]", SEV_BELOW),
    "\u26a0\ufe0f": ("[KEY INSIGHT]", TAN),
    "\u26a0": ("[KEY INSIGHT]", TAN),
}

# Page dimensions (letter size in mm)
PAGE_W = 215.9
PAGE_H = 279.4
MARGIN = 19.05  # 0.75in


class FancyRobotPDF(FPDF):
    """Base PDF with Fancy Robot branding, footer, and shared drawing helpers."""

    def __init__(self, title: str = "Report", footer_text: str = ""):
        super().__init__(orientation="P", unit="mm", format="letter")
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(MARGIN, MARGIN, MARGIN)
        self._report_title = title
        self._footer_text = footer_text

    # ── Footer (called automatically by fpdf2 on every page) ──

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "", 6)
        self.set_text_color(*GRAY)
        self.cell(0, 4, self._footer_text, align="C")

    # ── Cover Page ──

    def cover_page(
        self,
        title: str,
        subtitle: str = "",
        company_name: str = "",
        domain: str = "",
        industry: str = "",
        date_str: str = "",
        meta_lines: list[str] | None = None,
        score: str | None = None,
        severity_band: str | None = None,
        severity_display: str | None = None,
    ):
        self.add_page()
        y = MARGIN + 30

        # Logo block
        self.set_fill_color(*GREEN)
        self.set_text_color(*WHITE)
        self.set_font("Helvetica", "B", 20)
        self.set_xy(MARGIN, y)
        self.cell(18, 18, "ARI", fill=True, align="C")
        y += 28

        # Title
        self.set_text_color(*DARK)
        self.set_font("Helvetica", "B", 28)
        self.set_xy(MARGIN, y)
        self.multi_cell(PAGE_W - 2 * MARGIN, 12, title)
        y = self.get_y() + 4

        # Subtitle (e.g. report_title hook)
        if subtitle:
            self.set_font("Helvetica", "BI", 14)
            self.set_text_color(*TAN)
            self.set_xy(MARGIN, y)
            self.multi_cell(PAGE_W - 2 * MARGIN, 7, subtitle)
            y = self.get_y() + 4

        # Company / domain / industry
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*GREEN)
        self.set_xy(MARGIN, y)
        self.cell(0, 7, company_name)
        y += 8

        self.set_font("Helvetica", "", 10)
        self.set_text_color(*GRAY)
        if domain:
            self.set_xy(MARGIN, y)
            self.cell(0, 5, domain)
            y += 6
        if industry:
            self.set_xy(MARGIN, y)
            self.cell(0, 5, industry)
            y += 10

        # Score box (audit cover)
        if score is not None:
            self.set_fill_color(*GREEN)
            self.set_text_color(*WHITE)
            self.set_xy(MARGIN, y)
            self.set_font("Helvetica", "B", 32)
            self.cell(60, 20, str(score), fill=True, align="C")
            self.set_font("Helvetica", "", 9)
            self.set_xy(MARGIN, y + 20)
            self.cell(60, 5, "ARI Score (0-100)", fill=True, align="C")
            y += 32

        # Severity badge
        if severity_band and severity_display:
            color = SEVERITY_COLORS.get(severity_band, GREEN)
            self.set_fill_color(*color)
            self.set_text_color(*WHITE)
            self.set_font("Helvetica", "B", 11)
            self.set_xy(MARGIN, y)
            self.cell(self.get_string_width(severity_display) + 16, 9, severity_display, fill=True, align="C")
            y += 16

        # Meta lines
        if not date_str:
            date_str = datetime.now().strftime("%B %d, %Y")

        if meta_lines is None:
            meta_lines = []
        meta_lines = [f"Prepared by: Fancy Robot -- fancyrobot.ai", f"Date: {date_str}"] + meta_lines

        self.set_font("Helvetica", "", 9)
        self.set_text_color(*GRAY)
        for line in meta_lines:
            self.set_xy(MARGIN, y)
            self.cell(0, 5, line)
            y += 5.5

    # ── Section header (new page with green underline) ──

    def section_header(self, text: str, new_page: bool = True):
        if new_page:
            self.add_page()
        self.set_font("Helvetica", "B", 17)
        self.set_text_color(*DARK)
        w = PAGE_W - 2 * MARGIN
        self.set_x(MARGIN)
        self.cell(w, 9, text)
        y = self.get_y() + 10
        self.set_draw_color(*GREEN)
        self.set_line_width(0.6)
        self.line(MARGIN, y, PAGE_W - MARGIN, y)
        self.set_y(y + 4)

    # ── Callout box ──

    def callout_box(self, text: str, border_color=TAN, bg_color=CREAM_ALT, bold: bool = True):
        w = PAGE_W - 2 * MARGIN
        x = MARGIN
        y = self.get_y()
        self.set_fill_color(*bg_color)
        font_style = "B" if bold else ""
        self.set_font("Helvetica", font_style, 12)
        self.set_text_color(*DARK)
        # Measure height
        line_h = 6
        nb_lines = self.multi_cell(w - 10, line_h, text, dry_run=True, output="LINES")
        h = len(nb_lines) * line_h + 10
        # Draw background
        self.rect(x, y, w, h, "F")
        # Draw left border
        self.set_fill_color(*border_color)
        self.rect(x, y, 1.5, h, "F")
        # Text
        self.set_xy(x + 6, y + 5)
        self.multi_cell(w - 12, line_h, text)
        self.set_y(y + h + 4)

    # ── Paragraphs (split on double-newline) ──

    def paragraphs(self, text: str, font_size: int = 10):
        if not text:
            return
        self.set_font("Helvetica", "", font_size)
        self.set_text_color(*DARK)
        for para in text.split("\n\n"):
            para = para.strip()
            if para:
                self.set_x(MARGIN)
                self.multi_cell(PAGE_W - 2 * MARGIN, 5, para)
                self.ln(3)

    # ── Sub heading (no page break) ──

    def sub_heading(self, text: str, color=DARK, size: int = 12):
        self.ln(4)
        self.set_font("Helvetica", "B", size)
        self.set_text_color(*color)
        self.set_x(MARGIN)
        self.cell(0, 7, text)
        self.ln(9)

    # ── Data table ──

    def data_table(self, headers: list[str], rows: list[list[str]], col_widths: list[float] | None = None):
        w_total = PAGE_W - 2 * MARGIN
        if col_widths is None:
            col_widths = [w_total / len(headers)] * len(headers)
        else:
            # Normalize to mm (treat as percentages of total)
            col_widths = [w_total * (w / 100) for w in col_widths]

        # Header row
        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(*CREAM_ALT)
        self.set_text_color(*DARK)
        self.set_draw_color(*GREEN)
        self.set_line_width(0.5)
        x0 = MARGIN
        y0 = self.get_y()
        for i, hdr in enumerate(headers):
            self.set_xy(x0, y0)
            self.cell(col_widths[i], 7, hdr, border="B", fill=True)
            x0 += col_widths[i]
        self.ln(7)

        # Data rows
        self.set_font("Helvetica", "", 8)
        self.set_draw_color(*BORDER)
        self.set_line_width(0.25)
        for row in rows:
            x0 = MARGIN
            y0 = self.get_y()
            max_h = 6
            # Measure max height for the row
            for i, cell_text in enumerate(row):
                lines = self.multi_cell(col_widths[i] - 2, 5, cell_text, dry_run=True, output="LINES")
                h = len(lines) * 5 + 1
                if h > max_h:
                    max_h = h
            # Check page break
            if y0 + max_h > PAGE_H - 22:
                self.add_page()
                y0 = self.get_y()
            for i, cell_text in enumerate(row):
                self.set_xy(x0 + 1, y0 + 0.5)
                self.multi_cell(col_widths[i] - 2, 5, cell_text)
                x0 += col_widths[i]
            self.set_draw_color(*BORDER)
            self.line(MARGIN, y0 + max_h, PAGE_W - MARGIN, y0 + max_h)
            self.set_y(y0 + max_h)

    # ── Bar chart row (horizontal bar) ──

    def bar_chart_row(self, label: str, value: float, max_val: float = 100, bar_color=GREEN, label_suffix: str = "%"):
        w_total = PAGE_W - 2 * MARGIN
        label_w = w_total * 0.30
        pct_w = w_total * 0.12
        bar_w = w_total * 0.58

        y = self.get_y()
        # Label
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.set_xy(MARGIN, y)
        self.cell(label_w, 6, label)
        # Percentage
        self.set_xy(MARGIN + label_w, y)
        self.cell(pct_w, 6, f"{value:.0f}{label_suffix}")
        # Bar background
        bar_x = MARGIN + label_w + pct_w
        self.set_fill_color(*BORDER)
        self.rect(bar_x, y + 1, bar_w, 4, "F")
        # Bar fill
        fill_w = min(bar_w * (value / max_val), bar_w) if max_val > 0 else 0
        if fill_w > 0:
            self.set_fill_color(*bar_color)
            self.rect(bar_x, y + 1, fill_w, 4, "F")
        self.set_y(y + 8)

    # ── Finding item (left-bordered text) ──

    def finding_item(self, text: str, border_color=GREEN):
        text = _strip_emoji_badge(text)
        badge_label, badge_color = _detect_badge(text)

        x = MARGIN
        y = self.get_y()
        w = PAGE_W - 2 * MARGIN

        # Print colored badge prefix if detected
        if badge_label:
            text = _strip_badge_prefix(text)
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(*badge_color)
            self.set_xy(x + 5, y + 2)
            self.cell(self.get_string_width(badge_label) + 2, 4, badge_label)
            badge_end_x = self.get_x() + 2
            # Print rest of finding text
            self.set_font("Helvetica", "", 9)
            self.set_text_color(*DARK)
            self.set_xy(badge_end_x, y + 1.5)
            remaining_w = w - (badge_end_x - x) - 2
            lines = self.multi_cell(remaining_w, 5, text, dry_run=True, output="LINES")
            h = max(len(lines) * 5 + 4, 8)
            self.set_xy(badge_end_x, y + 2)
            self.multi_cell(remaining_w, 5, text)
        else:
            self.set_font("Helvetica", "", 9)
            self.set_text_color(*DARK)
            lines = self.multi_cell(w - 8, 5, text, dry_run=True, output="LINES")
            h = max(len(lines) * 5 + 4, 8)
            self.set_xy(x + 5, y + 2)
            self.multi_cell(w - 8, 5, text)

        # Left border
        self.set_fill_color(*border_color)
        self.rect(x, y, 1.2, h, "F")
        self.set_y(y + h + 2)

    # ── Recommendation item (gold border) ──

    def rec_item(self, text: str):
        self.finding_item(text, border_color=TAN)

    # ── Pitch box (dark background) ──

    def pitch_box(self, text: str):
        w = PAGE_W - 2 * MARGIN
        y = self.get_y()
        self.set_font("Helvetica", "", 10)
        lines = self.multi_cell(w - 20, 6, text, dry_run=True, output="LINES")
        h = len(lines) * 6 + 20
        self.set_fill_color(*DARK)
        self.rect(MARGIN, y, w, h, "F")
        self.set_text_color(*CREAM)
        self.set_xy(MARGIN + 10, y + 10)
        self.multi_cell(w - 20, 6, text)
        self.set_y(y + h + 6)

    # ── CTA box (green background) ──

    def cta_box(self, heading: str, body: str):
        w = PAGE_W - 2 * MARGIN
        y = self.get_y()
        self.set_font("Helvetica", "B", 14)
        heading_lines = self.multi_cell(w - 20, 7, heading, dry_run=True, output="LINES")
        self.set_font("Helvetica", "", 10)
        body_lines = self.multi_cell(w - 20, 5, body, dry_run=True, output="LINES")
        h = len(heading_lines) * 7 + len(body_lines) * 5 + 24
        # Green box
        self.set_fill_color(*GREEN)
        self.rect(MARGIN, y, w, h, "F")
        # Heading
        self.set_text_color(*WHITE)
        self.set_font("Helvetica", "B", 14)
        self.set_xy(MARGIN + 10, y + 8)
        self.multi_cell(w - 20, 7, heading)
        # Body
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*CREAM_ALT)
        self.set_x(MARGIN + 10)
        self.multi_cell(w - 20, 5, body)
        self.set_y(y + h + 6)

    # ── Output ──

    def to_bytes(self) -> bytes:
        return bytes(self.output())


# ── Emoji / badge helpers ──

_EMOJI_RE = re.compile(
    r"^[\U0001f534\U0001f7e2\U0001f7e1\u26a0\ufe0f\u2757\u2705\U0001f7e0\U0001f535]+\s*"
)

_BADGE_PREFIX_RE = re.compile(
    r"^(CRITICAL GAP|STRENGTH|OPPORTUNITY|KEY INSIGHT)\s*[:\u2014\u2013-]\s*",
    re.IGNORECASE,
)


def _strip_emoji_badge(text: str) -> str:
    """Remove leading emoji characters from finding text."""
    return _EMOJI_RE.sub("", text).strip()


def _detect_badge(text: str) -> tuple[str | None, tuple[int, int, int]]:
    """Detect CRITICAL GAP / STRENGTH / etc. prefix, return (label, color)."""
    upper = text.upper().lstrip()
    if upper.startswith("CRITICAL GAP"):
        return "[CRITICAL GAP]", SEV_CRITICAL
    if upper.startswith("STRENGTH"):
        return "[STRENGTH]", SEV_STRONG
    if upper.startswith("OPPORTUNITY"):
        return "[OPPORTUNITY]", SEV_BELOW
    if upper.startswith("KEY INSIGHT"):
        return "[KEY INSIGHT]", TAN
    return None, GREEN


def _strip_badge_prefix(text: str) -> str:
    """Remove the CRITICAL GAP / STRENGTH etc. prefix from text."""
    return _BADGE_PREFIX_RE.sub("", text).strip()
