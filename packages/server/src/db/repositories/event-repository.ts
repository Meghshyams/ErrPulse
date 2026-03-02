import type Database from "better-sqlite3";
import type { ErrLensEvent } from "@errlens/core";

export interface EventRow {
  id: string;
  error_id: string;
  fingerprint: string;
  timestamp: string;
  type: string;
  message: string;
  stack: string | null;
  stack_frames: string | null;
  source: string;
  severity: string;
  request: string | null;
  environment: string | null;
  correlation_id: string | null;
  component_stack: string | null;
  component_name: string | null;
  extra: string | null;
  project_id: string | null;
}

function rowToEvent(row: EventRow): ErrLensEvent {
  return {
    eventId: row.id,
    timestamp: row.timestamp,
    type: row.type as ErrLensEvent["type"],
    message: row.message,
    stack: row.stack ?? undefined,
    stackFrames: row.stack_frames ? JSON.parse(row.stack_frames) : undefined,
    source: row.source as ErrLensEvent["source"],
    severity: row.severity as ErrLensEvent["severity"],
    fingerprint: row.fingerprint,
    request: row.request ? JSON.parse(row.request) : undefined,
    environment: row.environment ? JSON.parse(row.environment) : undefined,
    correlationId: row.correlation_id ?? undefined,
    componentStack: row.component_stack ?? undefined,
    componentName: row.component_name ?? undefined,
    projectId: row.project_id ?? undefined,
    extra: row.extra ? JSON.parse(row.extra) : undefined,
  };
}

export class EventRepository {
  constructor(private db: Database.Database) {}

  insert(event: ErrLensEvent, errorId: string, fingerprint: string): void {
    this.db
      .prepare(
        `INSERT INTO error_events (id, error_id, fingerprint, timestamp, type, message,
         stack, stack_frames, source, severity, request, environment,
         correlation_id, component_stack, component_name, extra, project_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        event.eventId,
        errorId,
        fingerprint,
        event.timestamp,
        event.type,
        event.message,
        event.stack ?? null,
        event.stackFrames ? JSON.stringify(event.stackFrames) : null,
        event.source,
        event.severity,
        event.request ? JSON.stringify(event.request) : null,
        event.environment ? JSON.stringify(event.environment) : null,
        event.correlationId ?? null,
        event.componentStack ?? null,
        event.componentName ?? null,
        event.extra ? JSON.stringify(event.extra) : null,
        event.projectId ?? null
      );
  }

  findByErrorId(errorId: string, limit: number = 50): ErrLensEvent[] {
    const rows = this.db
      .prepare("SELECT * FROM error_events WHERE error_id = ? ORDER BY timestamp DESC LIMIT ?")
      .all(errorId, limit) as EventRow[];
    return rows.map(rowToEvent);
  }

  findByCorrelationId(correlationId: string): ErrLensEvent[] {
    const rows = this.db
      .prepare("SELECT * FROM error_events WHERE correlation_id = ? ORDER BY timestamp ASC")
      .all(correlationId) as EventRow[];
    return rows.map(rowToEvent);
  }

  getCountLast24h(projectId?: string): number {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (projectId) {
      const result = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM error_events WHERE timestamp >= ? AND project_id = ?"
        )
        .get(since, projectId) as { count: number };
      return result.count;
    }
    const result = this.db
      .prepare("SELECT COUNT(*) as count FROM error_events WHERE timestamp >= ?")
      .get(since) as { count: number };
    return result.count;
  }

  getErrorsOverTime(
    hours: number = 24,
    projectId?: string
  ): { timestamp: string; count: number }[] {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    if (projectId) {
      const rows = this.db
        .prepare(
          `SELECT strftime('%Y-%m-%dT%H:00:00Z', timestamp) as hour, COUNT(*) as count
           FROM error_events WHERE timestamp >= ? AND project_id = ?
           GROUP BY hour ORDER BY hour ASC`
        )
        .all(since, projectId) as { hour: string; count: number }[];
      return rows.map((r) => ({ timestamp: r.hour, count: r.count }));
    }
    const rows = this.db
      .prepare(
        `SELECT strftime('%Y-%m-%dT%H:00:00Z', timestamp) as hour, COUNT(*) as count
         FROM error_events WHERE timestamp >= ?
         GROUP BY hour ORDER BY hour ASC`
      )
      .all(since) as { hour: string; count: number }[];
    return rows.map((r) => ({ timestamp: r.hour, count: r.count }));
  }
}
