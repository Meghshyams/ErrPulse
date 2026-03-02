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
      console.error("[ErrLens] Failed to fetch requests:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
