import { EVENTS_ENDPOINT, BATCH_SIZE, BATCH_INTERVAL_MS, type ErrLensEvent } from "@errlens/core";

let endpoint = "";
let projectId = "";
let buffer: ErrLensEvent[] = [];
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

async function sendBatch(events: ErrLensEvent[]): Promise<void> {
  if (!endpoint || events.length === 0) return;

  const url =
    events.length === 1 ? `${endpoint}${EVENTS_ENDPOINT}` : `${endpoint}${EVENTS_ENDPOINT}/batch`;
  const body = events.length === 1 ? events[0] : events;

  try {
    // Use the original fetch to avoid our interceptor
    const originalFetch =
      (window as unknown as { __errlens_original_fetch?: typeof fetch }).__errlens_original_fetch ||
      fetch;
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

export function enqueueEvent(event: ErrLensEvent): void {
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
  source?: string;
}): void {
  if (!endpoint) return;
  try {
    const payload = { ...entry, projectId: projectId || undefined };
    const originalFetch =
      (window as unknown as { __errlens_original_fetch?: typeof fetch }).__errlens_original_fetch ||
      fetch;
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
