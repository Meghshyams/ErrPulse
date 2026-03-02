import { DEFAULT_SERVER_PORT, DEFAULT_DB_DIR, DEFAULT_DB_FILENAME } from "@errlens/core";
import path from "path";
import os from "os";

export interface ServerConfig {
  port: number;
  host: string;
  dbPath: string;
  corsOrigin: string | string[] | boolean;
  dashboardEnabled: boolean;
}

export function resolveConfig(partial?: Partial<ServerConfig>): ServerConfig {
  const dbDir = path.join(os.homedir(), DEFAULT_DB_DIR);

  return {
    port:
      partial?.port ??
      (process.env.ERRLENS_PORT ? Number(process.env.ERRLENS_PORT) : DEFAULT_SERVER_PORT),
    host: partial?.host ?? process.env.ERRLENS_HOST ?? "0.0.0.0",
    dbPath: partial?.dbPath ?? path.join(dbDir, DEFAULT_DB_FILENAME),
    corsOrigin: partial?.corsOrigin ?? true,
    dashboardEnabled: partial?.dashboardEnabled ?? true,
  };
}
