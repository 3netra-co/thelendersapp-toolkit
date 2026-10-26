# Customer-owned Microsoft Entra application

## Ownership boundary

The Toolkit installer and an installed CRM are two different applications.

| Component | Owner | Purpose | Credentials retained |
| --- | --- | --- | --- |
| Toolkit installer | The Lenders App | Obtains interactive, temporary permission to orchestrate installation | No customer password or long-lived Azure/Graph token |
| CRM Entra application | Customer tenant | Authenticates users of one installed CRM and issues its API access tokens | No client secret; the PWA uses authorization code with PKCE |
| CRM Azure resources and data | Customer subscription | Runs the CRM PWA/API and stores customer records | Customer-managed Azure resources only |

The public CRM release contains no The Lenders App tenant ID, application ID,
secret, or redirect URI. A contributor can use the same release with an Entra
application that they create in their own tenant.

## Required installer permissions

Azure resource deployment and Entra application creation use separate,
short-lived delegated tokens:

1. Azure Resource Manager `user_impersonation` is used to inspect the selected
   subscription and deploy the reviewed Bicep template.
2. Microsoft Graph `Application.ReadWrite.All` is used to create and configure
   the customer's application registration and service principal. Microsoft
   requires administrator consent and a supported Entra directory role for
   this delegated operation.
3. The installer does not request `Directory.Read.All` or add an individual
   owner through the Graph owners endpoint. The registration belongs to the
   customer's tenant. An installing Application Administrator can manage it
   through that tenant even when Entra does not automatically list that
   administrator as an application owner.

These permissions authorize the interactive installation transaction. They are
not permissions granted to the installed CRM, and their access tokens are not
written to CRM storage, browser local storage, logs, or the public repository.

## Installation sequence

The installer performs the following resumable stages:

1. **Preflight** — verify a work or school account, the selected tenant and
   subscription, the user's Azure deployment role, and permission to create an
   Entra application. Show the resource inventory and estimated cost before
   creating anything.
2. **Deploy infrastructure** — deploy the public Bicep release without any
   tenant ID or client ID parameter. Azure returns the unique HTTPS CRM URL.
3. **Create customer identity** — with the customer's delegated Graph token,
   create one single-tenant application (`AzureADMyOrg`) in the selected tenant.
   Configure the generated CRM URL as an SPA redirect URI and set that same URL
   as the logout URL.
4. **Expose the CRM API** — set the application identifier URI to
   `api://<customer-application-client-id>` and create the delegated
   `CRM.Access` scope. Create the corresponding service principal in the
   customer's tenant. Do not create a client secret.
5. **Bind the CRM** — update only that customer's Function App settings with
   `CRM_ENTRA_TENANT_ID`, `CRM_ENTRA_CLIENT_ID`, and the installing user's
   `CRM_BOOTSTRAP_OWNER_OBJECT_ID`. These values identify the customer-owned
   application and its initially approved administrator; none identifies the
   Toolkit installer.
6. **Verify** — wait for the Function App to restart, open the generated URL,
   require interactive Microsoft sign-in, acquire `CRM.Access`, and verify
   `/api/v1/session`. A token from another tenant must be rejected. The
   anonymous `/api/v1/health` endpoint remains data-free.
7. **Bootstrap ownership** — only after authentication succeeds, record the
   installer's immutable Entra tenant ID (`tid`) and object ID (`oid`) as the
   first organization owner. Staff onboarding happens inside the CRM later.
8. **Handoff** — show the customer URL, PWA installation instructions, the
   created resource group and application registration, and a downloadable
   installation record containing non-secret identifiers and release version.

## Failure and retry rules

- Persist only non-secret stage identifiers needed to resume: tenant ID,
  subscription ID, deployment name, resource group, CRM URL, Entra application
  object ID/client ID, release version, and status timestamps.
- Never replace an existing customer application with the Toolkit application.
- Retry by discovering the stage's existing object before creating another
  one. The installation name plus tenant and subscription form the idempotency
  boundary.
- If infrastructure succeeds but identity fails, report the exact incomplete
  stage and offer **Resume identity setup**. The CRM must remain visibly locked,
  not anonymously usable.
- Cleanup is explicit: removing test Azure resources and removing the
  customer-owned Entra application are separate actions. Neither action deletes
  or alters the Toolkit installer registration.

## Runtime trust decision

The deployed API trusts only tokens whose issuer tenant equals
`CRM_ENTRA_TENANT_ID`, whose audience equals `CRM_ENTRA_CLIENT_ID`, and whose
delegated scopes include `CRM.Access`. Until staff membership is implemented,
the immutable user object ID must also match `CRM_BOOTSTRAP_OWNER_OBJECT_ID`.
Application roles and staff permissions are then enforced by the CRM API using
the authenticated `tid` and `oid`; UI visibility alone is never authorization.
