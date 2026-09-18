# Toolkit CRM

Toolkit CRM is an independently installable, customer-owned mortgage CRM. Its
web application, API, cloud infrastructure, tests, and operating documentation
are kept together so it can be installed and versioned without deploying a POS
or LOS.

## Structure

| Path | Purpose |
| --- | --- |
| [`web`](web) | React Progressive Web App |
| [`api`](api) | Python Azure Functions API and tests |
| [`infra`](infra) | Customer-owned Azure reference infrastructure |
| [`../../scripts/build-azure-installer.sh`](../../scripts/build-azure-installer.sh) | Reproducible installer artifact builder |

The Azure entry point returns separate CRM application and API URLs. The web
application and API remain one CRM product even though Azure hosts them as
separate resources.

## Local checks

```sh
cd apps/crm/web
npm ci
npm run typecheck
npm run build

cd ../api
PYTHONPATH=. python3 -m unittest discover -s tests -v

cd ../../..
az bicep build --file apps/crm/infra/main.bicep --stdout > /dev/null
```

## Installer release

The Azure installer creates the infrastructure and publishes the exact CRM API
and PWA packages from the selected version. See
[`infra/README.md`](infra/README.md) for artifact and release instructions.

The CRM is pre-production. Do not enter confidential borrower, lender,
credential, or customer data.
