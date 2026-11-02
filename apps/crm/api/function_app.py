import json
import mimetypes
from pathlib import Path

import azure.functions as func

from crm_api.auth import AuthenticationError, bearer_token, entra_configuration, validate_access_token
from crm_api.health import health_payload
from crm_api.platform import AuthorizationError, CommandError, PlatformService
from crm_api.storage import AzureStore
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


@app.route(route="api/v1/config", methods=["GET"])
def configuration(req: func.HttpRequest) -> func.HttpResponse:
    """Return the public Entra values required by the customer-owned SPA."""
    try:
        body = entra_configuration()
    except RuntimeError as error:
        return func.HttpResponse(str(error), status_code=503, mimetype="text/plain")
    return func.HttpResponse(body=json.dumps(body), status_code=200, mimetype="application/json")


@app.route(route="api/v1/session", methods=["GET"])
def session(req: func.HttpRequest) -> func.HttpResponse:
    """Bootstrap the installer or resolve an existing organization membership."""
    try:
        user = validate_access_token(bearer_token(req.headers.get("Authorization")))
        established = PlatformService(AzureStore()).establish_session(user)
    except AuthenticationError as error:
        return _problem(str(error), 401, authenticate=True)
    except AuthorizationError as error:
        return _problem(str(error), 403)
    return func.HttpResponse(
        body=json.dumps({
            "authenticated": True,
            "tenantId": user.tenant_id,
            "userId": user.object_id,
            "displayName": user.display_name,
            "username": user.username,
            "organizationId": established.organization_id,
            "staffId": established.staff_id,
            "role": established.role,
        }),
        status_code=200,
        mimetype="application/json",
    )


@app.route(route="api/v1/leads", methods=["POST"])
def create_lead(req: func.HttpRequest) -> func.HttpResponse:
    """Accept one normalized, retry-safe lead command."""
    try:
        user = validate_access_token(bearer_token(req.headers.get("Authorization")))
        service = PlatformService(AzureStore())
        established = service.establish_session(user)
        result = service.create_lead(
            established, req.get_json(), req.headers.get("Idempotency-Key", "")
        )
    except AuthenticationError as error:
        return _problem(str(error), 401, authenticate=True)
    except AuthorizationError as error:
        return _problem(str(error), 403)
    except (CommandError, ValueError) as error:
        return _problem(str(error), 400)
    return func.HttpResponse(
        body=json.dumps(result), status_code=202, mimetype="application/json"
    )


@app.route(route="api/v1/leads", methods=["GET"])
def list_leads(req: func.HttpRequest) -> func.HttpResponse:
    """Return stored lead projections for the signed-in organization."""
    try:
        user = validate_access_token(bearer_token(req.headers.get("Authorization")))
        service = PlatformService(AzureStore())
        established = service.establish_session(user)
        result = service.list_leads(established)
    except AuthenticationError as error:
        return _problem(str(error), 401, authenticate=True)
    except AuthorizationError as error:
        return _problem(str(error), 403)
    return func.HttpResponse(
        body=json.dumps({"items": result, "count": len(result)}),
        status_code=200,
        mimetype="application/json",
    )


@app.route(route="api/v1/leads/import", methods=["POST"])
def import_leads(req: func.HttpRequest) -> func.HttpResponse:
    """Import up to 1,000 leads through the same command pipeline."""
    try:
        user = validate_access_token(bearer_token(req.headers.get("Authorization")))
        service = PlatformService(AzureStore())
        established = service.establish_session(user)
        payload = req.get_json()
        if not isinstance(payload, dict):
            raise CommandError("Import content must be a JSON object.")
        result = service.import_leads(
            established,
            payload.get("records"),
            req.headers.get("Idempotency-Key", ""),
            str(payload.get("defaultSource") or "import"),
        )
    except AuthenticationError as error:
        return _problem(str(error), 401, authenticate=True)
    except AuthorizationError as error:
        return _problem(str(error), 403)
    except (CommandError, ValueError) as error:
        return _problem(str(error), 400)
    return func.HttpResponse(
        body=json.dumps(result), status_code=202, mimetype="application/json"
    )


@app.queue_trigger(
    arg_name="message", queue_name="workflow-events", connection="AzureWebJobsStorage"
)
def workflow_event(message: func.QueueMessage) -> None:
    """Run duplicate-tolerant workflows emitted by customer-owned modules."""
    event = json.loads(message.get_body().decode("utf-8"))
    PlatformService(AzureStore()).process_lead_created(event)


def _problem(message: str, status: int, authenticate: bool = False) -> func.HttpResponse:
    headers = {"WWW-Authenticate": "Bearer"} if authenticate else None
    return func.HttpResponse(
        body=json.dumps({"error": message}), status_code=status,
        mimetype="application/json", headers=headers,
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
    cache_control = (
        "public, max-age=31536000, immutable"
        if requested_path.startswith("assets/")
        else "no-cache"
    )
    return func.HttpResponse(
        body=candidate.read_bytes(),
        status_code=200,
        mimetype=content_type or "application/octet-stream",
        headers={"Cache-Control": cache_control},
    )
