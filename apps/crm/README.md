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

## Local checks

```sh
cd apps/crm/web
npm ci
npm run typecheck
npm run build

cd ../api
PYTHONPATH=. python3 -m unittest discover -s tests -v

cd ../../..
az bicep build --file apps/crm/infra/crm-api.bicep --stdout > /dev/null
```

The CRM is pre-production. Do not enter confidential borrower, lender,
credential, or customer data.
