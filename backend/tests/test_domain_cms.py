"""Regression coverage for canonical Domain CMS persistence.

These tests use a small D1-shaped fake so they exercise the repository's SQL
mapping without requiring a deployed Worker or production database.
"""
import asyncio
import copy
import json
import sys
import types
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "worker-src"))

# repositories/__init__.py re-exports PolicyRepository at its end. The policy
# implementation imports the Worker-only Pydantic wasm extension, which is not
# loadable by CPython. It is unrelated to these D1 repository tests.
policy_stub = types.ModuleType("app.repositories.policies")
policy_stub.PolicyRepository = object
sys.modules["app.repositories.policies"] = policy_stub

from app.repositories import DomainRepository
from app.services import indexnow


def sample_row():
    return {
        "id": "domain-artificial-intelligence",
        "slug": "artificial-intelligence",
        "name": "Original name",
        "display_order": 1,
        "short_name": "Original short name",
        "tagline": "Original tagline",
        "description": "Original description is long enough.",
        "accent_color": "#0560DF",
        "seo_title": "Original SEO title",
        "seo_description": "Original SEO description",
        "seo_image": "https://example.com/original.png",
        "overview_json": json.dumps({"heading": "Overview", "paragraphs": ["Original paragraph"], "image_url": "https://example.com/overview.png"}),
        "hero_json": json.dumps({"heading": "Hero", "description": "Original hero", "image_url": "https://example.com/hero.png"}),
        "offers_json": json.dumps({"cards": [{"title": "Original offer", "description": "Original offer description"}]}),
        "tech_json": json.dumps({"items": ["Original technology"]}),
        "apps_json": json.dumps({"items": ["Original application"]}),
        "why_json": json.dumps({"cards": [{"title": "Original reason", "description": "Original reason description", "icon": "Check", "order": 0, "enabled": True}]}),
        "internship_json": json.dumps({"heading": "Original internship", "checklist": ["Original checklist"], "cta_label": "Apply", "cta_link": "/apply"}),
        "future_json": json.dumps({"enabled": True, "heading": "Original future", "description": "Original future description"}),
        "faqs_json": json.dumps({"items": [{"question": "Original question", "answer": "Original answer"}]}),
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-01-01T00:00:00+00:00",
    }


class FakeStatement:
    def __init__(self, db, query):
        self.db, self.query, self.values = db, query, []

    def bind(self, *values):
        self.values = list(values)
        return self

    async def first(self):
        if "WHERE slug" in self.query:
            return copy.deepcopy(self.db.row) if self.db.row["slug"] == self.values[0] else None
        return copy.deepcopy(self.db.row) if self.db.row["id"] == self.values[0] else None

    async def all(self):
        return {"results": [copy.deepcopy(self.db.row)]}

    async def run(self):
        if not self.query.startswith("UPDATE domains SET"):
            return {"meta": {"changes": 0}}
        assignments = self.query.split(" SET ", 1)[1].rsplit(" WHERE", 1)[0].split(", ")
        for assignment, value in zip(assignments, self.values):
            column = assignment.split(" =", 1)[0]
            self.db.row[column] = value
        return {"meta": {"changes": 1}}


class FakeD1:
    def __init__(self):
        self.row = sample_row()

    def prepare(self, query):
        return FakeStatement(self, query)


class DomainRepositoryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.db = FakeD1()
        self.repo = DomainRepository(self.db)

    async def test_every_cms_field_can_be_updated_independently_without_loss(self):
        changes = {
            "name": "Changed name",
            "short_name": "Changed short name",
            "tagline": "Changed tagline",
            "description": "Changed description is long enough.",
            "accent_color": "#123456",
            "order": 7,
            "seo_title": "Changed SEO title",
            "seo_description": "Changed SEO description",
            "seo_image": "https://example.com/changed.png",
            "hero": {"heading": "Changed hero", "description": "Changed hero description", "image_url": "https://example.com/hero-new.png"},
            "overview": {"heading": "Changed overview", "paragraphs": ["Changed paragraph"], "image_url": "https://example.com/overview-new.png"},
            "offer_section": {"cards": [{"title": "Changed offer", "description": "Changed offer description"}]},
            "tech_section": {"items": ["Changed technology"]},
            "apps_section": {"items": ["Changed application"]},
            "why_section": {"cards": [{"title": "Changed reason", "description": "Changed reason description", "icon": "Check", "order": 0, "enabled": True}]},
            "internship": {"heading": "Changed internship", "checklist": ["Changed checklist"], "cta_label": "Apply", "cta_link": "/apply"},
            "future_services": {"enabled": False, "heading": "Changed future", "description": "Changed future description"},
            "faq_section": {"items": [{"question": "Changed question", "answer": "Changed answer"}]},
        }
        for field, value in changes.items():
            with self.subTest(field=field):
                before = await self.repo.get_by_id("domain-artificial-intelligence")
                self.assertTrue(await self.repo.update("domain-artificial-intelligence", {field: value}))
                after = await self.repo.get_by_id("domain-artificial-intelligence")
                self.assertEqual(after[field], value)
                # A scalar update cannot erase section/image state, and a section
                # replacement cannot affect any unrelated canonical field.
                for preserved in ("name", "short_name", "tagline", "description", "accent_color", "order", "hero", "overview", "offer_section", "tech_section", "apps_section", "why_section", "internship", "future_services", "faq_section"):
                    if preserved != field:
                        self.assertEqual(after[preserved], before[preserved])

    async def test_sequential_and_reverse_order_updates_survive_readback(self):
        sequence = [("name", "First"), ("tagline", "Second"), ("seo_title", "Third")]
        for field, value in sequence:
            await self.repo.update(self.db.row["id"], {field: value})
        for field, value in reversed(sequence):
            await self.repo.update(self.db.row["id"], {field: f"{value} reverse"})
        domain = await self.repo.get_by_slug("artificial-intelligence")
        self.assertEqual(domain["name"], "First reverse")
        self.assertEqual(domain["tagline"], "Second reverse")
        self.assertEqual(domain["seo_title"], "Third reverse")
        self.assertEqual(domain["overview"]["image_url"], "https://example.com/overview.png")

    async def test_read_shape_is_canonical_and_ordered(self):
        domain = await self.repo.get_by_id(self.db.row["id"])
        self.assertEqual(domain["order"], 1)
        self.assertIn("offer_section", domain)
        self.assertIn("faq_section", domain)
        self.assertNotIn("offers", domain)
        self.assertNotIn("display_order", domain)


class IndexNowIsolationTests(unittest.TestCase):
    def test_indexnow_failure_is_isolated(self):
        original = indexnow.notify_indexnow

        async def fail(_urls):
            raise RuntimeError("simulated JS interop failure")

        indexnow.notify_indexnow = fail
        try:
            asyncio.run(indexnow.trigger_indexnow_background(["https://raashitech.com/domains/artificial-intelligence"]))
        finally:
            indexnow.notify_indexnow = original


if __name__ == "__main__":
    unittest.main()
