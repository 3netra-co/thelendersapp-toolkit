# CRM Azure infrastructure

This directory contains the CRM Azure reference implementation installed into
a customer's subscription. These resources run only the CRM and remain under
the customer's ownership and billing account.

`main.bicep` is the subscription-level CRM deployment entry point. It creates a
customer-owned CRM resource group and deploys the current Python API and storage
foundation into it. It does not reference infrastructure operated by The
Lenders App.

## Naming

The installer supplies a meaningful lowercase `installationName`, normally the
customer's organization or deployment name. For example, an installation named
`sample-brokerage` produces resources such as:

```text
func-sample-brokerage-crm-production-<suffix>
plan-sample-brokerage-crm-functions-production
stapp-sample-brokerage-crm-production-<suffix>
```

Azure storage-account restrictions require a shorter alphanumeric form with a
deterministic uniqueness suffix. See
[`docs/RESOURCE_NAMING.md`](../../../docs/RESOURCE_NAMING.md).

## Validate and preview

Validate and preview the complete subscription-level entry point:

```sh
az deployment sub validate \
  --location <deployment-location> \
  --template-file apps/crm/infra/main.bicep \
  --parameters location=<resource-location> installationName=<installation-name>

az deployment sub what-if \
  --location <deployment-location> \
  --template-file apps/crm/infra/main.bicep \
  --parameters location=<resource-location> installationName=<installation-name>
```

The current entry point creates the resource group, Standard CRM Static Web App, CRM API
foundation, one StorageV2 account, managed identity, and storage role
assignments. The storage account supplies the CRM data foundation without a
database server:

- Blob containers preserve domain events, unchanged source payloads, and
  documents.
- Queue Storage carries projection and workflow work independently of the PWA.
- Table Storage holds rebuildable organization, branch, staff, identity,
  membership, and login-audit projections.
- Application Insights and a 30-day Log Analytics workspace capture bounded
  operational diagnostics. The workspace has a 0.1 GB daily ingestion cap so
  a failure loop cannot create unbounded telemetry charges.

The entry point returns the generated CRM application URL, API URL, storage
account, blob containers, queues, and tables as deployment outputs.

The Static Web App uses the Standard plan because Azure requires Standard for
linking the separately managed Function App. Bicep declares that link rather
than leaving it as a portal-only setup step. The link keeps browser requests on
the PWA's `/api` route while the Function App retains non-HTTP queue and
scheduled work. The installer must disclose this fixed hosting charge before
deployment.

The template requires immutable public HTTPS URLs for two release artifacts:

- `released-package.zip` contains the Python Function project at the ZIP root.
- `crm-web.zip` contains the compiled PWA at the ZIP root.

The Function package is published with Azure Functions One Deploy. The PWA is
published through Azure's Static Web Apps ZIP deployment API by a
customer-owned installer identity. The identity receives Contributor access
only on the new Static Web App; it has no access to other customer resources.
The deployment does not report success until the PWA and its
`/api/v1/health` route both respond.

Customer identity registration and application-level cost controls remain
later slices. They must be present before the CRM handles confidential data.

## Build a versioned installer

Run:

```sh
./scripts/build-azure-installer.sh
```

This produces ignored local artifacts under `dist/azure-installer`. A tag named
`crm-v<version>` runs the release workflow, binds the ARM template to the two
immutable packages from that GitHub release, and publishes a Microsoft Azure
deployment link. The marketplace must link to a tested release, never to a
moving branch.

## Data-removal boundary

Application/runtime resources and authoritative customer data will be placed in
separate resource groups. An application upgrade or removal must not delete the
authoritative-data group. Permanent data deletion requires a separate explicit
operation and a verified export.
