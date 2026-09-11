# Toolkit architecture direction

Status: proposed for the V1 Azure proof

This document records the architectural constraints agreed before creating any
billable cloud resources. It describes a reference implementation, not a
dependency on infrastructure operated by The Lenders App.

## Product boundary

The customer owns the cloud subscription, resource group, domain, data,
credentials, encryption configuration, and provider charges. The Toolkit
provides open-source application code and repeatable deployment artifacts.

The deployment process begins after a customer has created a billable cloud
subscription. It must support preflight, cost disclosure, provisioning,
verification, upgrade, export, and safe removal.

Azure is the supported V1 reference platform. Other cloud implementations can
be contributed when they satisfy the same capability and data contracts.

## Client

The primary client is an installable Progressive Web App. It must work in a
normal browser and as an installed application on supported desktop and mobile
platforms. Background workflows must never depend on the PWA remaining open.

The PWA should cache application assets, but V1 must not cache confidential
borrower or loan data for offline use. Offline confidential data requires a
separate threat model and encryption design.

## Data layers

V1 separates authoritative history from query projections:

1. Blob Storage contains immutable, versioned domain events, original import
   payloads, and documents. These records are sufficient to rebuild derived
   state.
2. Table Storage contains disposable, query-oriented projections used by the
   CRM interface.
3. Queue Storage carries work between ingestion, projection, and workflow
   functions.
4. Azure Functions validate commands, write records, update projections, run
   schedules, and invoke integrations.

The earlier Docker/SQLite proof has been removed. Local development uses the
same Python API boundaries and Azure storage contracts as the cloud application.

## POS and LOS integration boundary

Point-of-sale and loan-origination systems must connect through versioned
adapters. Provider-specific fields must not leak into the core domain model.
Every ingestion stores three related artifacts:

- the unchanged source payload and source metadata;
- a normalized Toolkit event;
- a transformation report containing adapter and schema versions, mappings,
  warnings, validation failures, and fields not understood by the current
  model.

Preserving the source payload allows a later adapter version to reprocess data
without requesting it again or losing fields that were unknown at ingestion.

An adapter must be idempotent. Replaying the same source event cannot create a
second borrower, contact, opportunity, loan, communication, or workflow action.

## Independent application boundary

CRM, POS, and LOS are independently installable products. Each owns its API,
runtime, storage, identity configuration, permissions, deployment, version, and
removal lifecycle. Installing CRM must not provision POS or LOS resources.

The CRM Python service grows through explicit CRM modules:

```text
crm_api/
├── identity/
├── organizations/
├── crm/
├── communications/
├── automation/
└── integrations/
```

Shared schemas define interoperability without creating a shared database.
When CRM connects to a POS or LOS, it uses the other application's documented,
versioned API or event contract. No application reads or writes another
application's storage directly.

## Integration and AI-assisted development

ARIVE, Encompass, Polly, Salesforce, lead sources, and communication providers
connect through versioned adapters. An adapter declares its authentication,
permissions, supported operations, webhook behavior, field mappings, rate
limits, and data-classification impact.

AI tools such as OpenAI or Azure AI Foundry may help generate mappings, adapter
scaffolding, tests, and setup guidance. Generated code receives the same review,
least-privilege checks, contract tests, fixture tests, and secret-scanning as a
human contribution. AI output never receives production credentials or bypasses
the stable connector and event contracts.

## Identity and correlation

Toolkit identifiers are stable and never derived solely from a provider's ID.
External identities are recorded as references containing provider, tenant,
resource type, and external ID. This permits one Toolkit entity to correlate
with multiple POS, LOS, CRM, and communication systems.

Identity resolution is explicit and auditable. An uncertain match creates a
review item rather than silently merging records.

## Event contract

All providers use the versioned envelope defined in
[`event-envelope.schema.json`](../packages/contracts/schemas/event-envelope.schema.json).
The envelope separates stable routing metadata from provider or domain data.

Events are append-only. Corrections are represented by later events rather than
editing historical event blobs. Consumers must tolerate retries and events
that arrive more than once.

## Reference Azure lifecycle

Any catalog or deployment entry point and each customer application are
separate deployments. Customer infrastructure is encoded in public Bicep before
application capabilities are added.
Identity, organization, branch, and staff onboarding are verified before
contacts are added to the cloud application.

The intended lifecycle is:

```text
preflight -> estimate -> provision -> deploy -> configure -> verify
          -> upgrade -> export -> uninstall
```

No Azure resources should be created until the proposed resource inventory,
region, names, data-deletion boundary, and cost controls have been reviewed.

## First cloud proof

The first acceptable vertical slice will:

1. deploy a Python Functions API and verify its health;
2. authenticate one administrator through customer-owned Entra
   registrations;
3. create an organization, default branch, staff profile, identity link, and
   owner membership exactly once;
4. invite and activate a second staff user on another device;
5. enforce Owner, Admin, CRM Writer, and CRM Reader permissions in the API; and
6. report the resources and measured cost of the deployment exercise.

The implementation order and exit tests are recorded in
[`AZURE_INSTALLER_ROADMAP.md`](./AZURE_INSTALLER_ROADMAP.md).

Custom domains, ACS, production migrations, and full POS/LOS adapters are not
required for this proof, but the proof must use the same contracts they will
extend.
