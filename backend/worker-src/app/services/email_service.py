"""
Centralized email service using Resend.

All email sending in the application flows through this module:
    Route/Service → Email Service → Resend API → Recipient

Gracefully skips if Resend is not configured (development).
Never raises exceptions to callers — logs errors and returns silently.
"""
import logging
from html import escape
from collections.abc import Sequence
from typing import Any, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


# ── HTML Template Helpers ────────────────────────────────────────────────────

def _base_template(content: str) -> str:
    """Wrap email content in Raashi CT branded HTML template."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
               style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                Raashi Cognitive Technologies
              </h1>
              <p style="margin:4px 0 0;color:#a0c4ff;font-size:13px;font-weight:400;">
                Empowering Innovation Through Technology
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              {content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:20px 32px;border-top:1px solid #e9ecef;text-align:center;">
              <p style="margin:0;color:#6c757d;font-size:12px;">
                &copy; Raashi Cognitive Technologies Pvt. Ltd.<br>
                This is an automated message. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _info_row(label: str, value: str) -> str:
    """Create a styled key-value row for notification emails."""
    return (
        f'<tr>'
        f'<td style="padding:6px 12px 6px 0;color:#6c757d;font-size:14px;white-space:nowrap;">{label}</td>'
        f'<td style="padding:6px 0;color:#212529;font-size:14px;">{value}</td>'
        f'</tr>'
    )


def _button(url: str, text: str) -> str:
    """Create a styled CTA button."""
    return (
        f'<div style="text-align:center;margin:28px 0;">'
        f'<a href="{url}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0f3460,#1a1a2e);'
        f'color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">'
        f'{text}</a>'
        f'</div>'
    )


def _status_color(status: str) -> str:
    """Return a color for the application status badge."""
    colors = {
        "submitted": "#0d6efd",
        "received": "#0d6efd",
        "under_review": "#fd7e14",
        "shortlisted": "#198754",
        "accepted": "#198754",
        "rejected": "#dc3545",
        "on_hold": "#6c757d",
    }
    return colors.get(status.lower(), "#6c757d")


def _status_label(status: str) -> str:
    """Human-readable status label."""
    return status.replace("_", " ").title()


def _contact_status_color(status: str) -> str:
    """Return a badge colour for a contact-enquiry status."""
    colors = {
        "new": "#0d6efd",
        "in_progress": "#fd7e14",
        "responded": "#6f42c1",
        "resolved": "#198754",
        "closed": "#6c757d",
    }
    return colors.get(status.lower(), "#6c757d")


# ── Core Send Function ───────────────────────────────────────────────────────

def _build_resend_payload(
    to: str | Sequence[str],
    subject: str,
    html: str,
    *,
    reply_to: str | None = None,
    attachments: Sequence[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Build a Resend REST payload; Resend always receives a list of recipients."""
    settings = get_settings()
    recipients = [to] if isinstance(to, str) else list(to)
    if not recipients or any(not recipient for recipient in recipients):
        raise ValueError("At least one non-empty email recipient is required")

    payload: dict[str, Any] = {
        "from": settings.EMAIL_FROM,
        "to": recipients,
        "subject": subject,
        "html": html,
    }
    if reply_to:
        payload["reply_to"] = reply_to
    if attachments:
        payload["attachments"] = list(attachments)
    return payload


async def send_email(
    to: str | Sequence[str],
    subject: str,
    html: str,
    *,
    reply_to: str | None = None,
    attachments: Sequence[dict[str, Any]] | None = None,
) -> bool:
    """Send an email through Resend's HTTPS API using the Worker-safe httpx path."""
    settings = get_settings()

    if not settings.resend_configured:
        logger.info("Resend not configured — skipping email to %s: %s", to, subject)
        return False

    payload = _build_resend_payload(
        to, subject, html, reply_to=reply_to, attachments=attachments,
    )
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
            response = await client.post(
                "https://api.resend.com/emails", headers=headers, json=payload,
            )
        response.raise_for_status()
        logger.info("Email sent via Resend REST API: to=%s subject=%r", payload["to"], subject)
        return True
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Resend REST API rejected email: status=%s to=%s subject=%r",
            exc.response.status_code, payload["to"], subject,
        )
    except httpx.HTTPError:
        logger.exception("Resend REST API transport error: to=%s subject=%r", payload["to"], subject)
    except Exception:
        logger.exception("Unexpected Resend REST API error: to=%s subject=%r", payload["to"], subject)
    return False

