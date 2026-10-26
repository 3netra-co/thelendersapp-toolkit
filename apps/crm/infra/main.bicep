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

@description('Public HTTPS URL of the versioned Azure Functions source package. The file name must be released-package.zip.')
param functionPackageUri string

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
    functionPackageUri: functionPackageUri
  }
}

output resourceGroupName string = crmResourceGroup.name
output crmApiName string = crmApi.outputs.functionAppName
output crmApiResourceId string = crmApi.outputs.functionAppId
output crmApiUrl string = crmApi.outputs.functionAppUrl
output crmApplicationName string = crmApi.outputs.functionAppName
output crmApplicationUrl string = crmApi.outputs.functionAppUrl
output crmApplicationPlan string = 'FlexConsumption'
output storageAccountName string = crmApi.outputs.runtimeStorageName
output blobContainerNames array = crmApi.outputs.blobContainerNames
output queueNames array = crmApi.outputs.queueNames
output tableNames array = crmApi.outputs.tableNames
output applicationInsightsName string = crmApi.outputs.applicationInsightsName
output logAnalyticsWorkspaceName string = crmApi.outputs.logAnalyticsWorkspaceName
output runtimeName string = crmApi.outputs.runtimeName
output runtimeVersion string = crmApi.outputs.runtimeVersion
