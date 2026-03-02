import { useState, useEffect, useCallback } from "react";
import { fetchJSON } from "../lib/api";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchJSON<{ projects: Project[] }>("/api/projects");
      setProjects(data.projects);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return { projects, loading, reload: load };
}
