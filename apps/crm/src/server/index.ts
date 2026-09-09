import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { openDatabase } from "./database.js";

const config = loadConfig();
const database = openDatabase(config.dataDirectory);
const server = createApp(database, config.workspaceId);

server.listen(config.port, "0.0.0.0", () => {
  console.log(`The Lenders App CRM is available on http://localhost:${config.port}`);
});

function shutdown(): void {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
