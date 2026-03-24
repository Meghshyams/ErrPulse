import { Router } from "express";
import { ErrorRepository } from "../../db/repositories/error-repository.js";
import { EventRepository } from "../../db/repositories/event-repository.js";
import { RequestRepository } from "../../db/repositories/request-repository.js";

const TIME_RANGE_HOURS: Record<string, number> = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 168,
};

export function createStatsRouter(
  errorRepo: ErrorRepository,
  eventRepo: EventRepository,
  requestRepo: RequestRepository
): Router {
  const router = Router();

  // GET /api/stats — overview stats for dashboard
  router.get("/", (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const timeRange = req.query.timeRange as string | undefined;
      const hours = timeRange ? (TIME_RANGE_HOURS[timeRange] ?? 24) : 24;

      const totalRequests = requestRepo.getTotalCount(projectId);
      const errorRequests = requestRepo.getErrorCount(projectId);
      const healthScore =
        totalRequests > 0
          ? Math.round(((totalRequests - errorRequests) / totalRequests) * 100)
          : 100;

      const errorsLast24h = eventRepo.getCountLast24h(projectId);
      const topErrors = errorRepo.getTopErrors(5, projectId);
      const errorsByType = errorRepo.getCountByType(projectId);
      const errorsBySource = errorRepo.getCountBySource(projectId);
      const errorsOverTime = eventRepo.getErrorsOverTime(hours, projectId);

      res.json({
        totalRequests,
        errorRequests,
        healthScore,
        errorsLast24h,
        topErrors,
        errorsByType,
        errorsBySource,
        errorsOverTime,
      });
    } catch (err) {
      console.error("[ErrPulse] Failed to fetch stats:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
