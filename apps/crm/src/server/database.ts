import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const migrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE contacts (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
      );

      CREATE INDEX contacts_workspace_updated
      ON contacts (workspace_id, updated_at DESC);

      CREATE TABLE outbox_events (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        record_type TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        processed_at TEXT,
        attempts INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX outbox_unprocessed
      ON outbox_events (processed_at, occurred_at);
    `,
  },
];

export function openDatabase(dataDirectory: string): DatabaseSync {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const database = new DatabaseSync(path.join(dataDirectory, "crm.sqlite"));
  database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = database.prepare("SELECT version FROM schema_migrations").all();
  const appliedVersions = new Set(applied.map((row) => Number(row.version)));

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;
    database.exec("BEGIN IMMEDIATE;");
    try {
      database.exec(migration.sql);
      database
        .prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)")
        .run(migration.version, new Date().toISOString());
      database.exec("COMMIT;");
    } catch (error) {
      database.exec("ROLLBACK;");
      throw error;
    }
  }

  return database;
}
