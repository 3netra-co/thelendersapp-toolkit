"""Organization bootstrap, authorization, lead commands, and workflows."""

from __future__ import annotations

import hashlib
import json
import os
import re
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Callable

from crm_api.auth import AuthenticatedUser
from crm_api.storage import Store


class AuthorizationError(PermissionError):
    pass


class CommandError(ValueError):
    pass


def utc_now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def stable_id(kind: str, *parts: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, ":".join(("thelenders.app", kind, *parts))))


@dataclass(frozen=True)
class Session:
    organization_id: str
    staff_id: str
    role: str
    user: AuthenticatedUser


class PlatformService:
    def __init__(self, store: Store, clock: Callable[[], str] = utc_now) -> None:
        self.store = store
        self.clock = clock

    def establish_session(self, user: AuthenticatedUser) -> Session:
        link = self.store.get("IdentityLinks", user.tenant_id, user.object_id)
        if link is None:
            owner_ids = {
                item.strip()
                for item in os.environ.get("CRM_BOOTSTRAP_OWNER_OBJECT_ID", "").split(",")
                if item.strip()
            }
            if user.object_id not in owner_ids:
                raise AuthorizationError("This Microsoft user has not been added to this organization.")
            link = self._bootstrap_owner(user)

        organization_id = str(link["organizationId"])
        membership = self.store.get("Memberships", organization_id, user.object_id)
        if not membership or membership.get("status") != "active":
            raise AuthorizationError("This Microsoft user does not have an active membership.")

        self.store.create("LoginAudit", {
            "PartitionKey": organization_id,
            "RowKey": f"{self.clock()}-{uuid.uuid4()}",
            "userObjectId": user.object_id,
            "staffId": str(membership["staffId"]),
            "eventType": "login.succeeded.v1",
        })
        return Session(
            organization_id=organization_id,
            staff_id=str(membership["staffId"]),
            role=str(membership["role"]),
            user=user,
        )

    def _bootstrap_owner(self, user: AuthenticatedUser) -> dict[str, Any]:
        organization_id = stable_id("organization", user.tenant_id)
        branch_id = stable_id("branch", organization_id, "default")
        staff_id = stable_id("staff", organization_id, user.object_id)
        now = self.clock()
        self.store.create("Organizations", {
            "PartitionKey": user.tenant_id, "RowKey": organization_id,
            "name": "My Organization", "status": "active", "createdAt": now,
        })
        self.store.create("Branches", {
            "PartitionKey": organization_id, "RowKey": branch_id,
            "name": "Main", "isDefault": True, "status": "active", "createdAt": now,
        })
        self.store.create("StaffProfiles", {
            "PartitionKey": organization_id, "RowKey": staff_id,
            "displayName": user.display_name or user.username or "Organization owner",
            "email": user.username or "", "status": "active", "createdAt": now,
        })
        link = {
            "PartitionKey": user.tenant_id, "RowKey": user.object_id,
            "organizationId": organization_id, "staffId": staff_id, "createdAt": now,
        }
        self.store.create("IdentityLinks", link)
        self.store.create("Memberships", {
            "PartitionKey": organization_id, "RowKey": user.object_id,
            "staffId": staff_id, "branchId": branch_id, "role": "admin",
            "status": "active", "createdAt": now,
        })
        return link

    def require_role(self, session: Session, *roles: str) -> None:
        if session.role not in roles:
            raise AuthorizationError("Your organization role does not allow this action.")

    def create_lead(
        self, session: Session, payload: dict[str, Any], idempotency_key: str
    ) -> dict[str, Any]:
        self.require_role(session, "admin", "read_write")
        if not idempotency_key.strip():
            raise CommandError("Idempotency-Key is required.")
        normalized = normalize_lead(payload)
        organization_id = session.organization_id
        digest = hashlib.sha256(idempotency_key.strip().encode()).hexdigest()
        existing = self.store.get("IdempotencyRecords", organization_id, digest)
        if existing:
            return json.loads(str(existing["responseJson"]))

        lead_id = stable_id("lead", organization_id, idempotency_key.strip())
        event_id = stable_id("event", lead_id, "lead.created.v1")
        now = self.clock()
        raw_name = f"{organization_id}/leads/{lead_id}/source.json"
        self.store.put_json("source-payloads", raw_name, payload)
        lead = {
            "PartitionKey": organization_id, "RowKey": lead_id,
            **normalized, "stage": "new", "ownerStaffId": "",
            "createdAt": now, "updatedAt": now, "sourcePayload": raw_name,
        }
        self.store.create("LeadRecords", lead)
        event = {
            "schemaVersion": 1, "eventId": event_id,
            "installationId": organization_id, "entityType": "lead", "entityId": lead_id,
            "eventType": "lead.created.v1", "occurredAt": now,
            "actorId": session.staff_id, "correlationId": lead_id, "causationId": None,
            "source": {"system": "crm-api", "tenant": session.user.tenant_id},
            "data": {"leadId": lead_id, "source": normalized["source"]},
        }
        self.store.create("LeadEvents", {
            "PartitionKey": lead_id, "RowKey": event_id,
            "organizationId": organization_id, "eventType": "lead.created.v1",
            "occurredAt": now, "eventJson": json.dumps(event, separators=(",", ":")),
        })
        self.store.put_json("domain-events", f"{organization_id}/lead/{lead_id}/{event_id}.json", event)
        self.store.enqueue("workflow-events", event)
        response = {"leadId": lead_id, "eventId": event_id, "status": "accepted"}
        self.store.create("IdempotencyRecords", {
            "PartitionKey": organization_id, "RowKey": digest,
            "command": "lead.create.v1", "responseJson": json.dumps(response), "createdAt": now,
        })
        return response

    def list_leads(self, session: Session) -> list[dict[str, Any]]:
        self.require_role(session, "admin", "read_write", "read_only")
        records = self.store.list_partition("LeadRecords", session.organization_id)
        records.sort(key=lambda item: str(item.get("createdAt", "")), reverse=True)
        return [
            {
                "leadId": str(item["RowKey"]),
                "firstName": str(item.get("firstName", "")),
                "lastName": str(item.get("lastName", "")),
                "email": str(item.get("email", "")),
                "phone": str(item.get("phone", "")),
                "source": str(item.get("source", "")),
                "stage": str(item.get("stage", "new")),
                "ownerStaffId": str(item.get("ownerStaffId", "")),
                "requestedLoanAmount": float(item.get("requestedLoanAmount", 0)),
                "createdAt": str(item.get("createdAt", "")),
                "updatedAt": str(item.get("updatedAt", "")),
            }
            for item in records
        ]

    def import_leads(
        self, session: Session, records: list[dict[str, Any]], import_key: str,
        default_source: str = "import",
    ) -> dict[str, Any]:
        self.require_role(session, "admin", "read_write")
        if not import_key.strip():
            raise CommandError("Idempotency-Key is required.")
        if not isinstance(records, list) or not records:
            raise CommandError("Import requires at least one lead record.")
        if len(records) > 1000:
            raise CommandError("One import may contain at most 1,000 lead records.")
        accepted = []
        for index, record in enumerate(records):
            if not isinstance(record, dict):
                raise CommandError(f"Import record {index + 1} must be a JSON object.")
            candidate = dict(record)
            candidate.setdefault("source", default_source)
            accepted.append(
                self.create_lead(session, candidate, f"{import_key.strip()}:{index}")
            )
        return {"importId": stable_id("import", session.organization_id, import_key),
                "accepted": len(accepted), "leads": accepted}

    def process_lead_created(self, event: dict[str, Any]) -> dict[str, Any]:
        if event.get("eventType") != "lead.created.v1":
            return {"status": "ignored"}
        organization_id = str(event["installationId"])
        event_id = str(event["eventId"])
        existing = self.store.get("WorkflowRuns", organization_id, event_id)
        if existing:
            return {"status": "duplicate", "workflowRunId": existing["workflowRunId"]}
        lead_id = str(event["entityId"])
        lead = self.store.get("LeadRecords", organization_id, lead_id)
        if not lead:
            raise CommandError("Lead projection is unavailable for workflow evaluation.")
        task_id = stable_id("task", organization_id, event_id, "initial-review")
        self.store.create("Tasks", {
            "PartitionKey": organization_id, "RowKey": task_id, "leadId": lead_id,
            "title": "Review new lead", "status": "open", "createdAt": self.clock(),
        })
        run_id = stable_id("workflow-run", organization_id, event_id)
        self.store.create("WorkflowRuns", {
            "PartitionKey": organization_id, "RowKey": event_id,
            "workflowRunId": run_id, "workflow": "lead-intake.v1", "leadId": lead_id,
            "result": "task_created", "taskId": task_id, "completedAt": self.clock(),
        })
        return {"status": "completed", "workflowRunId": run_id, "taskId": task_id}


def normalize_lead(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise CommandError("Lead content must be a JSON object.")
    first = _text(payload.get("firstName") or payload.get("first_name"), 100)
    last = _text(payload.get("lastName") or payload.get("last_name"), 100)
    email = _text(payload.get("email"), 254).lower()
    phone = re.sub(r"[^0-9+]", "", _text(payload.get("phone"), 40))
    if not any((first, last, email, phone)):
        raise CommandError("A lead requires a name, email, or phone number.")
    return {
        "firstName": first, "lastName": last, "email": email, "phone": phone,
        "source": _text(payload.get("source"), 100) or "manual",
        "requestedLoanAmount": _number(payload.get("requestedLoanAmount")),
    }


def _text(value: Any, maximum: int) -> str:
    return str(value).strip()[:maximum] if value is not None else ""


def _number(value: Any) -> float:
    if value in (None, ""):
        return 0.0
    try:
        result = float(value)
    except (TypeError, ValueError) as error:
        raise CommandError("requestedLoanAmount must be a number.") from error
    if result < 0:
        raise CommandError("requestedLoanAmount cannot be negative.")
    return result
