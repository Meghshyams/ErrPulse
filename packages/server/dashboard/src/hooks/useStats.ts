import { useState, useEffect, useCallback } from "react";
import { fetchJSON } from "../lib/api";
import { useProject } from "../context/ProjectContext";

export interface Stats {
  totalRequests: number;
  errorRequests: number;
  healthScore: number;
  errorsLast24h: number;
  topErrors: Array<{
    id: string;
    message: string;
    count: number;
    severity: string;
    source: string;
  }>;
  errorsByType: Record<string, number>;
  errorsBySource: Record<string, number>;
  errorsOverTime: Array<{ timestamp: string; count: number }>;
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedProjectId } = useProject();

  const load = useCallback(async () => {
    try {
      const params = selectedProjectId ? `?projectId=${selectedProjectId}` : "";
      const data = await fetchJSON<Stats>(`/api/stats${params}`);
      setStats(data);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [selectedProjectId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  return { stats, loading, reload: load };
}
