# The Lenders App Toolkit

The Lenders App Toolkit is an early-stage collection of customer-owned,
open-source mortgage applications. CRM is the first application; POS, LOS, and
other offerings can be added as independently installable products.

## Repository map

| Path | Purpose |
| --- | --- |
| [`apps/crm`](apps/crm) | CRM PWA, Python API, Azure infrastructure, tests, and product documentation |
| [`packages/contracts`](packages/contracts) | Cloud-neutral event and provider contracts |
| [`docs`](docs) | Architecture decisions, delivery roadmap, and contributor guidance |

Each application owns its runtime, storage, authorization, deployment, and
release lifecycle. Applications integrate through versioned APIs and events;
they do not read one another's databases directly.

The curated catalog at [toolkit.thelenders.app](https://toolkit.thelenders.app)
is operated separately. This public repository contains the open-source
offerings and customer-owned deployment code linked from that catalog.

## Run the CRM PWA

```sh
cd apps/crm/web
npm ci
npm run dev
```

The PWA proxies `/api` to a local Azure Functions host on port 7071. See
[`apps/crm/api/README.md`](apps/crm/api/README.md) for the
backend instructions.

## Architecture

- [Architecture direction](docs/ARCHITECTURE.md)
- [Azure delivery roadmap](docs/AZURE_INSTALLER_ROADMAP.md)
- [Cloud provider capability contract](packages/contracts/contracts/CLOUD_PROVIDER.md)
- [Connector contract](packages/contracts/CONNECTORS.md)
- [Resource naming](docs/RESOURCE_NAMING.md)

## Status

This project is pre-production. Do not use it with borrower, lender,
credential, or other confidential data.

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[security policy](SECURITY.md) before submitting a change or vulnerability
report.

## License

Licensed under the [MIT License](LICENSE).
