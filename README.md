# The Lenders App Toolkit

The Lenders App Toolkit is an open-source project in its earliest development
stage.

The repository currently contains:

- The public placeholder site at [toolkit.thelenders.app](https://toolkit.thelenders.app)
- The isolated AWS CDK deployment for that site

The first local CRM shell has not been implemented yet. Its scope and
architecture will be established through working code and documented decisions
as the project develops.

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
