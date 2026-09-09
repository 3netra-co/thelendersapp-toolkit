# The Lenders App Toolkit

The Lenders App Toolkit is an open-source project in its earliest development
stage.

The repository currently contains:

- The public placeholder site at [toolkit.thelenders.app](https://toolkit.thelenders.app)
- The isolated AWS CDK deployment for that site
- A containerized local CRM test application

## Local CRM test

The first CRM shell is in [`apps/crm`](apps/crm). It runs locally in Docker with
a React interface, Node.js API, SQLite persistence, and a transactional event
outbox.

Follow [`docs/LOCAL_TEST_APP.md`](docs/LOCAL_TEST_APP.md) to start it, test data
persistence, develop locally, or reset its test data.

The proposed Azure-first PWA architecture, including POS/LOS portability rules,
is recorded in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Alternative cloud
implementations should follow the
[`cloud provider capability contract`](docs/contracts/CLOUD_PROVIDER.md).

## Public site

The React source is in [`apps/toolkit-site`](apps/toolkit-site).

```sh
cd apps/toolkit-site
npm ci
npm run dev
```

## Site infrastructure

The toolkit-only deployment is in [`deploy/toolkit-site`](deploy/toolkit-site).
It imports the existing `thelenders.app` Route 53 hosted zone but owns only the
resources for `toolkit.thelenders.app`.

See [`deploy/toolkit-site/README.md`](deploy/toolkit-site/README.md) before
reviewing or deploying infrastructure changes.

## Status

This project is pre-production. Do not use it with borrower, lender, credential,
or other confidential data.

## License

Licensed under the [MIT License](LICENSE).
