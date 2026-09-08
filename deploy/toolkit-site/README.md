# Toolkit public site deployment

This CDK application owns only the production resources for
`toolkit.thelenders.app`. It imports the existing `thelenders.app` Route 53
hosted zone and must not modify the public site's distribution, buckets,
certificate, or root/`www` records.

## Deploy

Build the static site first:

```sh
cd apps/toolkit-site
npm ci
npm run build
```

Then review and deploy using the TLA AWS SSO profile:

```sh
cd deploy/toolkit-site
npm ci
npm run build
npx cdk diff --profile tla-admin
npx cdk deploy --profile tla-admin
```

The stack runs in `us-east-1`, where CloudFront viewer certificates must be
created. Production deployment is intentionally manual for now. The placeholder
uses CloudFront's managed caching-disabled policy so deployments do not require
an account-wide cache-invalidation permission.
