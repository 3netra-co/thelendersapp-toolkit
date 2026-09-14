targetScope = 'subscription'

@description('Azure region where the customer-owned CRM resources will be created.')
param location string

@description('Short lowercase name for this CRM installation; use letters, numbers, and hyphens.')
@minLength(3)
@maxLength(20)
param installationName string

@description('Durable environment represented by this deployment.')
@allowed([
  'development'
  'production'
])
param environmentName string = 'production'

var resourceGroupName = 'rg-${installationName}-crm-${environmentName}'
var tags = {
  product: 'thelendersapp-toolkit-crm'
  environment: environmentName
  'managed-by': 'bicep'
  installation: installationName
}

resource crmResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module crmApi 'crm-api.bicep' = {
  name: 'crm-api'
  scope: crmResourceGroup
  params: {
    location: location
    environmentName: environmentName
    installationName: installationName
  }
}

module crmWeb 'crm-web.bicep' = {
  name: 'crm-web'
  scope: crmResourceGroup
  params: {
    location: location
    environmentName: environmentName
    installationName: installationName
  }
}

output resourceGroupName string = crmResourceGroup.name
output crmApiName string = crmApi.outputs.functionAppName
output crmApiUrl string = crmApi.outputs.functionAppUrl
output crmApplicationName string = crmWeb.outputs.staticWebAppName
output crmApplicationUrl string = crmWeb.outputs.applicationUrl
output storageAccountName string = crmApi.outputs.runtimeStorageName
output runtimeName string = crmApi.outputs.runtimeName
output runtimeVersion string = crmApi.outputs.runtimeVersion
