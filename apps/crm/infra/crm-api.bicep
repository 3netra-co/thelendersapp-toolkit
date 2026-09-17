@description('Azure region for the customer-owned CRM API resources.')
param location string = resourceGroup().location

@description('Durable environment name used for tags and resource names.')
@allowed([
  'development'
  'production'
])
param environmentName string = 'production'

@description('Installation name chosen by the customer; use lowercase letters, numbers, and hyphens.')
@minLength(3)
@maxLength(20)
param installationName string

@description('Globally unique customer CRM Function App name.')
param functionAppName string = 'func-${installationName}-crm-${environmentName}-${take(uniqueString(subscription().id, resourceGroup().id), 6)}'

@description('Globally unique CRM runtime and deployment storage account name.')
param storageAccountName string = 'st${take(replace(installationName, '-', ''), 8)}crm${take(uniqueString(subscription().id, resourceGroup().id), 8)}'

@description('Flex Consumption plan for the customer CRM API.')
param hostingPlanName string = 'plan-${installationName}-crm-functions-${environmentName}'

@description('Log Analytics workspace used for bounded CRM operational diagnostics.')
param logAnalyticsWorkspaceName string = 'log-${installationName}-crm-${environmentName}'

@description('Application Insights resource used for Function failures and performance telemetry.')
param applicationInsightsName string = 'appi-${installationName}-crm-${environmentName}'

var deploymentContainerName = 'app-package-${take(functionAppName, 32)}'
var domainEventsContainerName = 'domain-events'
var sourcePayloadsContainerName = 'source-payloads'
var documentsContainerName = 'documents'
var projectionQueueName = 'projection-events'
var workflowQueueName = 'workflow-events'
var projectionTableNames = [
  'Organizations'
  'Branches'
  'StaffProfiles'
  'IdentityLinks'
  'Memberships'
  'LoginAudit'
]
var storageBlobDataOwnerRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'
)
var storageQueueDataContributorRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
)
var storageTableDataContributorRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
)
var tags = {
  product: 'thelendersapp-toolkit'
  environment: environmentName
  'managed-by': 'bicep'
  purpose: 'customer-crm-api'
  installation: installationName
}

resource runtimeStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: runtimeStorage
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource deploymentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: deploymentContainerName
  properties: {
    publicAccess: 'None'
  }
}

resource domainEventsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: domainEventsContainerName
  properties: {
    publicAccess: 'None'
  }
}

resource sourcePayloadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: sourcePayloadsContainerName
  properties: {
    publicAccess: 'None'
  }
}

resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: documentsContainerName
  properties: {
    publicAccess: 'None'
  }
}

resource queueService 'Microsoft.Storage/storageAccounts/queueServices@2023-05-01' = {
  parent: runtimeStorage
  name: 'default'
}

resource projectionQueue 'Microsoft.Storage/storageAccounts/queueServices/queues@2023-05-01' = {
  parent: queueService
  name: projectionQueueName
}

resource workflowQueue 'Microsoft.Storage/storageAccounts/queueServices/queues@2023-05-01' = {
  parent: queueService
  name: workflowQueueName
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' = {
  parent: runtimeStorage
  name: 'default'
}

resource projectionTables 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = [for tableName in projectionTableNames: {
  parent: tableService
  name: tableName
}]

resource hostingPlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: hostingPlanName
  location: location
  tags: tags
  kind: 'functionapp'
  sku: {
    name: 'FC1'
    tier: 'FlexConsumption'
  }
  properties: {
    reserved: true
    zoneRedundant: false
  }
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: json('0.1')
    }
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    IngestionMode: 'LogAnalytics'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 30
  }
}

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    serverFarmId: hostingPlan.id
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${runtimeStorage.properties.primaryEndpoints.blob}${deploymentContainer.name}'
          authentication: {
            type: 'SystemAssignedIdentity'
          }
        }
      }
      runtime: {
        name: 'python'
        version: '3.12'
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 2
        instanceMemoryMB: 512
        alwaysReady: []
      }
    }
    siteConfig: {
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'AzureWebJobsStorage__credential'
          value: 'managedidentity'
        }
        {
          name: 'AzureWebJobsStorage__accountName'
          value: runtimeStorage.name
        }
        {
          name: 'CRM_STORAGE_ACCOUNT_NAME'
          value: runtimeStorage.name
        }
        {
          name: 'AzureWebJobsFeatureFlags'
          value: 'EnableWorkerIndexing'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
      ]
    }
  }
}

resource blobRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(runtimeStorage.id, functionApp.id, storageBlobDataOwnerRoleId)
  scope: runtimeStorage
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageBlobDataOwnerRoleId
  }
}

resource queueRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(runtimeStorage.id, functionApp.id, storageQueueDataContributorRoleId)
  scope: runtimeStorage
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageQueueDataContributorRoleId
  }
}

resource tableRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(runtimeStorage.id, functionApp.id, storageTableDataContributorRoleId)
  scope: runtimeStorage
  properties: {
    principalId: functionApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageTableDataContributorRoleId
  }
}

output functionAppName string = functionApp.name
output functionAppId string = functionApp.id
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output runtimeName string = functionApp.properties.functionAppConfig.runtime.name
output runtimeVersion string = functionApp.properties.functionAppConfig.runtime.version
output runtimeStorageName string = runtimeStorage.name
output blobContainerNames array = [
  domainEventsContainer.name
  sourcePayloadsContainer.name
  documentsContainer.name
]
output queueNames array = [
  projectionQueue.name
  workflowQueue.name
]
output tableNames array = projectionTableNames
output applicationInsightsName string = applicationInsights.name
output logAnalyticsWorkspaceName string = logAnalytics.name
