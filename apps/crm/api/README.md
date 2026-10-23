# CRM API

This customer-owned Python service is the backend for the Toolkit CRM. It owns
CRM contacts, leads, opportunities, communications, automation, authorization,
audit, and CRM-specific integrations. It does not own POS or LOS data.

Other products connect through versioned APIs and events rather than reading
this application's storage directly.

## Runtime

Customer deployments target Python 3.12 on Azure Functions v4 Flex
Consumption. Python 3.14 is intentionally not targeted yet because remote build
support for it on Flex Consumption is not consistently available.

## Run the dependency-free unit test

From this directory:

```sh
PYTHONPATH=. python3 -m unittest discover -s tests -v
```

## Run the Functions host locally

Azure Functions Core Tools and a Python 3.12 virtual environment are required:

```sh
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
func start
```

The initial endpoint uses the Python v2 `FunctionApp` programming model used by
Microsoft's current Flex Consumption reference applications:

```text
GET http://localhost:7071/api/v1/health
```

`local.settings.json` is intentionally ignored because it can contain local
credentials. A checked-in example will be added when the first storage-backed
function defines its required settings.

## Security boundary

The health endpoint contains no configuration or customer data and can remain
anonymous. Business endpoints must not inherit that assumption: they will
require a validated customer Entra token and server-side role checks.

The authentication foundation currently exposes:

```text
GET /api/v1/health   anonymous deployment health
GET /api/v1/config   public tenant/client values required for sign-in
GET /api/v1/session  validated CRM.Access token required
```

`/api/v1/session` validates the Microsoft signature, issuer, audience, expiry,
deployment tenant, delegated CRM scope, and immutable Entra object ID. It does
not yet create an organization or staff record; that belongs to the separate
first-owner initialization slice.
