# Deployment history

This file records material hosting changes without credentials, deployment
tokens, or customer data.

## Installer portal

On September 10, 2026, `toolkit.thelenders.app` moved from a dedicated AWS S3
and CloudFront deployment to Azure Static Web Apps. Route 53 remains the
authoritative DNS provider for `thelenders.app`.

On September 11, 2026, the portal moved from the exploratory Azure resource to
the Bicep-managed production resources:

```text
Resource group: rg-thelendersapp-toolkit-platform-production
Static Web App: stapp-thelendersapp-installer-production
```

The public CNAME points to the Azure-generated hostname. Azure owns the custom
hostname binding and managed TLS certificate; it does not own the domain or its
DNS zone.

The former AWS toolkit CloudFront stack and dedicated S3 bucket were deleted.
The unrelated AWS resources serving `thelenders.app` and `www.thelenders.app`
were not changed. The exploratory Toolkit Azure application and data resource
groups were deleted after the production portal returned successful responses.
