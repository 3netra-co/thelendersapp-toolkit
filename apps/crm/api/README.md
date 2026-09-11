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

The initial endpoint uses an explicit `function.json` binding so Azure indexes
it deterministically across current Flex Consumption hosts:

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
