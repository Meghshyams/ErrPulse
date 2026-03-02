import { Router } from "express";
import {
  generateEventId,
  sanitizeHeaders,
  sanitizeObject,
  type ErrPulseEvent,
} from "@errpulse/core";
import { ErrorRepository } from "../../db/repositories/error-repository.js";
import { EventRepository } from "../../db/repositories/event-repository.js";
import { RequestRepository } from "../../db/repositories/request-repository.js";
import { ProjectRepository } from "../../db/repositories/project-repository.js";
import { ingestEvent } from "../../engine/grouper.js";
import { broadcast } from "../../ws/broadcaster.js";

export function createEventsRouter(
  errorRepo: ErrorRepository,
  eventRepo: EventRepository,
  requestRepo: RequestRepository,
  projectRepo: ProjectRepository
): Router {
  const router = Router();

  // POST /api/events — ingest a single error event
  router.post("/", (req, res) => {
    try {
      const body = req.body as Partial<ErrPulseEvent>;

      if (!body.message || !body.type || !body.source) {
        res.status(400).json({ error: "Missing required fields: message, type, source" });
        return;
      }

      const event: ErrPulseEvent = {
        eventId: body.eventId || generateEventId(),
        timestamp: body.timestamp || new Date().toISOString(),
        type: body.type,
        message: body.message,
        stack: body.stack,
        stackFrames: body.stackFrames,
        source: body.source,
        severity: body.severity || ("error" as ErrPulseEvent["severity"]),
        fingerprint: body.fingerprint,
        request: body.request
          ? {
              ...body.request,
              headers: body.request.headers ? sanitizeHeaders(body.request.headers) : undefined,
              body: body.request.body ? sanitizeObject(body.request.body) : undefined,
            }
          : undefined,
        environment: body.environment,
        correlationId: body.correlationId,
        componentStack: body.componentStack,
        componentName: body.componentName,
        projectId: body.projectId,
        extra: body.extra,
      };

      const result = ingestEvent(event, errorRepo, eventRepo, projectRepo);

      // If the event has request context, log it
      if (event.request?.method && event.request?.url) {
        requestRepo.insert({
          method: event.request.method,
          url: event.request.url,
          statusCode: event.request.statusCode,
          duration: event.request.duration,
          timestamp: event.timestamp,
          correlationId: event.correlationId,
          errorEventId: event.eventId,
          source: event.source,
          projectId: event.projectId,
        });
      }

      res.status(201).json({
        id: result.eventId,
        fingerprint: result.fingerprint,
        isNew: result.isNew,
      });
    } catch (err) {
      console.error("[ErrPulse] Failed to ingest event:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/events/batch — ingest multiple events
  router.post("/batch", (req, res) => {
    try {
      const events = req.body as Partial<ErrPulseEvent>[];
      if (!Array.isArray(events)) {
        res.status(400).json({ error: "Expected an array of events" });
        return;
      }

      const results = [];
      for (const body of events) {
        if (!body.message || !body.type || !body.source) continue;

        const event: ErrPulseEvent = {
          eventId: body.eventId || generateEventId(),
          timestamp: body.timestamp || new Date().toISOString(),
          type: body.type,
          message: body.message,
          stack: body.stack,
          stackFrames: body.stackFrames,
          source: body.source,
          severity: body.severity || ("error" as ErrPulseEvent["severity"]),
          fingerprint: body.fingerprint,
          request: body.request,
          environment: body.environment,
          correlationId: body.correlationId,
          componentStack: body.componentStack,
          componentName: body.componentName,
          projectId: body.projectId,
          extra: body.extra,
        };

        const result = ingestEvent(event, errorRepo, eventRepo, projectRepo);
        results.push({
          id: result.eventId,
          fingerprint: result.fingerprint,
          isNew: result.isNew,
        });
      }

      res.status(201).json(results);
    } catch (err) {
      console.error("[ErrPulse] Failed to ingest batch:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/events/request — log an HTTP request
  router.post("/request", (req, res) => {
    try {
      const body = req.body;
      if (!body.method || !body.url) {
        res.status(400).json({ error: "Missing required fields: method, url" });
        return;
      }

      // Auto-register project if projectId present
      if (body.projectId && projectRepo) {
        projectRepo.findOrCreate(body.projectId);
      }

      const id = requestRepo.insert({
        method: body.method,
        url: body.url,
        statusCode: body.statusCode,
        duration: body.duration,
        timestamp: body.timestamp || new Date().toISOString(),
        correlationId: body.correlationId,
        errorEventId: body.errorEventId,
        headers: body.headers,
        source: body.source || "backend",
        projectId: body.projectId,
      });

      broadcast({
        type: "new_request",
        payload: { id, ...body },
      });

      res.status(201).json({ id });
    } catch (err) {
      console.error("[ErrPulse] Failed to log request:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
