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

@description('Public HTTPS URL of the versioned compiled CRM PWA package.')
param webPackageUri string

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

module crmWeb 'crm-web.bicep' = {
  name: 'crm-web'
  scope: crmResourceGroup
  params: {
    location: location
    environmentName: environmentName
    installationName: installationName
    functionAppResourceId: crmApi.outputs.functionAppId
    functionAppRegion: location
    webPackageUri: webPackageUri
  }
}

output resourceGroupName string = crmResourceGroup.name
output crmApiName string = crmApi.outputs.functionAppName
output crmApiResourceId string = crmApi.outputs.functionAppId
output crmApiUrl string = crmApi.outputs.functionAppUrl
output crmApplicationName string = crmWeb.outputs.staticWebAppName
output crmApplicationUrl string = crmWeb.outputs.applicationUrl
output crmApplicationPlan string = crmWeb.outputs.hostingPlan
output crmLinkedApiResourceId string = crmWeb.outputs.linkedApiResourceId
output storageAccountName string = crmApi.outputs.runtimeStorageName
output blobContainerNames array = crmApi.outputs.blobContainerNames
output queueNames array = crmApi.outputs.queueNames
output tableNames array = crmApi.outputs.tableNames
output applicationInsightsName string = crmApi.outputs.applicationInsightsName
output logAnalyticsWorkspaceName string = crmApi.outputs.logAnalyticsWorkspaceName
output runtimeName string = crmApi.outputs.runtimeName
output runtimeVersion string = crmApi.outputs.runtimeVersion
output installerIdentityName string = crmWeb.outputs.installerIdentityName
