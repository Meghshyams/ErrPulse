import { Router } from "express";
import { ProjectRepository } from "../../db/repositories/project-repository.js";

export function createProjectsRouter(projectRepo: ProjectRepository): Router {
  const router = Router();

  // GET /api/projects — list all registered projects
  router.get("/", (_req, res) => {
    try {
      const projects = projectRepo.findAll();
      res.json({ projects });
    } catch (err) {
      console.error("[ErrLens] Failed to fetch projects:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