async def send_notification(subject: str, html: str) -> bool:
    """Send a notification email to the configured NOTIFY_EMAIL address."""
    settings = get_settings()
    return await send_email(settings.NOTIFY_EMAIL, subject, html)


# ── Workflow-Specific Email Functions ────────────────────────────────────────


async def send_contact_notification(
    full_name: str, email: str, phone: str, subject: str, message: str,
) -> bool:
    """Workflow 1: Contact form submission → Admin notification."""
    rows = (
        _info_row("Name", full_name)
        + _info_row("Email", f'<a href="mailto:{email}" style="color:#0f3460;">{email}</a>')
        + _info_row("Phone", phone or "N/A")
        + _info_row("Subject", subject)
    )

    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">📬 New Contact Message</h2>
<p style="margin:0 0 20px;color:#6c757d;font-size:14px;">A visitor has submitted a contact form on the website.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
  {rows}
</table>
<div style="background-color:#f8f9fa;border-left:4px solid #0f3460;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0 0 4px;color:#6c757d;font-size:12px;font-weight:600;text-transform:uppercase;">Message</p>
  <p style="margin:0;color:#212529;font-size:14px;line-height:1.6;">{message}</p>
</div>"""

    return await send_notification(
        subject=f"[Raashi CT] New Contact Message — {subject}",
        html=_base_template(content),
    )


async def send_contact_status_update_email(
    to_email: str,
    contact_name: str,
    subject: str,
    new_status: str,
) -> bool:
    """Notify a contact-form sender of a persisted enquiry-status change.

    This deliberately uses contact-enquiry wording rather than the application
    status template.  It never includes the internal follow-up note.
    """
    if not to_email:
        logger.warning("Cannot send contact status email: contact has no email")
        return False

    messages = {
        "new": "Your enquiry has been received and is currently recorded with our team.",
        "in_progress": "Our team is currently reviewing your enquiry and working on the next steps.",
        "responded": "Our team has responded to your enquiry. Please check your email or reply to our team if you need further assistance.",
        "resolved": "Your enquiry has been marked as resolved by our team. If you still need assistance, please contact us again.",
        "closed": "Your enquiry has been closed by our team. If you have another question or need further assistance, please feel free to contact us again.",
    }
    label = _status_label(new_status)
    color = _contact_status_color(new_status)
    safe_name = escape(contact_name or "there")
    safe_subject = escape(subject or "General Enquiry")
    message = escape(messages.get(new_status.lower(), "Your enquiry status has been updated by our team."))

    content = f"""\
<h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Contact Enquiry Status Update</h2>
<p style="margin:0 0 16px;color:#495057;font-size:15px;line-height:1.6;">Dear <strong>{safe_name}</strong>,</p>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">We have an update regarding your enquiry submitted to Raashi Cognitive Technologies.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
  {_info_row("Enquiry", safe_subject)}
</table>
<div style="display:inline-block;background-color:{color};color:#ffffff;padding:7px 14px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:16px;">{escape(label)}</div>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">{message}</p>
<p style="margin:0;color:#495057;font-size:15px;line-height:1.6;">If you have any further questions, please feel free to contact us.</p>"""

    return await send_email(
        to=to_email,
        subject=f"Contact Enquiry Update: {label} — Raashi Cognitive Technologies",
        html=_base_template(content),
    )


async def send_internship_notification(
    full_name: str, email: str, phone: str, domain_slug: str,
    mode: str, college: Optional[str] = None,
    course_year: Optional[str] = None, message: Optional[str] = None,
) -> bool:
    """Workflow 2: Internship application → Admin notification."""
    rows = (
        _info_row("Applicant", full_name)
        + _info_row("Email", f'<a href="mailto:{email}" style="color:#0f3460;">{email}</a>')
        + _info_row("Phone", phone)
        + _info_row("Domain", domain_slug.replace("-", " ").title())
        + _info_row("Mode", mode)
        + _info_row("College", college or "N/A")
        + _info_row("Course/Year", course_year or "N/A")
    )

    message_block = ""
    if message:
        message_block = f"""\
<div style="background-color:#f8f9fa;border-left:4px solid #0f3460;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0 0 4px;color:#6c757d;font-size:12px;font-weight:600;text-transform:uppercase;">Cover Message</p>
  <p style="margin:0;color:#212529;font-size:14px;line-height:1.6;">{message}</p>
