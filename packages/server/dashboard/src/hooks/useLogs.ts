import { useState, useEffect, useCallback, useRef } from "react";
import { fetchJSON } from "../lib/api";
import { useProject } from "../context/ProjectContext";

export interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  source: string;
  environment?: Record<string, unknown>;
  correlationId?: string;
  extra?: Record<string, unknown>;
}

interface LogListResult {
  logs: LogEntry[];
  total: number;
}

export function useLogs(filters?: Record<string, string>) {
  const [data, setData] = useState<LogListResult>({ logs: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const { selectedProjectId } = useProject();

  const load = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams(filters ?? {});
      if (selectedProjectId) params.set("projectId", selectedProjectId);
      const result = await fetchJSON<LogListResult>(`/api/logs?${params.toString()}`);
      setData(result);
      hasLoadedRef.current = true;
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [JSON.stringify(filters), selectedProjectId]);

  const silentReload = useCallback(async () => {
    try {
      const params = new URLSearchParams(filters ?? {});
      if (selectedProjectId) params.set("projectId", selectedProjectId);
      const result = await fetchJSON<LogListResult>(`/api/logs?${params.toString()}`);
      setData(result);
    } catch {
      // Silently fail
    }
  }, [JSON.stringify(filters), selectedProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, loading, reload: load, silentReload };
}
