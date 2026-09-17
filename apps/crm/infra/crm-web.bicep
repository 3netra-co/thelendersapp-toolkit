@description('Azure region for the customer-owned CRM web application.')
param location string

@description('Durable environment name used for tags and resource names.')
@allowed([
  'development'
  'production'
])
param environmentName string

@description('Installation name chosen by the customer.')
param installationName string

@description('Resource ID of the customer-owned CRM Function App linked at the /api route.')
param functionAppResourceId string

@description('Azure region containing the linked CRM Function App.')
param functionAppRegion string

@description('Globally unique Static Web App name for the customer CRM.')
param staticWebAppName string = 'stapp-${installationName}-crm-${environmentName}-${take(uniqueString(subscription().id, resourceGroup().id), 6)}'

var tags = {
  product: 'thelendersapp-toolkit-crm'
  environment: environmentName
  'managed-by': 'bicep'
  purpose: 'customer-crm-web'
  installation: installationName
}

resource crmWeb 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

resource crmApiBackend 'Microsoft.Web/staticSites/linkedBackends@2023-12-01' = {
  parent: crmWeb
  name: last(split(functionAppResourceId, '/'))
  properties: {
    backendResourceId: functionAppResourceId
    region: functionAppRegion
  }
}

output staticWebAppName string = crmWeb.name
output applicationUrl string = 'https://${crmWeb.properties.defaultHostname}'
output hostingPlan string = crmWeb.sku.name
output linkedApiResourceId string = crmApiBackend.properties.backendResourceId
