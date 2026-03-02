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
  source: string;
  project_id: string | null;
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
    source?: string;
    projectId?: string;
  }): string {
    const id = generateEventId();
    this.db
      .prepare(
        `INSERT INTO requests (id, method, url, status_code, duration, timestamp,
         correlation_id, error_event_id, headers, source, project_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        entry.source ?? "backend",
        entry.projectId ?? null
      );
    return id;
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

  getTotalCount(projectId?: string): number {
    if (projectId) {
      const result = this.db
        .prepare("SELECT COUNT(*) as count FROM requests WHERE project_id = ?")
        .get(projectId) as { count: number };
      return result.count;
    }
    const result = this.db.prepare("SELECT COUNT(*) as count FROM requests").get() as {
      count: number;
    };
    return result.count;
  }

  getErrorCount(projectId?: string): number {
    if (projectId) {
      const result = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM requests WHERE status_code >= 400 AND project_id = ?"
        )
        .get(projectId) as { count: number };
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
