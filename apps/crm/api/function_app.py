import json
import mimetypes
from pathlib import Path

import azure.functions as func

from crm_api.health import health_payload
from crm_api.web import resolve_web_asset


app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
WEB_ROOT = Path(__file__).resolve().parent / "web"


@app.route(route="api/v1/health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    """Report API readiness without exposing configuration or customer data."""
    return func.HttpResponse(
        body=json.dumps(health_payload()),
        status_code=200,
        mimetype="application/json",
    )


@app.route(route="{*path}", methods=["GET"])
def web(req: func.HttpRequest) -> func.HttpResponse:
    """Serve the compiled customer-owned PWA and its static assets."""
    requested_path = req.route_params.get("path", "").lstrip("/")
    candidate = resolve_web_asset(WEB_ROOT, requested_path)
    if candidate is None:
        return func.HttpResponse(
            body="Not found",
            status_code=404,
            mimetype="text/plain",
        )

    if not candidate.is_file():
        return func.HttpResponse(
            body="The CRM PWA is unavailable.",
            status_code=503,
            mimetype="text/plain",
        )

    content_type, _ = mimetypes.guess_type(candidate.name)
    return func.HttpResponse(
        body=candidate.read_bytes(),
        status_code=200,
        mimetype=content_type or "application/octet-stream",
    )
