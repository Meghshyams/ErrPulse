import {
  EVENTS_ENDPOINT,
  BATCH_SIZE,
  BATCH_INTERVAL_MS,
  LOGS_ENDPOINT,
  LOG_BATCH_SIZE,
  LOG_BATCH_INTERVAL_MS,
  type ErrPulseEvent,
  type LogEntry,
} from "@errpulse/core";

let endpoint = "";
let projectId = "";
let buffer: ErrPulseEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function setEndpoint(url: string): void {
  endpoint = url.replace(/\/$/, "");
}

export function getEndpoint(): string {
  return endpoint;
}

export function setProjectId(id: string): void {
  projectId = id;
}

export function getProjectId(): string {
  return projectId;
}

async function sendBatch(events: ErrPulseEvent[]): Promise<void> {
  if (!endpoint || events.length === 0) return;

  const url =
    events.length === 1 ? `${endpoint}${EVENTS_ENDPOINT}` : `${endpoint}${EVENTS_ENDPOINT}/batch`;
  const body = events.length === 1 ? events[0] : events;

  try {
    // Use the original fetch to avoid our interceptor
    const originalFetch =
      (window as unknown as { __errpulse_original_fetch?: typeof fetch })
        .__errpulse_original_fetch || fetch;
    await originalFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Silently fail
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, BATCH_INTERVAL_MS);
}

function flush(): void {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0);
  sendBatch(batch);
}

export function enqueueEvent(event: ErrPulseEvent): void {
  if (!endpoint) return;
  if (projectId && !event.projectId) {
    event.projectId = projectId;
  }
  buffer.push(event);

  if (buffer.length >= BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

export function sendRequestLog(entry: {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  correlationId?: string;
  headers?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  source?: string;
}): void {
  if (!endpoint) return;
  try {
    const payload = { ...entry, projectId: projectId || undefined };
    const originalFetch =
      (window as unknown as { __errpulse_original_fetch?: typeof fetch })
        .__errpulse_original_fetch || fetch;
    originalFetch(`${endpoint}${EVENTS_ENDPOINT}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silently fail
  }
}

export function flushWithBeacon(): void {
  if (!endpoint || buffer.length === 0) return;

  const events = buffer.splice(0);
  const url =
    events.length === 1 ? `${endpoint}${EVENTS_ENDPOINT}` : `${endpoint}${EVENTS_ENDPOINT}/batch`;
  const body = events.length === 1 ? events[0] : events;

  try {
    navigator.sendBeacon(url, new Blob([JSON.stringify(body)], { type: "application/json" }));
  } catch {
    // Last resort
  }
}

// --- Log buffer (separate from event buffer) ---

let logBuffer: LogEntry[] = [];
let logFlushTimer: ReturnType<typeof setTimeout> | null = null;

async function sendLogBatch(logs: LogEntry[]): Promise<void> {
  if (!endpoint || logs.length === 0) return;

  const url =
    logs.length === 1 ? `${endpoint}${LOGS_ENDPOINT}` : `${endpoint}${LOGS_ENDPOINT}/batch`;
  const body = logs.length === 1 ? logs[0] : logs;

  try {
    const originalFetch =
      (window as unknown as { __errpulse_original_fetch?: typeof fetch })
        .__errpulse_original_fetch || fetch;
    await originalFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Silently fail
  }
}

function scheduleLogFlush(): void {
  if (logFlushTimer) return;
  logFlushTimer = setTimeout(() => {
    logFlushTimer = null;
    flushLogs();
  }, LOG_BATCH_INTERVAL_MS);
}

function flushLogs(): void {
  if (logBuffer.length === 0) return;
  const batch = logBuffer.splice(0);
  sendLogBatch(batch);
}

export function enqueueLog(entry: LogEntry): void {
  if (!endpoint) return;
  if (projectId && !entry.projectId) {
    entry.projectId = projectId;
  }
  logBuffer.push(entry);

  if (logBuffer.length >= LOG_BATCH_SIZE) {
    flushLogs();
  } else {
    scheduleLogFlush();
  }
}

export function flushLogsWithBeacon(): void {
  if (!endpoint || logBuffer.length === 0) return;

  const logs = logBuffer.splice(0);
  const url =
    logs.length === 1 ? `${endpoint}${LOGS_ENDPOINT}` : `${endpoint}${LOGS_ENDPOINT}/batch`;
  const body = logs.length === 1 ? logs[0] : logs;

  try {
    navigator.sendBeacon(url, new Blob([JSON.stringify(body)], { type: "application/json" }));
  } catch {
    // Last resort
  }
}