</div>"""

    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">🎓 New Internship Application</h2>
<p style="margin:0 0 20px;color:#6c757d;font-size:14px;">A new internship application has been submitted.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
  {rows}
</table>
{message_block}"""

    return await send_notification(
        subject=f"[Raashi CT] New Internship Application — {full_name}",
        html=_base_template(content),
    )


async def send_career_notification(
    full_name: str, email: str, phone: str, position: str,
    portfolio_url: Optional[str] = None, message: Optional[str] = None,
) -> bool:
    """Workflow 3: Career application → Admin notification."""
    portfolio_display = "N/A"
    if portfolio_url:
        portfolio_display = f'<a href="{portfolio_url}" style="color:#0f3460;">{portfolio_url}</a>'

    rows = (
        _info_row("Applicant", full_name)
        + _info_row("Email", f'<a href="mailto:{email}" style="color:#0f3460;">{email}</a>')
        + _info_row("Phone", phone)
        + _info_row("Position", position)
        + _info_row("Portfolio", portfolio_display)
    )

    message_block = ""
    if message:
        message_block = f"""\
<div style="background-color:#f8f9fa;border-left:4px solid #0f3460;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0 0 4px;color:#6c757d;font-size:12px;font-weight:600;text-transform:uppercase;">Cover Message</p>
  <p style="margin:0;color:#212529;font-size:14px;line-height:1.6;">{message}</p>
</div>"""

    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">💼 New Career Application</h2>
<p style="margin:0 0 20px;color:#6c757d;font-size:14px;">A new career application has been submitted.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
  {rows}
</table>
{message_block}"""

    return await send_notification(
        subject=f"[Raashi CT] New Career Application — {position}",
        html=_base_template(content),
    )


async def send_verification_email(to_email: str, verify_url: str, expiry_hours: int = 24) -> bool:
    """Workflow 4: Email verification → User email."""
    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">✉️ Verify Your Email</h2>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  Welcome to <strong>Raashi Cognitive Technologies</strong>! Please verify your email address by clicking the button below.
</p>
{_button(verify_url, "Verify Email Address")}
<p style="margin:0 0 8px;color:#6c757d;font-size:13px;">
  This link expires in <strong>{expiry_hours} hours</strong>.
</p>
<p style="margin:0;color:#6c757d;font-size:13px;">
  If you didn't create an account, you can safely ignore this email.
</p>
<hr style="border:none;border-top:1px solid #e9ecef;margin:24px 0;">
<p style="margin:0;color:#adb5bd;font-size:12px;">
  If the button doesn't work, copy and paste this link into your browser:<br>
  <a href="{verify_url}" style="color:#0f3460;word-break:break-all;">{verify_url}</a>
</p>"""

    return await send_email(
        to=to_email,
        subject="Verify Your Email — Raashi Cognitive Technologies",
        html=_base_template(content),
    )


async def send_password_reset_email(to_email: str, reset_url: str, expiry_minutes: int = 15) -> bool:
    """Workflow 5: Password reset → User email."""
    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">🔐 Password Reset Request</h2>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  We received a request to reset your password for your <strong>Raashi Cognitive Technologies</strong> account.
  Click the button below to set a new password.
</p>
{_button(reset_url, "Reset Password")}
<p style="margin:0 0 8px;color:#6c757d;font-size:13px;">
  This link expires in <strong>{expiry_minutes} minutes</strong>.
</p>
<p style="margin:0;color:#6c757d;font-size:13px;">
  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
</p>
<hr style="border:none;border-top:1px solid #e9ecef;margin:24px 0;">
<p style="margin:0;color:#adb5bd;font-size:12px;">
  If the button doesn't work, copy and paste this link into your browser:<br>
  <a href="{reset_url}" style="color:#0f3460;word-break:break-all;">{reset_url}</a>
</p>"""

    return await send_email(
        to=to_email,
        subject="Password Reset — Raashi Cognitive Technologies",
        html=_base_template(content),
    )


async def send_welcome_email(to_email: str, name: str, role: str, login_url: str) -> bool:
    """Workflow 6: New account creation → Welcome/setup email to new user."""
    role_display = role.replace("_", " ").title()

    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">🎉 Welcome to Raashi Cognitive Technologies</h2>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  Hello <strong>{name}</strong>,
</p>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  Your <strong>{role_display}</strong> account has been created on the Raashi Cognitive Technologies platform.
  You can now log in to access your dashboard.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
  {_info_row("Name", name)}
  {_info_row("Email", to_email)}
  {_info_row("Role", role_display)}
</table>
{_button(login_url, "Log In to Your Account")}
<div style="background-color:#fff3cd;border-left:4px solid #ffc107;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;color:#664d03;font-size:13px;">
    <strong>Security Tip:</strong> If you received a separate verification email, please verify your email address first.
    Keep your credentials secure and do not share them.
  </p>
</div>"""

    return await send_email(
        to=to_email,
        subject="Welcome to Raashi Cognitive Technologies — Account Created",
        html=_base_template(content),
    )


