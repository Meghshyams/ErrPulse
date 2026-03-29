import type Database from "better-sqlite3";
import type { ErrorGroup, ErrorExplanation } from "@errpulse/core";
import { generateEventId } from "@errpulse/core";

export interface ErrorRow {
  id: string;
  fingerprint: string;
  type: string;
  message: string;
  source: string;
  severity: string;
  status: string;
  explanation_title: string | null;
  explanation_text: string | null;
  explanation_suggestion: string | null;
  first_seen: string;
  last_seen: string;
  count: number;
  last_event_id: string | null;
  project_id: string | null;
}

function rowToErrorGroup(row: ErrorRow): ErrorGroup {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    type: row.type as ErrorGroup["type"],
    message: row.message,
    source: row.source as ErrorGroup["source"],
    severity: row.severity as ErrorGroup["severity"],
    status: row.status,
    explanation: row.explanation_text
      ? JSON.stringify({
          title: row.explanation_title,
          explanation: row.explanation_text,
          suggestion: row.explanation_suggestion,
        })
      : undefined,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    count: row.count,
    projectId: row.project_id ?? undefined,
  };
}

export class ErrorRepository {
  constructor(private db: Database.Database) {}

  upsert(
    fingerprint: string,
    type: string,
    message: string,
    source: string,
    severity: string,
    explanation: ErrorExplanation | null,
    eventId: string,
    timestamp: string,
    projectId?: string
  ): { errorId: string; isNew: boolean } {
    const existing = projectId
      ? (this.db
          .prepare("SELECT id, count FROM errors WHERE fingerprint = ? AND project_id = ?")
          .get(fingerprint, projectId) as { id: string; count: number } | undefined)
      : (this.db
          .prepare("SELECT id, count FROM errors WHERE fingerprint = ? AND project_id IS NULL")
          .get(fingerprint) as { id: string; count: number } | undefined);

    if (existing) {
      // Reopen resolved errors on recurrence (regression detection).
      // Ignored/acknowledged errors stay as-is — the user explicitly chose those states.
      this.db
        .prepare(
          `UPDATE errors SET last_seen = ?, count = count + 1, last_event_id = ?,
           severity = CASE WHEN ? = 'fatal' THEN 'fatal' ELSE severity END,
           status = CASE WHEN status = 'resolved' THEN 'unresolved' ELSE status END
           WHERE id = ?`
        )
        .run(timestamp, eventId, severity, existing.id);
      return { errorId: existing.id, isNew: false };
    }

    const errorId = generateEventId();
    this.db
      .prepare(
        `INSERT INTO errors (id, fingerprint, type, message, source, severity, status,
         explanation_title, explanation_text, explanation_suggestion,
         first_seen, last_seen, count, last_event_id, project_id)
         VALUES (?, ?, ?, ?, ?, ?, 'unresolved', ?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .run(
        errorId,
        fingerprint,
        type,
        message,
        source,
        severity,
        explanation?.title ?? null,
        explanation?.explanation ?? null,
        explanation?.suggestion ?? null,
        timestamp,
        timestamp,
        eventId,
        projectId ?? null
      );

    return { errorId, isNew: true };
  }

  findAll(options: {
    status?: string;
    source?: string;
    severity?: string;
    type?: string;
    search?: string;
    projectId?: string;
    timeRange?: string;
    page?: number;
    pageSize?: number;
  }): { errors: ErrorGroup[]; total: number } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.status) {
      conditions.push("status = ?");
      params.push(options.status);
    }
    if (options.source) {
      conditions.push("source = ?");
      params.push(options.source);
    }
    if (options.severity) {
      conditions.push("severity = ?");
      params.push(options.severity);
    }
    if (options.type) {
      conditions.push("type = ?");
      params.push(options.type);
    }
    if (options.search) {
      conditions.push("message LIKE ?");
      params.push(`%${options.search}%`);
    }
    if (options.projectId) {
      conditions.push("project_id = ?");
      params.push(options.projectId);
    }
    if (options.timeRange) {
      const hoursMap: Record<string, number> = {
        "1h": 1,
        "6h": 6,
        "24h": 24,
        "7d": 168,
      };
      const hours = hoursMap[options.timeRange];
      if (hours) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        conditions.push("last_seen >= ?");
        params.push(since);
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const total = this.db
      .prepare(`SELECT COUNT(*) as count FROM errors ${where}`)
      .get(...params) as { count: number };

    const rows = this.db
      .prepare(`SELECT * FROM errors ${where} ORDER BY last_seen DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as ErrorRow[];

    return {
      errors: rows.map(rowToErrorGroup),
      total: total.count,
    };
  }

  findById(id: string): ErrorGroup | null {
    const row = this.db.prepare("SELECT * FROM errors WHERE id = ?").get(id) as
      | ErrorRow
      | undefined;
    return row ? rowToErrorGroup(row) : null;
  }

  findByFingerprint(fingerprint: string): ErrorGroup | null {
    const row = this.db.prepare("SELECT * FROM errors WHERE fingerprint = ?").get(fingerprint) as
      | ErrorRow
      | undefined;
    return row ? rowToErrorGroup(row) : null;
  }

  updateStatus(id: string, status: string): boolean {
    const result = this.db.prepare("UPDATE errors SET status = ? WHERE id = ?").run(status, id);
    return result.changes > 0;
  }

  getTopErrors(limit: number = 10, projectId?: string): ErrorGroup[] {
    if (projectId) {
      const rows = this.db
        .prepare(
          "SELECT * FROM errors WHERE status != 'resolved' AND project_id = ? ORDER BY count DESC LIMIT ?"
        )
        .all(projectId, limit) as ErrorRow[];
      return rows.map(rowToErrorGroup);
    }
    const rows = this.db
      .prepare("SELECT * FROM errors WHERE status != 'resolved' ORDER BY count DESC LIMIT ?")
      .all(limit) as ErrorRow[];
    return rows.map(rowToErrorGroup);
  }

  getCountByType(projectId?: string): Record<string, number> {
    const q = projectId
      ? "SELECT type, SUM(count) as total FROM errors WHERE project_id = ? GROUP BY type"
      : "SELECT type, SUM(count) as total FROM errors GROUP BY type";
    const rows = (projectId ? this.db.prepare(q).all(projectId) : this.db.prepare(q).all()) as {
      type: string;
      total: number;
    }[];
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.type] = row.total;
    }
    return result;
  }

  getCountBySource(projectId?: string): Record<string, number> {
    const q = projectId
      ? "SELECT source, SUM(count) as total FROM errors WHERE project_id = ? GROUP BY source"
      : "SELECT source, SUM(count) as total FROM errors GROUP BY source";
    const rows = (projectId ? this.db.prepare(q).all(projectId) : this.db.prepare(q).all()) as {
      source: string;
      total: number;
    }[];
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.source] = row.total;
    }
    return result;
  }

  clearAll(projectId?: string): void {
    if (projectId) {
      this.db.prepare("DELETE FROM error_events WHERE project_id = ?").run(projectId);
      this.db.prepare("DELETE FROM errors WHERE project_id = ?").run(projectId);
    } else {
      this.db.exec("DELETE FROM error_events");
      this.db.exec("DELETE FROM errors");
    }
  }
}
