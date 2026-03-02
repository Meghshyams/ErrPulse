import type { ErrorGroup, ErrLensEvent } from "./error-event.js";

export interface IngestResponse {
  id: string;
  fingerprint: string;
  isNew: boolean;
}

export interface ErrorListResponse {
  errors: ErrorGroup[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorDetailResponse {
  error: ErrorGroup;
  events: ErrLensEvent[];
}

export interface RequestLogEntry {
  id: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  correlationId?: string;
  errorEventId?: string;
}

export interface RequestListResponse {
  requests: RequestLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthStats {
  totalRequests: number;
  errorRequests: number;
  healthScore: number;
  errorsLast24h: number;
  topErrors: ErrorGroup[];
  errorsByType: Record<string, number>;
  errorsBySource: Record<string, number>;
  errorsOverTime: { timestamp: string; count: number }[];
}

export interface WebSocketMessage {
  type: "new_error" | "new_event" | "status_change" | "new_request";
  payload: unknown;
}

export interface ErrorFilters {
  status?: string;
  source?: string;
  severity?: string;
  type?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}
