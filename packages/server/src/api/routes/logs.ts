import { Router } from "express";
import { generateEventId } from "@errpulse/core";
import { LogRepository } from "../../db/repositories/log-repository.js";
import { ProjectRepository } from "../../db/repositories/project-repository.js";
import { broadcast } from "../../ws/broadcaster.js";

export function createLogsRouter(logRepo: LogRepository, projectRepo: ProjectRepository): Router {
  const router = Router();

  // POST /api/logs — ingest a single log entry
  router.post("/", (req, res) => {
    try {
      const body = req.body;

      if (!body.message || !body.level) {
        res.status(400).json({ error: "Missing required fields: message, level" });
        return;
      }

      if (body.projectId && projectRepo) {
        projectRepo.findOrCreate(body.projectId);
      }

      const id = logRepo.insert({
        id: body.id || generateEventId(),
        level: body.level,
        message: body.message,
        timestamp: body.timestamp || new Date().toISOString(),
        source: body.source || "backend",
        environment: body.environment,
        correlationId: body.correlationId,
        projectId: body.projectId,
        extra: body.extra,
      });

      const entry = {
        id,
        level: body.level,
        message: body.message,
        timestamp: body.timestamp || new Date().toISOString(),
        source: body.source || "backend",
        correlationId: body.correlationId,
        projectId: body.projectId,
      };

      broadcast({ type: "new_log", payload: entry });

      res.status(201).json({ id });
    } catch (err) {
      console.error("[ErrPulse] Failed to ingest log:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/logs/batch — ingest multiple log entries
  router.post("/batch", (req, res) => {
    try {
      const logs = req.body;
      if (!Array.isArray(logs)) {
        res.status(400).json({ error: "Expected an array of logs" });
        return;
      }

      const ids: string[] = [];
      for (const body of logs) {
        if (!body.message || !body.level) continue;

        if (body.projectId && projectRepo) {
          projectRepo.findOrCreate(body.projectId);
        }

        const id = logRepo.insert({
          id: body.id || generateEventId(),
          level: body.level,
          message: body.message,
          timestamp: body.timestamp || new Date().toISOString(),
          source: body.source || "backend",
          environment: body.environment,
          correlationId: body.correlationId,
          projectId: body.projectId,
          extra: body.extra,
        });

        broadcast({
          type: "new_log",
          payload: {
            id,
            level: body.level,
            message: body.message,
            timestamp: body.timestamp || new Date().toISOString(),
            source: body.source || "backend",
            correlationId: body.correlationId,
            projectId: body.projectId,
          },
        });

        ids.push(id);
      }

      res.status(201).json(ids);
    } catch (err) {
      console.error("[ErrPulse] Failed to ingest log batch:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/logs — list logs with filtering
  router.get("/", (req, res) => {
    try {
      const { page, pageSize, projectId, level, source, search } = req.query;
      const result = logRepo.findAll({
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        projectId: projectId as string | undefined,
        level: level as string | undefined,
        source: source as string | undefined,
        search: search as string | undefined,
      });
      res.json(result);
    } catch (err) {
      console.error("[ErrPulse] Failed to list logs:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/logs/clear — clear logs (optionally per project)
  router.post("/clear", (req, res) => {
    try {
      const projectId = req.body?.projectId as string | undefined;
      logRepo.clearAll(projectId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to clear logs" });
    }
  });

  return router;
}
