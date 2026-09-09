# Cloud provider capability contract

A cloud implementation may use provider-native services and terminology, but
it must supply the following capabilities without changing the core domain or
event contracts.

| Capability | Required behavior | Azure V1 candidate |
| --- | --- | --- |
| Web host | HTTPS delivery of the installable PWA | Static Web Apps |
| Function runtime | HTTP, queue, storage, and scheduled execution | Azure Functions |
| Object store | Durable immutable events, source payloads, and documents | Blob Storage |
| Projection store | Low-latency query models that can be rebuilt | Table Storage |
| Queue | Retryable, duplicate-tolerant asynchronous delivery | Queue Storage |
| Secret store | Encrypted provider credentials outside application data | Key Vault |
| Identity | User authentication and workload identity | Entra ID / managed identity |
| Monitoring | Health, failure, audit, and cost signals | Azure Monitor |
| Cost controls | Estimate plus budget notifications | Azure Cost Management |

## Required deployment outputs

Every implementation must return machine-readable outputs for:

- application URL;
- API URL used by the client;
- installation and cloud-account identifiers;
- region;
- deployed Toolkit version;
- storage locations;
- health-check result;
- cost-alert configuration; and
- export and uninstall instructions.

## Lifecycle requirements

Implementations must provide repeatable install and upgrade operations, use
least-privilege workload identities, avoid permanent maintainer credentials,
preserve customer data during application upgrades, and provide a tested export
before destructive removal.

The implementation must identify which removal action retains authoritative
data and which action permanently deletes it. A provider integration is not
conformant merely because it can create resources.

## Conformance scenarios

At minimum, an implementation must pass:

1. clean deployment into an authorized account;
2. create, update, read, and replay of a contact;
3. duplicate event delivery without duplicate effects;
4. queue retry and failed-message visibility;
5. scheduled execution with all clients closed;
6. projection deletion and rebuild;
7. application upgrade without authoritative-data loss;
8. complete customer export; and
9. documented retention and full-removal paths.
