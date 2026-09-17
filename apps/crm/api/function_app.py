import json

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
