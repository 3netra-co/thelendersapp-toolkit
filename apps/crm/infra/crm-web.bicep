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

@description('Public HTTPS URL of the versioned compiled CRM PWA package.')
param webPackageUri string

@description('Globally unique Static Web App name for the customer CRM.')
param staticWebAppName string = 'stapp-${installationName}-crm-${environmentName}-${take(uniqueString(subscription().id, resourceGroup().id), 6)}'

var tags = {
  product: 'thelendersapp-toolkit-crm'
  environment: environmentName
  'managed-by': 'bicep'
  purpose: 'customer-crm-web'
  installation: installationName
}
var contributorRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  'b24988ac-6180-42a0-ab88-20f7382dd24c'
)

resource installerIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${installationName}-crm-installer-${environmentName}'
  location: location
  tags: tags
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

resource webDeploymentRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(crmWeb.id, installerIdentity.id, contributorRoleId)
  scope: crmWeb
  properties: {
    principalId: installerIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: contributorRoleId
  }
}

resource webPackageDeployment 'Microsoft.Resources/deploymentScripts@2023-08-01' = {
  name: 'deploy-${installationName}-crm-web-${environmentName}'
  location: location
  kind: 'AzureCLI'
  identity: {
    type: 'userAssigned'
    userAssignedIdentities: {
      '${installerIdentity.id}': {}
    }
  }
  properties: {
    azCliVersion: '2.67.0'
    cleanupPreference: 'OnSuccess'
    forceUpdateTag: webPackageUri
    retentionInterval: 'P1D'
    timeout: 'PT15M'
    scriptContent: '''
      cat > web-deployment.json <<'JSON'
      {
        "properties": {
          "appZipUrl": "${webPackageUri}",
          "deploymentTitle": "The Lenders App Toolkit CRM",
          "provider": "The Lenders App Toolkit"
        }
      }
      JSON

      az rest \
        --method post \
        --url "${trim(environment().resourceManager, '/')}${crmWeb.id}/zipdeploy?api-version=2024-11-01" \
        --body @web-deployment.json \
        --output none

      application_url="https://${crmWeb.properties.defaultHostname}"
      for attempt in $(seq 1 60); do
        if curl --fail --silent --show-error "$application_url" >/dev/null \
          && curl --fail --silent --show-error "$application_url/api/v1/health" >/dev/null; then
          exit 0
        fi
        sleep 10
      done

      echo "The CRM application or API did not become healthy within 10 minutes." >&2
      exit 1
    '''
  }
  dependsOn: [
    webDeploymentRole
  ]
}

output staticWebAppName string = crmWeb.name
output applicationUrl string = 'https://${crmWeb.properties.defaultHostname}'
output hostingPlan string = crmWeb.sku.name
output linkedApiResourceId string = crmApiBackend.properties.backendResourceId
output installerIdentityName string = installerIdentity.name
