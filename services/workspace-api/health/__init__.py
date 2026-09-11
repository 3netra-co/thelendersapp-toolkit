import json
from datetime import UTC, datetime

import azure.functions as func


def main(_: func.HttpRequest) -> func.HttpResponse:
    """Report API readiness without exposing configuration or customer data."""
    payload = {
        "service": "thelendersapp-workspace-api",
        "status": "ok",
        "checkedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    }
    return func.HttpResponse(
        body=json.dumps(payload),
        status_code=200,
        mimetype="application/json",
    )
