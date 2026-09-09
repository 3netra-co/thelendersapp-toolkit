import path from "node:path";

export interface AppConfig {
  dataDirectory: string;
  port: number;
  workspaceId: string;
}

export function loadConfig(): AppConfig {
  return {
    dataDirectory: path.resolve(process.env.DATA_DIR ?? "./data"),
    port: Number(process.env.PORT ?? "8787"),
    workspaceId: process.env.WORKSPACE_ID ?? "local-workspace",
  };
}
