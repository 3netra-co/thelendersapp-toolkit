@description('Azure region used by the installer portal.')
param location string

@description('Azure Static Web App resource serving the installer portal.')
param installerPortalName string

param tags object

resource installerPortal 'Microsoft.Web/staticSites@2023-12-01' = {
  name: installerPortalName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

output installerPortalName string = installerPortal.name
output installerPortalHostname string = installerPortal.properties.defaultHostname
