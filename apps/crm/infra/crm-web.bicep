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
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

output staticWebAppName string = crmWeb.name
output applicationUrl string = 'https://${crmWeb.properties.defaultHostname}'
