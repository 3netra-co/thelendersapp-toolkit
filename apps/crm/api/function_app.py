import json
from pathlib import Path

import azure.functions as func

from crm_api.health import health_payload


app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


@app.route(route="v1/health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    """Report API readiness without exposing configuration or customer data."""
    return func.HttpResponse(
        body=json.dumps(health_payload()),
        status_code=200,
        mimetype="application/json",
    )


@app.route(route="v1/install/web-package", methods=["GET"])
def web_package(req: func.HttpRequest) -> func.HttpResponse:
    """Provide the immutable CRM PWA package during customer installation."""
    package_path = Path(__file__).resolve().parent / "crm-web.zip"
    if not package_path.is_file():
        return func.HttpResponse(
            body=json.dumps({"error": "The CRM web package is unavailable."}),
            status_code=503,
            mimetype="application/json",
        )

    return func.HttpResponse(
        body=package_path.read_bytes(),
        status_code=200,
        mimetype="application/zip",
        headers={"Content-Disposition": 'attachment; filename="crm-web.zip"'},
    )
