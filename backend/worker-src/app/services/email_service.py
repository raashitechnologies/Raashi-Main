"""
Centralized email service using Resend.

All email sending in the application flows through this module:
    Route/Service → Email Service → Resend API → Recipient

Gracefully skips if Resend is not configured (development).
Never raises exceptions to callers — logs errors and returns silently.
"""
import logging
import asyncio
from typing import Optional

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


# ── Core Send Function ───────────────────────────────────────────────────────

async def send_email(to: str, subject: str, html: str) -> bool:
    """
    Send an email via Resend REST API (Cloudflare Worker compatible).
    """
    settings = get_settings()

    if not settings.resend_configured:
        logger.info("Resend not configured — skipping email to %s: %s", to, subject)
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": settings.EMAIL_FROM,
        "to": [to],
        "subject": subject,
        "html": html
    }

    try:
        # Use Workers-native fetch API (no httpx dependency needed)
        from js import fetch, Headers, Request
        import json as _json

        js_headers = Headers.new({
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        })
        js_request = Request.new(url, {
            "method": "POST",
            "headers": js_headers,
            "body": _json.dumps(payload),
        })
        response = await fetch(js_request)
        if not response.ok:
            logger.error("Resend API error: status=%s", response.status)
            return False
        logger.info("Email sent via Resend API: to=%s subject='%s'", to, subject)
        return True
    except ImportError:
        # Fallback for local development (non-Workers environment)
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                logger.info("Email sent via Resend API (httpx): to=%s subject='%s'", to, subject)
                return True
        except Exception as exc:
            logger.error("Failed to send email via Resend API: to=%s error=%s", to, exc)
            return False
    except Exception as exc:
        logger.error("Failed to send email via Resend API: to=%s subject='%s' error=%s", to, subject, exc)
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
