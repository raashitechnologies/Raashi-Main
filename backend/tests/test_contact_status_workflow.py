"""Regression coverage for contact-enquiry status notifications."""
import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "worker-src"))

from app.api.v1.endpoints import admin, coordinator  # noqa: E402
from app.schemas import ContactStatusUpdate  # noqa: E402
from app.services import email_service  # noqa: E402
from app.core.audit_presentation import canonical_audit, contact_label  # noqa: E402


class _ContactRepo:
    def __init__(self):
        self.contact = {
            "id": "contact-1", "full_name": "Ada Lovelace",
            "email": "ada@example.com", "subject": "Internship",
            "status": "new", "notes": [],
        }
        self.notes = []

    async def update_status(self, contact_id, status, handled_by=""):
        if contact_id != self.contact["id"]:
            return False
        self.contact["status"] = status
        self.contact["handled_by"] = handled_by
        return True

    async def add_follow_up(self, contact_id, note, user_id):
        self.notes.append((contact_id, note, user_id))
        return True

    async def get_by_id(self, contact_id):
        return dict(self.contact) if contact_id == self.contact["id"] else None


class _Audit:
    def __init__(self):
        self.entries = []

    async def log(self, *entry, **kwargs):
        self.entries.append((entry, kwargs))


class ContactStatusWorkflowTests(unittest.TestCase):
    def test_audit_presentation_preserves_historical_labels_without_ids(self):
        label, summary, action_label = canonical_audit(
            "status_resolved", "contacts", "General Enquiry — Ada",
            'Changed contact enquiry "General Enquiry — Ada" from New to Resolved',
        )
        self.assertEqual(label, "General Enquiry — Ada")
        self.assertEqual(action_label, "Status Updated")
        self.assertIn("from New to Resolved", summary)

        deleted_label, deleted_summary, _ = canonical_audit("delete", "careers", "SDE")
        self.assertEqual(deleted_label, "SDE")
        self.assertEqual(deleted_summary, 'Permanently deleted job "SDE"')

    def test_legacy_audit_events_have_safe_non_id_fallbacks(self):
        label, summary, _ = canonical_audit("update", "domains")
        self.assertEqual(label, "Resource no longer available")
        self.assertNotIn("uuid", summary.lower())
        self.assertEqual(
            contact_label({"subject": "Collaboration", "full_name": "Ada"}),
            "Collaboration — Ada",
        )

    def test_all_canonical_contact_statuses_are_accepted(self):
        for status in ("new", "in_progress", "responded", "resolved", "closed"):
            self.assertEqual(ContactStatusUpdate(status=status).status, status)

    def test_status_email_is_contact_specific_and_excludes_internal_notes(self):
        async def run():
            with patch.object(email_service, "send_email", new=AsyncMock(return_value=True)) as send:
                sent = await email_service.send_contact_status_update_email(
                    "ada@example.com", "Ada", "Internship", "responded",
                )
            self.assertTrue(sent)
            self.assertEqual(send.await_args.kwargs["to"], "ada@example.com")
            self.assertIn("Contact Enquiry Update: Responded", send.await_args.kwargs["subject"])
            self.assertIn("Internship", send.await_args.kwargs["html"])
            self.assertNotIn("internal-only note", send.await_args.kwargs["html"])

        asyncio.run(run())

    def test_admin_update_persists_and_audits_when_email_fails(self):
        async def run():
            repo, audit = _ContactRepo(), _Audit()
            with patch.object(email_service, "send_contact_status_update_email", new=AsyncMock(return_value=False)) as email:
                result = await admin.update_contact_status(
                    "contact-1", ContactStatusUpdate(status="in_progress", note="internal-only note"),
                    None, {"id": "admin-1", "email": "admin@example.com"}, repo, audit,
                )
            self.assertEqual(result["status"], "updated")
            self.assertEqual(result["notification"], "failed")
            self.assertEqual(repo.contact["status"], "in_progress")
            self.assertEqual(repo.notes, [("contact-1", "internal-only note", "admin-1")])
            self.assertEqual(audit.entries[0][0][2:4], ("status_in_progress", "contacts"))
            self.assertEqual(audit.entries[0][1]["resource_label"], "Internship — Ada Lovelace")
            self.assertIn("from New to In Progress", audit.entries[0][1]["summary"])
            email.assert_awaited_once_with(
                to_email="ada@example.com", contact_name="Ada Lovelace",
                subject="Internship", new_status="in_progress",
            )

        asyncio.run(run())

    def test_coordinator_update_returns_persisted_contact_and_sends_once(self):
        async def run():
            repo, audit = _ContactRepo(), _Audit()
            with patch.object(email_service, "send_contact_status_update_email", new=AsyncMock(return_value=True)) as email:
                result = await coordinator.update_contact_status(
                    "contact-1", ContactStatusUpdate(status="responded"),
                    None, {"id": "coord-1", "email": "coord@example.com"}, repo, audit,
                )
            self.assertEqual(result["contact"]["status"], "responded")
            self.assertEqual(result["notification"], "sent")
            email.assert_awaited_once()

        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
