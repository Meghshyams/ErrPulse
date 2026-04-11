import type Database from "better-sqlite3";
import { generateEventId } from "@errpulse/core";

export interface LogRow {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  source: string;
  environment: string | null;
  correlation_id: string | null;
  project_id: string | null;
  extra: string | null;
}

export interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  source: string;
  environment?: Record<string, unknown>;
  correlationId?: string;
  projectId?: string;
  extra?: Record<string, unknown>;
}

function rowToLogEntry(row: LogRow): LogEntry {
  return {
    id: row.id,
    level: row.level,
    message: row.message,
    timestamp: row.timestamp,
    source: row.source,
    environment: row.environment ? safeJsonParse(row.environment) : undefined,
    correlationId: row.correlation_id ?? undefined,
    projectId: row.project_id ?? undefined,
    extra: row.extra ? safeJsonParse(row.extra) : undefined,
  };
}

function safeJsonParse(str: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

export class LogRepository {
  constructor(private db: Database.Database) {}

  insert(entry: {
    id?: string;
    level: string;
    message: string;
    timestamp?: string;
    source?: string;
    environment?: Record<string, unknown>;
    correlationId?: string;
    projectId?: string;
    extra?: Record<string, unknown>;
  }): string {
    const id = entry.id || generateEventId();
    this.db
      .prepare(
        `INSERT INTO logs (id, level, message, timestamp, source, environment, correlation_id, project_id, extra)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        entry.level,
        entry.message,
        entry.timestamp ?? new Date().toISOString(),
        entry.source ?? "backend",
        entry.environment ? JSON.stringify(entry.environment) : null,
        entry.correlationId ?? null,
        entry.projectId ?? null,
        entry.extra ? JSON.stringify(entry.extra) : null
      );
    return id;
  }

  findAll(options: {
    page?: number;
    pageSize?: number;
    projectId?: string;
    level?: string;
    source?: string;
    search?: string;
  }): { logs: LogEntry[]; total: number } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.projectId) {
      conditions.push("project_id = ?");
      params.push(options.projectId);
    }
    if (options.level) {
      conditions.push("level = ?");
      params.push(options.level);
    }
    if (options.source) {
      conditions.push("source = ?");
      params.push(options.source);
    }
    if (options.search) {
      conditions.push("message LIKE ?");
      params.push(`%${options.search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 100;
    const offset = (page - 1) * pageSize;

    const total = this.db.prepare(`SELECT COUNT(*) as count FROM logs ${where}`).get(...params) as {
      count: number;
    };

    const rows = this.db
      .prepare(`SELECT * FROM logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as LogRow[];

    return {
      logs: rows.map(rowToLogEntry),
      total: total.count,
    };
  }

  clearAll(projectId?: string): void {
    if (projectId) {
      this.db.prepare("DELETE FROM logs WHERE project_id = ?").run(projectId);
    } else {
      this.db.exec("DELETE FROM logs");
    }
  }
}
