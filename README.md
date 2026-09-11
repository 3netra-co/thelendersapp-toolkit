# The Lenders App Toolkit

The Lenders App Toolkit is an early-stage open-source mortgage workspace. The
goal is a customer-owned platform that can grow from CRM into POS and LOS
capabilities without locking its data or workflows to The Lenders App.

## Repository map

| Path | Purpose |
| --- | --- |
| [`apps/installer-portal`](apps/installer-portal) | Public installation and contributor portal hosted at [toolkit.thelenders.app](https://toolkit.thelenders.app) |
| [`apps/workspace`](apps/workspace) | Installable customer PWA for CRM, future POS, and future LOS experiences |
| [`services/workspace-api`](services/workspace-api) | Customer-owned Python API, background jobs, workflows, and integration adapters |
| [`infra/azure/platform`](infra/azure/platform) | Azure infrastructure for the public installer portal operated by The Lenders App |
| [`infra/azure/customer`](infra/azure/customer) | Reusable Azure reference deployment installed into a customer's subscription |
| [`packages/contracts`](packages/contracts) | Cloud-neutral event and provider contracts |
| [`docs`](docs) | Architecture decisions, delivery roadmap, and contributor guidance |

The workspace uses one modular backend. CRM, POS, LOS, communications,
automation, and integrations are domain modules—not separate APIs by default.
An independently deployed service is introduced only for a demonstrated
security, reliability, scaling, or regulatory boundary.

## Run the installer portal

```sh
cd apps/installer-portal
npm ci
npm run dev
```

## Run the workspace PWA

```sh
cd apps/workspace
npm ci
npm run dev
```

The PWA proxies `/api` to a local Azure Functions host on port 7071. See
[`services/workspace-api/README.md`](services/workspace-api/README.md) for the
backend instructions.

## Architecture

- [Architecture direction](docs/ARCHITECTURE.md)
- [Azure delivery roadmap](docs/AZURE_INSTALLER_ROADMAP.md)
- [Cloud provider capability contract](packages/contracts/contracts/CLOUD_PROVIDER.md)
- [Connector contract](packages/contracts/CONNECTORS.md)
- [Resource naming](docs/RESOURCE_NAMING.md)
- [Deployment history](docs/DEPLOYMENT_HISTORY.md)

## Status

This project is pre-production. Do not use it with borrower, lender,
credential, or other confidential data.

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[security policy](SECURITY.md) before submitting a change or vulnerability
report.

## License

Licensed under the [MIT License](LICENSE).
