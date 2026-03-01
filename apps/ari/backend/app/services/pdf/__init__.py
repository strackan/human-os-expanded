"""PDF generation module using fpdf2 (pure Python, works on Vercel serverless)."""

from app.services.pdf import audit_report_pdf, deliverable_pdf, lite_report_pdf

__all__ = ["audit_report_pdf", "deliverable_pdf", "lite_report_pdf"]
