# Resource naming

Names describe ownership, purpose, environment, and—where useful—region. Avoid
generic component names such as `app`, `api`, `web`, or `test` without their
business purpose.

## Repository vocabulary

| Name | Meaning |
| --- | --- |
| installer portal | Public site that explains and starts an installation |
| workspace | Customer-facing PWA containing CRM and future POS/LOS experiences |
| workspace API | Customer-owned backend for the unified workspace |
| platform infrastructure | Resources operated by The Lenders App for the installer |
| customer infrastructure | Resources installed into a customer's cloud account |
| connector | Versioned adapter for an external system such as ARIVE or Encompass |

## Azure convention

Azure resource names use this order:

```text
<resource-type>-<product>-<purpose>-<environment>[-<region>]
```

The maintained platform uses:

```text
Resource group:    rg-thelendersapp-toolkit-platform-production
Static Web App:    stapp-thelendersapp-installer-production
```

Customer deployments use the customer's installation name:

```text
Resource group:    rg-<installation>-workspace-production
Static Web App:    stapp-<installation>-workspace-production
Function App:      func-<installation>-workspace-production
Storage account:   st<installation><generated-suffix>
```

Azure storage accounts require lowercase letters and numbers, so their names
cannot follow the hyphenated convention exactly. A deterministic suffix avoids
global-name collisions.

`production` and `development` describe durable environments. Automated checks
use disposable resource groups that include a pull-request or run identifier;
we do not keep permanently ambiguous resources named `test`.

## Code naming

Use complete domain words in public modules and deployment outputs. Provider
abbreviations are acceptable only when they are established product names,
such as `azure`, `aws`, `entra`, `acs`, `arive`, or `encompass`.
