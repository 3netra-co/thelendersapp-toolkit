import fs from "node:fs";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ContactInput } from "./contact-service.js";
import { ContactService } from "./contact-service.js";
import type { DatabaseSync } from "node:sqlite";

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

async function readJson(request: IncomingMessage): Promise<ContactInput> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 64 * 1024) throw new Error("Request is too large.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as ContactInput;
}

export function createApp(database: DatabaseSync, workspaceId: string): http.Server {
  const contacts = new ContactService(database, workspaceId);
  const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../web");

  return http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/api/v1/health") {
        return sendJson(response, 200, { status: "ok" });
      }
      if (request.method === "GET" && url.pathname === "/api/v1/contacts") {
        return sendJson(response, 200, { contacts: contacts.list() });
      }
      if (request.method === "POST" && url.pathname === "/api/v1/contacts") {
        return sendJson(response, 201, { contact: contacts.create(await readJson(request)) });
      }
      if (request.method === "GET" && url.pathname === "/api/v1/events/count") {
        return sendJson(response, 200, { count: contacts.eventCount() });
      }
      if (url.pathname.startsWith("/api/")) {
        return sendJson(response, 404, { error: "Not found" });
      }

      const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const candidate = path.resolve(webRoot, requested);
      const file = candidate.startsWith(webRoot) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
        ? candidate
        : path.join(webRoot, "index.html");
      if (!fs.existsSync(file)) {
        return sendJson(response, 503, { error: "Web application has not been built." });
      }
      response.writeHead(200, { "content-type": contentType(file) });
      fs.createReadStream(file).pipe(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      sendJson(response, message.includes("required") || message.includes("JSON") ? 400 : 500, { error: message });
    }
  });
}

function contentType(file: string): string {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}
