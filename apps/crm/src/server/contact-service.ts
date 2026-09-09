import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

export interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface Contact extends Required<ContactInput> {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

type ContactRow = {
  id: string;
  workspace_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  version: number;
};

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

export class ContactService {
  constructor(
    private readonly database: DatabaseSync,
    private readonly workspaceId: string,
  ) {}

  list(): Contact[] {
    return this.database
      .prepare(`SELECT * FROM contacts WHERE workspace_id = ? ORDER BY updated_at DESC`)
      .all(this.workspaceId)
      .map((row) => mapContact(row as ContactRow));
  }

  create(input: ContactInput): Contact {
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();
    if (!firstName || !lastName) {
      throw new Error("First name and last name are required.");
    }

    const now = new Date().toISOString();
    const contact: Contact = {
      id: randomUUID(),
      workspaceId: this.workspaceId,
      firstName,
      lastName,
      email: input.email?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    const eventId = randomUUID();

    this.database.exec("BEGIN IMMEDIATE;");
    try {
      this.database.prepare(`
        INSERT INTO contacts (
          id, workspace_id, first_name, last_name, email, phone,
          created_at, updated_at, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        contact.id, contact.workspaceId, contact.firstName, contact.lastName,
        contact.email, contact.phone, contact.createdAt, contact.updatedAt, contact.version,
      );
      this.database.prepare(`
        INSERT INTO outbox_events (
          id, workspace_id, event_type, record_type, record_id, payload, occurred_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId, contact.workspaceId, "contact.created", "contact", contact.id,
        JSON.stringify(contact), now,
      );
      this.database.exec("COMMIT;");
    } catch (error) {
      this.database.exec("ROLLBACK;");
      throw error;
    }

    return contact;
  }

  eventCount(): number {
    const row = this.database.prepare(
      "SELECT COUNT(*) AS count FROM outbox_events WHERE workspace_id = ?",
    ).get(this.workspaceId);
    return Number(row?.count ?? 0);
  }
}
