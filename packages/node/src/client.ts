import { EVENTS_ENDPOINT, BATCH_SIZE, BATCH_INTERVAL_MS, type ErrPulseEvent } from "@errpulse/core";
import { getConfig } from "./config.js";

let buffer: ErrPulseEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

async function sendBatch(events: ErrPulseEvent[]): Promise<void> {
  const config = getConfig();
  if (!config.enabled || events.length === 0) return;

  const url =
    events.length === 1
      ? `${config.serverUrl}${EVENTS_ENDPOINT}`
      : `${config.serverUrl}${EVENTS_ENDPOINT}/batch`;
  const body = events.length === 1 ? events[0] : events;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (!resp.ok) {
      console.warn(`[ErrPulse] Failed to send events: ${resp.status}`);
    }
  } catch {
    // Silently fail — SDK must never crash host app
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, BATCH_INTERVAL_MS);
}

async function flush(): Promise<void> {
  if (isFlushing || buffer.length === 0) return;
  isFlushing = true;

  const batch = buffer.splice(0);
  await sendBatch(batch);

  isFlushing = false;

  // If more events accumulated during flush, schedule another
  if (buffer.length > 0) {
    scheduleFlush();
  }
}

export function enqueueEvent(event: ErrPulseEvent): void {
  const config = getConfig();
  if (!config.enabled) return;

  // Sample rate check
  if (config.sampleRate < 1 && Math.random() > config.sampleRate) return;

  // Inject projectId
  if (config.projectId && !event.projectId) {
    event.projectId = config.projectId;
  }

  // beforeSend hook
  if (config.beforeSend) {
    const result = config.beforeSend(event);
    if (!result) return;
    buffer.push(result);
  } else {
    buffer.push(event);
  }

  if (buffer.length >= BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

export async function flushAll(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flush();
}

// Send a request log entry
export async function sendRequest(entry: {
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
}): Promise<void> {
  const config = getConfig();
  if (!config.enabled) return;

  const payload = {
    ...entry,
    projectId: entry.projectId ?? config.projectId,
  };

  try {
    await fetch(`${config.serverUrl}${EVENTS_ENDPOINT}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Silently fail
  }
}
