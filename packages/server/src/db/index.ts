import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let db: Database.Database | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS errors (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unresolved',
  explanation_title TEXT,
  explanation_text TEXT,
  explanation_suggestion TEXT,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  last_event_id TEXT,
  project_id TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_errors_fingerprint_project ON errors(fingerprint, project_id);
CREATE INDEX IF NOT EXISTS idx_errors_status ON errors(status);
CREATE INDEX IF NOT EXISTS idx_errors_source ON errors(source);
CREATE INDEX IF NOT EXISTS idx_errors_last_seen ON errors(last_seen);
CREATE INDEX IF NOT EXISTS idx_errors_project_id ON errors(project_id);

CREATE TABLE IF NOT EXISTS error_events (
  id TEXT PRIMARY KEY,
  error_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  stack_frames TEXT,
  source TEXT NOT NULL,
  severity TEXT NOT NULL,
  request TEXT,
  environment TEXT,
  correlation_id TEXT,
  component_stack TEXT,
  component_name TEXT,
  extra TEXT,
  project_id TEXT,
  FOREIGN KEY (error_id) REFERENCES errors(id)
);

CREATE INDEX IF NOT EXISTS idx_events_error_id ON error_events(error_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON error_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON error_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON error_events(project_id);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  duration INTEGER,
  timestamp TEXT NOT NULL,
  correlation_id TEXT,
  error_event_id TEXT,
  headers TEXT,
  source TEXT NOT NULL DEFAULT 'backend',
  project_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_requests_correlation_id ON requests(correlation_id);
CREATE INDEX IF NOT EXISTS idx_requests_status_code ON requests(status_code);
CREATE INDEX IF NOT EXISTS idx_requests_project_id ON requests(project_id);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`;

export function initDatabase(dbPath: string): Database.Database {
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  // Run schema
  db.exec(SCHEMA_SQL);

  // Migration: add project_id columns to existing tables if missing
  runMigrations(db);

  return db;
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as { name: string }[];
  return cols.some((c) => c.name === column);
}

function runMigrations(db: Database.Database): void {
  // Migration 1: Add project_id columns (for databases created before multi-project support)
  if (!hasColumn(db, "errors", "project_id")) {
    db.exec("ALTER TABLE errors ADD COLUMN project_id TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_errors_project_id ON errors(project_id)");
    // Drop old unique index on fingerprint alone and create composite one
    db.exec("DROP INDEX IF EXISTS idx_errors_fingerprint");
    db.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_errors_fingerprint_project ON errors(fingerprint, project_id)"
    );
  }
  if (!hasColumn(db, "error_events", "project_id")) {
    db.exec("ALTER TABLE error_events ADD COLUMN project_id TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_events_project_id ON error_events(project_id)");
  }
  if (!hasColumn(db, "requests", "project_id")) {
    db.exec("ALTER TABLE requests ADD COLUMN project_id TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_requests_project_id ON requests(project_id)");
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
