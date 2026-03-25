import { Router } from "express";
import { RequestRepository } from "../../db/repositories/request-repository.js";

export function createRequestsRouter(requestRepo: RequestRepository): Router {
  const router = Router();

  // GET /api/requests — list HTTP requests
  router.get("/", (req, res) => {
    try {
      const { page, pageSize, projectId } = req.query;
      const result = requestRepo.findAll({
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        projectId: projectId as string,
      });

      res.json({
        requests: result.requests,
        total: result.total,
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 50,
      });
    } catch (err) {
      console.error("[ErrPulse] Failed to fetch requests:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/requests/:id — get request detail with headers and body
  router.get("/:id", (req, res) => {
    try {
      const request = requestRepo.findById(req.params.id);
      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }
      res.json(request);
    } catch (err) {
      console.error("[ErrPulse] Failed to fetch request detail:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
