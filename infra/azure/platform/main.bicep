targetScope = 'subscription'

@description('Azure region used by the installer portal.')
param location string = 'eastus2'

@description('Resource group containing The Lenders App operated installer portal.')
param resourceGroupName string = 'rg-thelendersapp-toolkit-platform-production'

@description('Azure Static Web App resource serving toolkit.thelenders.app.')
param installerPortalName string = 'stapp-thelendersapp-installer-production'

var tags = {
  product: 'thelendersapp-toolkit'
  environment: 'production'
  owner: 'thelendersapp'
  purpose: 'installer-portal'
  'managed-by': 'bicep'
}

resource platformResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module installerPortal 'resources.bicep' = {
  name: 'installer-portal'
  scope: platformResourceGroup
  params: {
    location: location
    installerPortalName: installerPortalName
    tags: tags
  }
}

output resourceGroupName string = platformResourceGroup.name
output installerPortalName string = installerPortal.outputs.installerPortalName
output installerPortalHostname string = installerPortal.outputs.installerPortalHostname
