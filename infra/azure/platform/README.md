# Installer platform infrastructure

This subscription-scope Bicep deployment creates the Azure resources operated
by The Lenders App for `toolkit.thelenders.app`. It does not create customer
workspaces or store customer CRM, POS, or LOS data.

Validate and preview:

```sh
az deployment sub validate \
  --location eastus2 \
  --template-file infra/azure/platform/main.bicep

az deployment sub what-if \
  --location eastus2 \
  --template-file infra/azure/platform/main.bicep
```

Deploy:

```sh
az deployment sub create \
  --name thelendersapp-toolkit-platform-production \
  --location eastus2 \
  --template-file infra/azure/platform/main.bicep
```

Application publication is a separate operation. Build
`apps/installer-portal`, obtain the target Static Web App deployment token from
Azure, and publish the generated `dist` directory with Azure Static Web Apps
CLI. Deployment tokens must never be committed.
