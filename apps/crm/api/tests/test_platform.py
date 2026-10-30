import os
from unittest import TestCase, mock

from crm_api.auth import AuthenticatedUser
from crm_api.platform import AuthorizationError, CommandError, PlatformService
from crm_api.storage import MemoryStore


NOW = "2026-10-29T12:00:00Z"


def user(object_id: str = "owner-id") -> AuthenticatedUser:
    return AuthenticatedUser("tenant-id", object_id, "Test Owner", "owner@example.com")


class PlatformServiceTests(TestCase):
    def setUp(self) -> None:
        self.store = MemoryStore()
        self.service = PlatformService(self.store, clock=lambda: NOW)

    @mock.patch.dict(os.environ, {"CRM_BOOTSTRAP_OWNER_OBJECT_ID": "owner-id"}, clear=True)
    def test_bootstraps_owner_and_reuses_membership(self) -> None:
        first = self.service.establish_session(user())
        second = self.service.establish_session(user())

        self.assertEqual(first.organization_id, second.organization_id)
        self.assertEqual(first.role, "admin")
        self.assertEqual(
            len([key for key in self.store.entities if key[0] == "Organizations"]), 1
        )
        self.assertEqual(
            len([key for key in self.store.entities if key[0] == "LoginAudit"]), 2
        )

    @mock.patch.dict(os.environ, {"CRM_BOOTSTRAP_OWNER_OBJECT_ID": "owner-id"}, clear=True)
    def test_rejects_same_tenant_user_without_membership(self) -> None:
        with self.assertRaisesRegex(AuthorizationError, "not been added"):
            self.service.establish_session(user("other-id"))

    @mock.patch.dict(os.environ, {"CRM_BOOTSTRAP_OWNER_OBJECT_ID": "owner-id"}, clear=True)
    def test_lead_command_is_normalized_evented_and_idempotent(self) -> None:
        session = self.service.establish_session(user())
        payload = {
            "first_name": " Maya ", "lastName": "Brooks",
            "email": "MAYA@EXAMPLE.COM ", "phone": "(703) 555-0184",
            "source": "MRC", "requestedLoanAmount": "625000",
        }

        first = self.service.create_lead(session, payload, "mrc-42")
        second = self.service.create_lead(session, payload, "mrc-42")

        self.assertEqual(first, second)
        lead = self.store.get("LeadRecords", session.organization_id, first["leadId"])
        self.assertEqual(lead["email"], "maya@example.com")
        self.assertEqual(lead["phone"], "7035550184")
        self.assertEqual(len(self.store.messages), 1)
        self.assertEqual(self.store.messages[0][1]["eventType"], "lead.created.v1")

    @mock.patch.dict(os.environ, {"CRM_BOOTSTRAP_OWNER_OBJECT_ID": "owner-id"}, clear=True)
    def test_workflow_creates_one_task_and_one_run(self) -> None:
        session = self.service.establish_session(user())
        result = self.service.create_lead(session, {"email": "a@example.com"}, "key-1")
        event = self.store.messages[0][1]

        first = self.service.process_lead_created(event)
        second = self.service.process_lead_created(event)

        self.assertEqual(first["status"], "completed")
        self.assertEqual(second["status"], "duplicate")
        self.assertEqual(len([key for key in self.store.entities if key[0] == "Tasks"]), 1)
        self.assertEqual(result["eventId"], event["eventId"])

    @mock.patch.dict(os.environ, {"CRM_BOOTSTRAP_OWNER_OBJECT_ID": "owner-id"}, clear=True)
    def test_import_uses_default_source_and_shared_pipeline(self) -> None:
        session = self.service.establish_session(user())
        result = self.service.import_leads(
            session,
            [{"email": "one@example.com"}, {"phone": "703-555-0123", "source": "MRC"}],
            "upload-1",
            "historical",
        )

        self.assertEqual(result["accepted"], 2)
        self.assertEqual(len(self.store.messages), 2)
        first = self.store.get("LeadRecords", session.organization_id, result["leads"][0]["leadId"])
        second = self.store.get("LeadRecords", session.organization_id, result["leads"][1]["leadId"])
        self.assertEqual(first["source"], "historical")
        self.assertEqual(second["source"], "MRC")

    @mock.patch.dict(os.environ, {"CRM_BOOTSTRAP_OWNER_OBJECT_ID": "owner-id"}, clear=True)
    def test_requires_identifying_lead_content(self) -> None:
        session = self.service.establish_session(user())
        with self.assertRaisesRegex(CommandError, "requires a name"):
            self.service.create_lead(session, {"source": "manual"}, "key-2")
