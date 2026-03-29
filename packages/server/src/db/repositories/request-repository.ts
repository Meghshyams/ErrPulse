import type Database from "better-sqlite3";
import type { RequestLogEntry } from "@errpulse/core";
import { generateEventId } from "@errpulse/core";

export interface RequestRow {
  id: string;
  method: string;
  url: string;
  status_code: number | null;
  duration: number | null;
  timestamp: string;
  correlation_id: string | null;
  error_event_id: string | null;
  headers: string | null;
  response_headers: string | null;
  request_body: string | null;
  response_body: string | null;
  source: string;
  project_id: string | null;
}

export interface RequestDetailEntry extends RequestLogEntry {
  headers?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
}

function rowToRequest(row: RequestRow): RequestLogEntry {
  return {
    id: row.id,
    method: row.method,
    url: row.url,
    statusCode: row.status_code ?? 0,
    duration: row.duration ?? 0,
    timestamp: row.timestamp,
    correlationId: row.correlation_id ?? undefined,
    errorEventId: row.error_event_id ?? undefined,
  };
}

function rowToDetail(row: RequestRow): RequestDetailEntry {
  return {
    ...rowToRequest(row),
    headers: row.headers ? safeJsonParse(row.headers) : undefined,
    responseHeaders: row.response_headers ? safeJsonParse(row.response_headers) : undefined,
    requestBody: row.request_body ? safeJsonParse(row.request_body) : undefined,
    responseBody: row.response_body ? safeJsonParse(row.response_body) : undefined,
  };
}

function safeJsonParse(str: string): Record<string, string> | undefined {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

export class RequestRepository {
  constructor(private db: Database.Database) {}

  insert(entry: {
    method: string;
    url: string;
    statusCode?: number;
    duration?: number;
    timestamp: string;
    correlationId?: string;
    errorEventId?: string;
    headers?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: string;
    responseBody?: string;
    source?: string;
    projectId?: string;
  }): string {
    const id = generateEventId();
    this.db
      .prepare(
        `INSERT INTO requests (id, method, url, status_code, duration, timestamp,
         correlation_id, error_event_id, headers, response_headers, request_body, response_body, source, project_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        entry.method,
        entry.url,
        entry.statusCode ?? null,
        entry.duration ?? null,
        entry.timestamp,
        entry.correlationId ?? null,
        entry.errorEventId ?? null,
        entry.headers ? JSON.stringify(entry.headers) : null,
        entry.responseHeaders ? JSON.stringify(entry.responseHeaders) : null,
        entry.requestBody ?? null,
        entry.responseBody ?? null,
        entry.source ?? "backend",
        entry.projectId ?? null
      );
    return id;
  }

  findById(id: string): RequestDetailEntry | null {
    const row = this.db.prepare("SELECT * FROM requests WHERE id = ?").get(id) as
      | RequestRow
      | undefined;
    return row ? rowToDetail(row) : null;
  }

  findByCorrelationId(correlationId: string): RequestDetailEntry | null {
    const row = this.db
      .prepare("SELECT * FROM requests WHERE correlation_id = ? ORDER BY timestamp DESC LIMIT 1")
      .get(correlationId) as RequestRow | undefined;
    return row ? rowToDetail(row) : null;
  }

  findAll(options: { page?: number; pageSize?: number; projectId?: string }): {
    requests: RequestLogEntry[];
    total: number;
  } {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    if (options.projectId) {
      const total = this.db
        .prepare("SELECT COUNT(*) as count FROM requests WHERE project_id = ?")
        .get(options.projectId) as { count: number };
      const rows = this.db
        .prepare(
          "SELECT * FROM requests WHERE project_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        )
        .all(options.projectId, pageSize, offset) as RequestRow[];
      return { requests: rows.map(rowToRequest), total: total.count };
    }

    const total = this.db.prepare("SELECT COUNT(*) as count FROM requests").get() as {
      count: number;
    };

    const rows = this.db
      .prepare("SELECT * FROM requests ORDER BY timestamp DESC LIMIT ? OFFSET ?")
      .all(pageSize, offset) as RequestRow[];

    return {
      requests: rows.map(rowToRequest),
      total: total.count,
    };
  }

  getTotalCount(projectId?: string, hours?: number): number {
    const since = hours ? new Date(Date.now() - hours * 3600_000).toISOString() : null;
    if (projectId && since) {
      const result = this.db
        .prepare("SELECT COUNT(*) as count FROM requests WHERE project_id = ? AND timestamp >= ?")
        .get(projectId, since) as { count: number };
      return result.count;
    }
    if (projectId) {
      const result = this.db
        .prepare("SELECT COUNT(*) as count FROM requests WHERE project_id = ?")
        .get(projectId) as { count: number };
      return result.count;
    }
    if (since) {
      const result = this.db
        .prepare("SELECT COUNT(*) as count FROM requests WHERE timestamp >= ?")
        .get(since) as { count: number };
      return result.count;
    }
    const result = this.db.prepare("SELECT COUNT(*) as count FROM requests").get() as {
      count: number;
    };
    return result.count;
  }

  getErrorCount(projectId?: string, hours?: number): number {
    const since = hours ? new Date(Date.now() - hours * 3600_000).toISOString() : null;
    if (projectId && since) {
      const result = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM requests WHERE status_code >= 400 AND project_id = ? AND timestamp >= ?"
        )
        .get(projectId, since) as { count: number };
      return result.count;
    }
    if (projectId) {
      const result = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM requests WHERE status_code >= 400 AND project_id = ?"
        )
        .get(projectId) as { count: number };
      return result.count;
    }
    if (since) {
      const result = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM requests WHERE status_code >= 400 AND timestamp >= ?"
        )
        .get(since) as { count: number };
      return result.count;
    }
    const result = this.db
      .prepare("SELECT COUNT(*) as count FROM requests WHERE status_code >= 400")
      .get() as { count: number };
    return result.count;
  }

  clearAll(projectId?: string): void {
    if (projectId) {
      this.db.prepare("DELETE FROM requests WHERE project_id = ?").run(projectId);
    } else {
      this.db.exec("DELETE FROM requests");
    }
  }
}
