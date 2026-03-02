import { Router } from "express";

export function createHealthRouter(): Router {
  const router = Router();

  // GET /api/health — simple health check
  router.get("/", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return router;
}
