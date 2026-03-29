import { useState, useEffect, useCallback, useRef } from "react";
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

export interface LinkedRequest {
  id: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  correlationId?: string;
  headers?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
}

interface ErrorDetailResult {
  error: ErrorGroup;
  events: ErrorEvent[];
  linkedRequest?: LinkedRequest | null;
}

export function useErrors(filters?: Record<string, string>) {
  const [data, setData] = useState<ErrorListResult>({ errors: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const { selectedProjectId } = useProject();

  const load = useCallback(async () => {
    // Only show loading skeleton on the very first load.
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams(filters ?? {});
      if (selectedProjectId) params.set("projectId", selectedProjectId);
      const result = await fetchJSON<ErrorListResult>(`/api/errors?${params.toString()}`);
      setData(result);
      hasLoadedRef.current = true;
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [JSON.stringify(filters), selectedProjectId]);

  // Reload without showing loading skeleton (prevents flicker on status changes)
  const silentReload = useCallback(async () => {
    try {
      const params = new URLSearchParams(filters ?? {});
      if (selectedProjectId) params.set("projectId", selectedProjectId);
      const result = await fetchJSON<ErrorListResult>(`/api/errors?${params.toString()}`);
      setData(result);
    } catch {
      // Silently fail
    }
  }, [JSON.stringify(filters), selectedProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateErrorStatus = useCallback(
    async (errorId: string, status: string) => {
      // Optimistic update: immediately reflect the change in UI
      setData((prev) => ({
        ...prev,
        errors: prev.errors.map((e) => (e.id === errorId ? { ...e, status } : e)),
      }));
      await patchJSON(`/api/errors/${errorId}`, { status });
      silentReload();
    },
    [silentReload]
  );

  return { ...data, loading, reload: load, silentReload, updateErrorStatus };
}

export function useErrorDetail(id: string) {
  const [data, setData] = useState<ErrorDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    // Only show loading skeleton on the very first load.
    // Subsequent reloads (e.g. after status change failure) update silently
    // to prevent the page from flashing shimmer skeletons.
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    try {
      const result = await fetchJSON<ErrorDetailResult>(`/api/errors/${id}`);
      setData(result);
      hasLoadedRef.current = true;
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (status: string) => {
    // Optimistic update: immediately reflect status in UI without flicker.
    // We only update the status field — no reload needed since nothing else
    // changes, and reloading would replay fade-in animations causing a flash.
    setData((prev) => (prev ? { ...prev, error: { ...prev.error, status } } : prev));
    try {
      await patchJSON(`/api/errors/${id}`, { status });
    } catch {
      // Revert on failure by reloading
      load();
    }
  };

  return { data, loading, reload: load, updateStatus };
}
