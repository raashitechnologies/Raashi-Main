"""Canonical, privacy-safe presentation snapshots for audit history."""

RESOURCE_NAMES = {
    "domains": "Domain", "contacts": "Contact Enquiry", "careers": "Job Opening",
    "internships": "Internship Listing", "internship_applications": "Internship Application",
    "career_applications": "Career Application", "website_content": "Website Content",
    "users": "User", "policies": "Policy", "brochure": "Brochure",
}
STATUS_NAMES = {
    "new": "New", "in_progress": "In Progress", "responded": "Responded", "resolved": "Resolved", "closed": "Closed",
    "submitted": "Submitted", "received": "Received", "under_review": "Under Review", "shortlisted": "Shortlisted",
    "rejected": "Rejected", "accepted": "Accepted", "on_hold": "On Hold",
}
ACTION_NAMES = {
    "create": "Created", "update": "Updated", "delete": "Deleted", "deactivate": "Deactivated",
    "activated": "Activated", "deactivated": "Deactivated", "published": "Published", "unpublished": "Unpublished",
    "upload": "Uploaded", "add_remark": "Added remark", "close": "Closed", "reopen": "Reopened",
    "CREATE_POLICY_DRAFT": "Created policy draft", "UPDATE_POLICY_DRAFT": "Updated policy draft", "PUBLISH_POLICY": "Published policy",
}
CONTENT_NAMES = {"about_page": "About Us", "homepage": "Home Page"}

def status_label(value: str | None) -> str:
    return STATUS_NAMES.get(value or "", (value or "Unknown").replace("_", " ").title())

def resource_type_label(resource: str) -> str:
    return RESOURCE_NAMES.get(resource, resource.replace("_", " ").title())

def content_label(key: str) -> str:
    return CONTENT_NAMES.get(key, key.replace("_", " ").title())

def contact_label(contact: dict) -> str:
    subject = contact.get("subject") or "General Enquiry"
    name = contact.get("full_name") or contact.get("name") or "Unknown sender"
    return f"{subject} — {name}"

def application_label(application: dict, kind: str) -> str:
    name = application.get("full_name") or application.get("name") or "Unknown applicant"
    position = application.get("position") or application.get("domain_slug", "").replace("-", " ").title()
    return f"{name} — {position}" if position else name

def canonical_audit(action: str, resource: str, resource_label: str = "", summary: str = "", details: str = "") -> tuple[str, str, str]:
    """Return immutable (label, summary, action_label) without exposing raw IDs."""
    action_label = "Status Updated" if action.startswith("status_") else ACTION_NAMES.get(action, action.replace("_", " ").title())
    label = resource_label.strip()
    if not label and resource == "website_content":
        label = content_label(details.rsplit(":", 1)[-1].strip()) if details else "Website content"
    if not label and details and ":" in details:
        label = details.rsplit(":", 1)[-1].strip()
    label = label or "Resource no longer available"
    if summary:
        return label, summary, action_label
    if details and not details.lower().startswith(("updated content:", "updated draft ")):
        return label, details.replace(": ", ' "', 1) + ('"' if ": " in details else ""), action_label
    if action.startswith("status_"):
        return label, f"Changed {resource_type_label(resource).lower()} \"{label}\" status to {status_label(action[7:])}", action_label
    if action == "delete" and resource == "careers":
        return label, f"Permanently deleted job \"{label}\"", action_label
    return label, f"{action_label} {resource_type_label(resource).lower()} \"{label}\"", action_label
