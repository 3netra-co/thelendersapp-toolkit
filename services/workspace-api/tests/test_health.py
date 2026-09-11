from datetime import UTC, datetime
from unittest import TestCase

from workspace_api.health import health_payload


class HealthPayloadTests(TestCase):
    def test_returns_stable_service_status_and_utc_timestamp(self) -> None:
        now = datetime(2026, 9, 9, 14, 30, tzinfo=UTC)

        self.assertEqual(
            health_payload(now),
            {
                "service": "thelendersapp-workspace-api",
                "status": "ok",
                "checkedAt": "2026-09-09T14:30:00Z",
            },
        )