async def send_status_update_email(
    to_email: str, candidate_name: str, application_type: str,
    position_or_domain: str, new_status: str,
) -> bool:
    """Workflow 7: Application status update → Candidate notification."""
    status_label = _status_label(new_status)
    color = _status_color(new_status)
    app_type_display = application_type.replace("_", " ").title()

    # Status-specific messaging
    status_messages = {
        "under_review": "Your application is currently being reviewed by our team. We will update you once a decision is made.",
        "shortlisted": "Congratulations! Your application has been shortlisted. Our team will reach out to you shortly with next steps.",
        "accepted": "Congratulations! We are delighted to inform you that your application has been accepted. Our team will contact you soon with onboarding details.",
        "rejected": "After careful consideration, we regret to inform you that we are unable to proceed with your application at this time. We encourage you to apply again in the future.",
        "on_hold": "Your application has been placed on hold. We will update you once there are further developments.",
    }
    # Default messages for other statuses
    default_message = f"Your application status has been updated to <strong>{status_label}</strong>."
    message_text = status_messages.get(new_status.lower(), default_message)

    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">📋 Application Status Update</h2>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  Dear <strong>{candidate_name}</strong>,
</p>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  We have an update regarding your <strong>{app_type_display}</strong> application
  for <strong>{position_or_domain}</strong> at Raashi Cognitive Technologies.
</p>
<div style="text-align:center;margin:24px 0;">
  <span style="display:inline-block;padding:10px 24px;background-color:{color};color:#ffffff;
               border-radius:24px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
    {status_label}
  </span>
</div>
<div style="background-color:#f8f9fa;border-left:4px solid {color};padding:16px;border-radius:0 8px 8px 0;margin:20px 0;">
  <p style="margin:0;color:#212529;font-size:14px;line-height:1.6;">
    {message_text}
  </p>
</div>
<p style="margin:20px 0 0;color:#6c757d;font-size:13px;">
  If you have any questions, please don't hesitate to reach out to us.
</p>"""

    return await send_email(
        to=to_email,
        subject=f"Application Update: {status_label} — Raashi Cognitive Technologies",
        html=_base_template(content),
    )


async def send_application_thank_you_email(
    to_email: str, applicant_name: str, application_type: str,
) -> bool:
    """Workflow 8: Thank-you/confirmation email to applicant after successful submission."""
    app_type_display = application_type.replace("_", " ").title()

    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">Thank You for Your Application</h2>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  Dear <strong>{applicant_name}</strong>,
</p>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  Thank you for submitting your {app_type_display.lower()} application to <strong>Raashi Cognitive Technologies</strong>.
</p>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  We have successfully received your application and our team will review the information provided.
</p>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  We appreciate your interest in the opportunity and will contact you if further information or action is required.
</p>
<p style="margin:20px 0 0;color:#495057;font-size:15px;line-height:1.6;">
  Best regards,<br>
  <strong>Raashi Cognitive Technologies</strong>
</p>"""

    return await send_email(
        to=to_email,
        subject="Thank You for Your Application — Raashi Cognitive Technologies",
        html=_base_template(content),
    )


async def send_contact_thank_you_email(to_email: str, contact_name: str) -> bool:
    """Workflow 9: Thank-you/confirmation email to user after contact form submission."""
    content = f"""\
<h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">Thank You for Contacting Us</h2>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  Dear <strong>{contact_name}</strong>,
</p>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  Thank you for contacting <strong>Raashi Cognitive Technologies</strong>.
</p>
<p style="margin:0 0 20px;color:#495057;font-size:15px;line-height:1.6;">
  We have successfully received your message. Our team will review your enquiry and get back to you if a response is required.
</p>
<p style="margin:20px 0 0;color:#495057;font-size:15px;line-height:1.6;">
  Best regards,<br>
  <strong>Raashi Cognitive Technologies</strong>
</p>"""

    return await send_email(
        to=to_email,
        subject="Thank You for Contacting Us — Raashi Cognitive Technologies",
        html=_base_template(content),
    )
