import { Router } from "express";
import { ErrorRepository } from "../../db/repositories/error-repository.js";
import { EventRepository } from "../../db/repositories/event-repository.js";
import { RequestRepository } from "../../db/repositories/request-repository.js";
import { broadcast } from "../../ws/broadcaster.js";

const HTTP_ERROR_TYPES = new Set(["http_error", "network_error"]);

export function createErrorsRouter(
  errorRepo: ErrorRepository,
  eventRepo: EventRepository,
  requestRepo: RequestRepository
): Router {
  const router = Router();

  // GET /api/errors — list error groups
  router.get("/", (req, res) => {
    try {
      const { status, source, severity, type, search, page, pageSize, projectId, timeRange } =
        req.query;
      const result = errorRepo.findAll({
        status: status as string,
        source: source as string,
        severity: severity as string,
        type: type as string,
        search: search as string,
        projectId: projectId as string,
        timeRange: timeRange as string,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });

      res.json({
        errors: result.errors,
        total: result.total,
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 50,
      });
    } catch (err) {
      console.error("[ErrPulse] Failed to fetch errors:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/errors/trends — get sparkline trend data for error IDs
  router.get("/trends", (req, res) => {
    try {
      const { ids, hours } = req.query;
      if (!ids) {
        res.json({ trends: {} });
        return;
      }
      const errorIds = (ids as string).split(",").filter(Boolean);
      const h = hours ? Number(hours) : 24;
      const trends = eventRepo.getTrendsForErrors(errorIds, h);
      res.json({ trends });
    } catch (err) {
      console.error("[ErrPulse] Failed to fetch trends:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/errors/:id — get error detail with events
  router.get("/:id", (req, res) => {
    try {
      const error = errorRepo.findById(req.params.id);
      if (!error) {
        res.status(404).json({ error: "Error group not found" });
        return;
      }

      const events = eventRepo.findByErrorId(req.params.id);

      // For HTTP/network errors, attach the linked request detail (response headers/body)
      // so the dashboard can show the API response inline without navigating to Requests.
      let linkedRequest = null;
      if (HTTP_ERROR_TYPES.has(error.type)) {
        // Try the most recent event's correlationId to find the linked request
        for (const event of events) {
          if (event.correlationId) {
            const found = requestRepo.findByCorrelationId(event.correlationId);
            if (found) {
              linkedRequest = found;
              break;
            }
          }
        }
      }

      res.json({ error, events, linkedRequest });
    } catch (err) {
      console.error("[ErrPulse] Failed to fetch error detail:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH /api/errors/:id — update error status
  router.patch("/:id", (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: "Missing required field: status" });
        return;
      }

      const valid = ["unresolved", "acknowledged", "resolved", "ignored"];
      if (!valid.includes(status)) {
        res.status(400).json({
          error: `Invalid status. Must be one of: ${valid.join(", ")}`,
        });
        return;
      }

      const updated = errorRepo.updateStatus(req.params.id, status);
      if (!updated) {
        res.status(404).json({ error: "Error group not found" });
        return;
      }

      const errorGroup = errorRepo.findById(req.params.id);
      broadcast({ type: "status_change", payload: errorGroup });

      res.json({ success: true });
    } catch (err) {
      console.error("[ErrPulse] Failed to update error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
