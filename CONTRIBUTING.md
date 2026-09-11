# Contributing

Thank you for helping build The Lenders App Toolkit.

## Before opening a pull request

1. Open or reference an issue for changes that affect architecture, security,
   data contracts, identity, deployment, or customer cost.
2. Keep provider-specific behavior behind a connector or cloud-provider
   contract.
3. Never commit credentials, deployment tokens, customer data, or production
   payloads. Use synthetic fixtures.
4. Add or update tests for changed behavior.
5. Run the relevant checks documented in the component README.
6. Explain security, migration, compatibility, and cost effects in the pull
   request.

All changes enter `main` through a reviewed pull request and required automated
checks. Contributors must not force-push or attempt to bypass repository rules.

Generated or AI-assisted code is welcome, but the contributor remains
responsible for its correctness, licensing, permissions, tests, and security.
See the [connector contract](packages/contracts/CONNECTORS.md) for integration
work.
