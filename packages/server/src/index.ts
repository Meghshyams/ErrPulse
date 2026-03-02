import http from "http";
import type { Express } from "express";
import { createApp, type AppContext } from "./app.js";
import { resolveConfig, type ServerConfig } from "./config.js";
import { initWebSocket } from "./ws/index.js";
import { closeDatabase } from "./db/index.js";

export { resolveConfig } from "./config.js";
export type { ServerConfig } from "./config.js";
export { createApp } from "./app.js";
export type { AppContext } from "./app.js";

export interface ServerContext {
  server: http.Server;
  app: Express;
  config: ServerConfig;
}

export function createServer(partial?: Partial<ServerConfig>): ServerContext {
  const config = resolveConfig(partial);
  const { app } = createApp(config);
  const server = http.createServer(app);

  initWebSocket(server);

  return { server, app, config };
}

export async function startServer(partial?: Partial<ServerConfig>): Promise<{
  server: http.Server;
  config: ServerConfig;
  close: () => void;
}> {
  const { server, config } = createServer(partial);

  return new Promise((resolve) => {
    server.listen(config.port, config.host, () => {
      console.log(`\n  ErrLens running at http://localhost:${config.port}\n`);
      console.log(`  Dashboard:  http://localhost:${config.port}`);
      console.log(`  API:        http://localhost:${config.port}/api`);
      console.log(`  WebSocket:  ws://localhost:${config.port}/ws\n`);

      const close = () => {
        server.close();
        closeDatabase();
      };

      process.on("SIGINT", () => {
        close();
        process.exit(0);
      });

      process.on("SIGTERM", () => {
        close();
        process.exit(0);
      });

      resolve({ server, config, close });
    });
  });
}
