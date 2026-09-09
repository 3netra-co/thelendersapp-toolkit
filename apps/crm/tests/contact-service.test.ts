import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ContactService } from "../src/server/contact-service.js";
import { openDatabase } from "../src/server/database.js";

test("creating a contact also records an outbox event", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tla-crm-"));
  const database = openDatabase(directory);
  try {
    const service = new ContactService(database, "test-workspace");
    const contact = service.create({ firstName: "Ada", lastName: "Lovelace", email: "ada@example.test" });
    assert.equal(service.list()[0].id, contact.id);
    assert.equal(service.eventCount(), 1);
  } finally {
    database.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("contacts are isolated by workspace", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tla-crm-"));
  const database = openDatabase(directory);
  try {
    new ContactService(database, "workspace-one").create({ firstName: "Test", lastName: "One" });
    assert.equal(new ContactService(database, "workspace-two").list().length, 0);
  } finally {
    database.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
