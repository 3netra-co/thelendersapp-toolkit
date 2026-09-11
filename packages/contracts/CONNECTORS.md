# Connector contract

Connectors integrate external systems without placing provider-specific fields
or authentication inside the CRM, POS, or LOS domain models.

Examples include ARIVE, Encompass, Polly, Salesforce, lead aggregators,
Microsoft 365, Google Workspace, ACS, and Telnyx.

## Required connector declaration

Every connector must publish:

- provider and connector name;
- connector and supported API versions;
- capabilities such as import, export, webhook ingestion, polling, or commands;
- authentication method and exact permissions requested;
- supported entities and operations;
- rate limits, retry rules, and idempotency behavior;
- webhook verification and replay protection;
- source-to-Toolkit mapping version;
- handling of unknown or unsupported fields;
- data classification and retention impact; and
- fixtures, contract tests, and removal instructions.

## Runtime boundary

Connectors receive provider payloads and produce the shared event envelope.
They preserve the original payload and a transformation report alongside the
normalized event. They do not write directly to projection tables or bypass
workspace authorization, audit, consent, and workflow controls.

## AI-assisted connector development

A prompt such as “connect to ARIVE” may be used to generate a connector plan,
mapping draft, implementation scaffold, and tests. Generated output is a code
contribution, not trusted configuration. It must pass the same permission
review, secret scanning, fixtures, contract tests, replay tests, and maintainer
approval as human-written code. Production credentials are never included in
prompts, fixtures, source code, or pull requests.
