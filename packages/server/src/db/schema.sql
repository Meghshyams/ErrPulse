CREATE TABLE IF NOT EXISTS errors (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
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
  last_event_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_errors_fingerprint ON errors(fingerprint);
CREATE INDEX IF NOT EXISTS idx_errors_status ON errors(status);
CREATE INDEX IF NOT EXISTS idx_errors_source ON errors(source);
CREATE INDEX IF NOT EXISTS idx_errors_last_seen ON errors(last_seen);

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
  FOREIGN KEY (error_id) REFERENCES errors(id)
);

CREATE INDEX IF NOT EXISTS idx_events_error_id ON error_events(error_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON error_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON error_events(correlation_id);

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
  source TEXT NOT NULL DEFAULT 'backend'
);

CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_requests_correlation_id ON requests(correlation_id);
CREATE INDEX IF NOT EXISTS idx_requests_status_code ON requests(status_code);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
