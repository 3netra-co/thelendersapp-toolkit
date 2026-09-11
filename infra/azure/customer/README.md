# Customer Azure infrastructure

This directory contains the Azure reference implementation installed into a
customer's subscription. These resources run the customer workspace and remain
under the customer's ownership and billing account.

The current Bicep slice creates the Python workspace API foundation. It does
not create resources operated by The Lenders App and must not reference the
public installer portal's resource group.

## Naming

The installer supplies a meaningful lowercase `installationName`, normally the
customer's organization or deployment name. For example, an installation named
`colonial-mortgage` produces resources such as:

```text
func-colonial-mortgage-workspace-production-<suffix>
plan-colonial-mortgage-workspace-functions-production
```

Azure storage-account restrictions require a shorter alphanumeric form with a
deterministic uniqueness suffix. See
[`docs/RESOURCE_NAMING.md`](../../../docs/RESOURCE_NAMING.md).

## Validate and preview

The destination resource group must already exist for this resource-group
module:

```sh
az deployment group validate \
  --resource-group <customer-resource-group> \
  --template-file infra/azure/customer/workspace-api.bicep \
  --parameters installationName=<installation-name>

az deployment group what-if \
  --resource-group <customer-resource-group> \
  --template-file infra/azure/customer/workspace-api.bicep \
  --parameters installationName=<installation-name>
```

The complete customer deployment will later create the resource group, PWA,
workspace API, storage services, identities, roles, queues, and cost controls
through a subscription-scope entry point.

## Data-removal boundary

Application/runtime resources and authoritative customer data will be placed in
separate resource groups. An application upgrade or removal must not delete the
authoritative-data group. Permanent data deletion requires a separate explicit
operation and a verified export.
