import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import type { ServerConfig } from "./config.js";
import { initDatabase } from "./db/index.js";
import { ErrorRepository } from "./db/repositories/error-repository.js";
import { EventRepository } from "./db/repositories/event-repository.js";
import { RequestRepository } from "./db/repositories/request-repository.js";
import { ProjectRepository } from "./db/repositories/project-repository.js";
import { createEventsRouter } from "./api/routes/events.js";
import { createErrorsRouter } from "./api/routes/errors.js";
import { createRequestsRouter } from "./api/routes/requests.js";
import { createStatsRouter } from "./api/routes/stats.js";
import { createHealthRouter } from "./api/routes/health.js";
import { createProjectsRouter } from "./api/routes/projects.js";

export interface AppContext {
  app: Express;
  errorRepo: ErrorRepository;
  eventRepo: EventRepository;
  requestRepo: RequestRepository;
}

export function createApp(config: ServerConfig): AppContext {
  const db = initDatabase(config.dbPath);

  const errorRepo = new ErrorRepository(db);
  const eventRepo = new EventRepository(db);
  const requestRepo = new RequestRepository(db);
  const projectRepo = new ProjectRepository(db);

  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  // API routes
  app.use("/api/events", createEventsRouter(errorRepo, eventRepo, requestRepo, projectRepo));
  app.use("/api/errors", createErrorsRouter(errorRepo, eventRepo));
  app.use("/api/requests", createRequestsRouter(requestRepo));
  app.use("/api/stats", createStatsRouter(errorRepo, eventRepo, requestRepo));
  app.use("/api/health", createHealthRouter());
  app.use("/api/projects", createProjectsRouter(projectRepo));

  // Clear endpoint
  app.post("/api/clear", (_req, res) => {
    try {
      errorRepo.clearAll();
      requestRepo.clearAll();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to clear data" });
    }
  });

  // Serve dashboard static files
  if (config.dashboardEnabled) {
    const dashboardDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "dashboard",
      "dist"
    );
    app.use(express.static(dashboardDir));
    // SPA fallback
    app.get("*", (_req, res, next) => {
      if (_req.path.startsWith("/api/") || _req.path === "/ws") {
        next();
        return;
      }
      res.sendFile(path.join(dashboardDir, "index.html"), (err) => {
        if (err) next();
      });
    });
  }

  return { app, errorRepo, eventRepo, requestRepo };
}
