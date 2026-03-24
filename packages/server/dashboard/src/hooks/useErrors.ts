import { useState, useEffect, useCallback } from "react";
import { fetchJSON, patchJSON } from "../lib/api";
import { useProject } from "../context/ProjectContext";

export interface ErrorGroup {
  id: string;
  fingerprint: string;
  type: string;
  message: string;
  source: string;
  severity: string;
  status: string;
  explanation?: string;
  firstSeen: string;
  lastSeen: string;
  count: number;
}

export interface ErrorEvent {
  eventId: string;
  timestamp: string;
  type: string;
  message: string;
  stack?: string;
  stackFrames?: Array<{
    filename: string;
    function: string;
    lineno: number;
    colno: number;
    inApp: boolean;
  }>;
  source: string;
  severity: string;
  request?: {
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
  };
  environment?: Record<string, unknown>;
  correlationId?: string;
  componentStack?: string;
  extra?: Record<string, unknown>;
}

interface ErrorListResult {
  errors: ErrorGroup[];
  total: number;
}

interface ErrorDetailResult {
  error: ErrorGroup;
  events: ErrorEvent[];
}

export function useErrors(filters?: Record<string, string>) {
  const [data, setData] = useState<ErrorListResult>({ errors: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const { selectedProjectId } = useProject();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters ?? {});
      if (selectedProjectId) params.set("projectId", selectedProjectId);
      const result = await fetchJSON<ErrorListResult>(`/api/errors?${params.toString()}`);
      setData(result);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [JSON.stringify(filters), selectedProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateErrorStatus = useCallback(
    async (errorId: string, status: string) => {
      await patchJSON(`/api/errors/${errorId}`, { status });
      load();
    },
    [load]
  );

  return { ...data, loading, reload: load, updateErrorStatus };
}

export function useErrorDetail(id: string) {
  const [data, setData] = useState<ErrorDetailResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchJSON<ErrorDetailResult>(`/api/errors/${id}`);
      setData(result);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (status: string) => {
    await patchJSON(`/api/errors/${id}`, { status });
    load();
  };

  return { data, loading, reload: load, updateStatus };
}
