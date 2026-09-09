# Local CRM test app

This guide records how the first test application was assembled and how to run
it. It is intended for maintainers, testers, and first-time contributors.

## What this is

V0 is a local CRM shell containing a React interface, a Node.js API, and an
embedded SQLite database. Docker packages them as one service and stores the
database in a named volume so test contacts survive restarts.

It is separate from `apps/toolkit-site` and `deploy/toolkit-site`. Running or
changing the local app does not deploy or modify `toolkit.thelenders.app`.

Do not enter borrower, lender, credentials, or other confidential information.

## Start it

Requirements:

- Docker Desktop (or another Docker-compatible container runtime)
- Git

From the repository root:

```sh
docker compose -f deploy/local/compose.yaml up --build -d
```

Open <http://localhost:8787>. Add a test contact and confirm that the contact
and recorded-event counters both increase.

Check the service:

```sh
docker compose -f deploy/local/compose.yaml ps
curl http://localhost:8787/api/v1/health
```

## Persistence test

Stop and start the service, then confirm the contact is still present:

```sh
docker compose -f deploy/local/compose.yaml down
docker compose -f deploy/local/compose.yaml up -d
```

`down` does not delete the named `crm-data` volume. The data is removed only
when the volume is deliberately deleted.

## Stop or reset

Stop without deleting test data:

```sh
docker compose -f deploy/local/compose.yaml down
```

Reset by deleting the test database volume:

```sh
docker compose -f deploy/local/compose.yaml down --volumes
```

The reset command permanently removes the local test contacts.

## Contributor development

Node.js 24 or newer is required when running outside Docker because the API
uses Node's built-in SQLite support.

```sh
cd apps/crm
npm ci
npm run dev
```

The development interface is at <http://localhost:5173>; its API runs at
<http://localhost:8787>. Before proposing a change:

```sh
npm run typecheck
npm test
npm run build
```

## Recorded implementation decisions

1. The CRM is a modular monolith rather than several services. This keeps local
   installation small while preserving boundaries inside the code.
2. SQLite is stored in `/data` inside the container and backed by a named Docker
   volume. Application code reaches it through a service boundary.
3. Schema changes are versioned in `schema_migrations`; editing a live table by
   hand is not the upgrade mechanism.
4. Every record carries `workspace_id`, allowing later organization isolation.
5. Creating a contact and its `contact.created` outbox event happens in one
   transaction. A future worker can deliver those events without changing the
   contact-saving contract.
6. The container binds only to `127.0.0.1`. V0 has no authentication and must
   not be exposed to a network or the public internet.
7. The API is versioned under `/api/v1` so future clients have a stable contract.

## Future scale path

SQLite remains the local reference and test store. The Azure V1 design uses
immutable Blob records as authoritative history, Table Storage for rebuildable
query projections, Queue Storage for event delivery, and Functions for API and
background execution. See [`ARCHITECTURE.md`](ARCHITECTURE.md).

Authentication, teams, cloud storage, and external event delivery will be
introduced deliberately; they are not implied by the local V0 shell.

For the second-laptop test, clone the repository and follow **Start it**. For
the contributor-laptop test, fork the repository, create a feature branch, run
the checks above, and submit a pull request.
