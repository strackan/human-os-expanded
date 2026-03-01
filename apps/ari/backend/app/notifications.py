"""Notifications for the ARI pipeline.

Sends email alerts and logs messages to founder_os.messages
when reports are generated.
"""

import logging
from datetime import datetime, timezone

from app.config import get_settings

logger = logging.getLogger(__name__)


def _get_supabase():
    """Get Supabase client, or None if not configured."""
    settings = get_settings()
    if not settings.has_supabase():
        return None
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_key)


async def notify_report_run(
    domain: str,
    company_name: str,
    score: float | None = None,
    ip_address: str | None = None,
) -> None:
    """Send notifications when a snapshot report is generated.

    1. Sends an email via Resend
    2. Inserts a record into founder_os.messages
    """
    run_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    location = ip_address or "Unknown"

    # 1. Email via Resend
    await _send_report_email(domain, company_name, run_date, score, location)

    # 2. founder_os.messages
    await _log_founder_message(
        subject=f"Fancy Robot Report run - {domain}",
        content=(
            f"A snapshot report was just generated.\n\n"
            f"Domain: {domain}\n"
            f"Company: {company_name}\n"
            f"Score: {score or 'N/A'}\n"
            f"Run date: {run_date}\n"
            f"Location: {location}"
        ),
    )


async def notify_contact_request(
    product: str,
    email: str,
    name: str,
    company: str,
    snapshot_domain: str | None = None,
) -> None:
    """Log a founder_os.message when a contact form is submitted."""
    domain_line = f"\nSnapshot domain: {snapshot_domain}" if snapshot_domain else ""
    await _log_founder_message(
        subject=f"Contact Request received from {email} for {product}",
        content=(
            f"Contact form submission for {product}.\n\n"
            f"Name: {name}\n"
            f"Company: {company}\n"
            f"Email: {email}"
            f"{domain_line}"
        ),
    )


async def notify_promo_redeemed(code: str, domain: str | None = None) -> None:
    """Send notifications when a promo code is redeemed."""
    domain_line = f" for {domain}" if domain else ""
    await _send_promo_email(code, domain)
    await _log_founder_message(
        subject=f"Promo code {code} redeemed{domain_line}",
        content=(
            f"A promo code was just redeemed on Fancy Robot.\n\n"
            f"Code: {code}\n"
            f"Domain: {domain or 'N/A'}"
        ),
    )


async def _send_promo_email(code: str, domain: str | None) -> None:
    """Send a promo code redemption email via Resend."""
    settings = get_settings()
    if not settings.has_resend():
        return

    try:
        import resend
        resend.api_key = settings.resend_api_key

        domain_line = f"<p><strong>Domain:</strong> {domain}</p>" if domain else ""

        resend.Emails.send({
            "from": "Fancy Robot <onboarding@resend.dev>",
            "to": "strackan@gmail.com",
            "subject": f"Promo code {code} redeemed on Fancy Robot",
            "html": (
                f"<h2>Promo Code Redeemed</h2>"
                f"<p><strong>Code:</strong> {code}</p>"
                f"{domain_line}"
            ),
        })
        logger.info(f"Promo redemption email sent for code {code}")
    except Exception as e:
        logger.warning(f"Failed to send promo email: {e}")


async def _send_report_email(
    domain: str,
    company_name: str,
    run_date: str,
    score: float | None,
    location: str,
) -> None:
    """Send a report notification email via Resend."""
    settings = get_settings()
    if not settings.has_resend():
        logger.debug("Resend not configured; skipping report email")
        return

    try:
        import resend
        resend.api_key = settings.resend_api_key

        score_line = f"<p><strong>ARI Score:</strong> {score:.0f}/100</p>" if score else ""

        resend.Emails.send({
            "from": "Fancy Robot <onboarding@resend.dev>",
            "to": "strackan@gmail.com",
            "subject": f"A report has just been run on Fancy Robot",
            "html": (
                f"<h2>Snapshot Report Generated</h2>"
                f"<p><strong>Domain:</strong> {domain}</p>"
                f"<p><strong>Company:</strong> {company_name}</p>"
                f"{score_line}"
                f"<p><strong>Run date:</strong> {run_date}</p>"
                f"<p><strong>Location:</strong> {location}</p>"
            ),
        })
        logger.info(f"Report notification email sent for {domain}")
    except Exception as e:
        logger.warning(f"Failed to send report email: {e}")


async def _log_founder_message(subject: str, content: str) -> None:
    """Insert a message into founder_os.messages."""
    client = _get_supabase()
    if not client:
        logger.debug("Supabase not configured; skipping founder message")
        return

    try:
        client.schema("founder_os").table("messages").insert({
            "from_forest": "product:fancy-robot",
            "from_name": "Fancy Robot",
            "to_forest": "founder:justin",
            "to_name": "Justin Strackany",
            "subject": subject,
            "content": content,
            "status": "pending",
        }).execute()
        logger.info(f"Logged founder message: {subject}")
    except Exception as e:
        logger.warning(f"Failed to log founder message: {e}")
