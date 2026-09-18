# Azure customer deployment roadmap

Status: implementation sequence for the first customer-owned installation test

The public repository supplies the versioned application and deployment
artifacts used to create a customer-owned Azure CRM. A separately
operated catalog may explain an offering and link to its deployment flow, but
it is not part of this repository or the customer's runtime data path.

## Technology boundary

- React and TypeScript provide the customer PWA interface and any public
  deployment-review UI contributed with the offering.
- Python provides the Azure Functions API, event handlers, projection workers,
  scheduled jobs, and future integration adapters.
- Bicep defines customer-owned Azure and supported Microsoft Entra resources.
- The earlier Docker/SQLite proof has been removed. It is not part of the Azure
  product or development path.

## Delivery slices

Each slice must be independently reviewable and testable. A later slice cannot
be treated as complete while a prerequisite slice is only manually configured.

### Slice 1: Python API foundation

- Python Functions project layout
- anonymous, data-free health endpoint
- configuration validation and unit tests
- local Functions execution instructions
- versioned deployment packaging for the customer CRM Function App

Exit test: the local and deployed `/api/v1/health` endpoints report healthy.

### Slice 2: Repeatable Azure infrastructure

- subscription and resource-group Bicep entry points
- Static Web App, Flex Consumption Functions, and storage
- managed identities and least-privilege role assignments
- tables, blob containers, and queues
- stable outputs including the customer PWA URL
- validate and what-if commands

Exit test: a clean temporary resource group can be created twice without duplicate
resources, and the second deployment is an update rather than a replacement.

Current implementation note: the versioned installer also publishes the Python
Function and compiled PWA packages. A deployment is treated as healthy only
after both the PWA root and `/api/v1/health` respond.

### Slice 3: Customer-owned identity

- tenant and permission preflight
- customer-owned Entra web and API registrations
- authorization-code-with-PKCE sign-in from the PWA
- API token validation and tenant restriction
- no customer secret or long-lived Azure token retained by the installer

Exit test: the first administrator can sign in, while a user from an
unapproved tenant cannot call a protected API.

### Slice 4: First-owner initialization

- organization record
- default branch record
- staff profile and durable Entra identity link
- owner membership and role assignment
- auditable first login and initialization events

Exit test: first login is idempotent and cannot create a second organization or
second owner profile after refresh, retry, or concurrent requests.

### Slice 5: Staff onboarding and authorization

- pending staff invitation
- Owner, Admin, CRM Writer, and CRM Reader roles
- one-time activation link plus Microsoft sign-in
- staff activation and deactivation
- server-side authorization tests for every protected operation
- copyable invitation instructions; automated email is deferred

Exit test: a second user activates on another device and can perform only the
operations granted by their roles.

### Slice 6: Guided deployment handoff

- a versioned Microsoft deployment link generated from public release artifacts
- Microsoft sign-in and tenant/subscription selection on Microsoft-owned pages
- region, organization name, deployment name, and cost/resource confirmation
- permission preflight before billable resources
- deployment progress, retry, and actionable failures
- final Azure Static Web Apps URL and PWA installation guidance
- versioned release selection rather than deployment from a moving branch

Exit test: a new administrator can follow the published deployment link, deploy
a customer-owned environment, and onboard a second user without manual Azure
API configuration.

### Slice 7: Clean contributor test

- laptop 3 clones the public repository
- contributor runs tests and proposes a change through a pull request
- a separate test installation is produced from the documented release
- security and deployment changes receive maintainer review

Exit test: no undocumented state from the original development laptop is
required to reproduce the installation.

## Deferred until identity and staff pass

- contact and opportunity screens
- ACS email, SMS, and calling
- automated invitation email
- custom customer domains
- Event Grid or Event Hubs
- confidential offline data
- POS/LOS integrations and migrations
