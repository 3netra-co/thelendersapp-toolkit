from datetime import UTC, datetime


def health_payload(now: datetime | None = None) -> dict[str, str]:
    checked_at = now or datetime.now(UTC)
    return {
        "service": "thelendersapp-workspace-api",
        "status": "ok",
        "checkedAt": checked_at.isoformat().replace("+00:00", "Z"),
    }
