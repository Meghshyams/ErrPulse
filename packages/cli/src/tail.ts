import { WebSocket } from "ws";
import type { ErrorGroup, WebSocketMessage, ErrPulseEvent } from "@errpulse/core";
import {
  formatNewError,
  formatRecurrence,
  formatFailedRequest,
  formatStatus,
  type RequestLogPayload,
} from "./render.js";

export interface TailOptions {
  port: number;
  /** Also print failed (4xx/5xx/network) HTTP requests. */
  showRequests?: boolean;
  /** Suppress connection status lines (used when the server runs in-process). */
  quiet?: boolean;
}

const RECONNECT_DELAY_MS = 2000;
// A tight error loop shouldn't scroll the terminal — at most one recurrence
// line per error group per window (the printed ×count stays cumulative).
const RECURRENCE_THROTTLE_MS = 2000;

export function startTail(options: TailOptions): () => void {
  const { port, showRequests = false, quiet = false } = options;
  const url = `ws://localhost:${port}/ws`;

  let stopped = false;
  let ws: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let announcedWaiting = false;
  const lastRecurrencePrint = new Map<string, number>();

  function handleMessage(raw: string): void {
    let message: WebSocketMessage;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    switch (message.type) {
      case "new_error": {
        console.log(formatNewError(message.payload as ErrorGroup));
        break;
      }
      case "new_event": {
        const { errorGroup } = message.payload as {
          errorGroup: ErrorGroup;
          event: ErrPulseEvent;
        };
        const now = Date.now();
        const last = lastRecurrencePrint.get(errorGroup.fingerprint) ?? 0;
        if (now - last >= RECURRENCE_THROTTLE_MS) {
          lastRecurrencePrint.set(errorGroup.fingerprint, now);
          console.log(formatRecurrence(errorGroup));
        }
        break;
      }
      case "new_request": {
        if (!showRequests) break;
        const line = formatFailedRequest(message.payload as RequestLogPayload);
        if (line) console.log(line);
        break;
      }
      default:
        break;
    }
  }

  function scheduleReconnect(): void {
    if (stopped || reconnectTimer) return;
    if (!announcedWaiting && !quiet) {
      console.log(formatStatus(`waiting for ErrPulse server on port ${port}…`, false));
      announcedWaiting = true;
    }
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, RECONNECT_DELAY_MS);
  }

  function connect(): void {
    if (stopped) return;

    ws = new WebSocket(url);

    ws.on("open", () => {
      if (!quiet || announcedWaiting) {
        console.log(formatStatus(`connected — streaming errors from port ${port}`));
      }
      announcedWaiting = false;
    });

    ws.on("message", (data) => handleMessage(data.toString()));

    ws.on("close", () => scheduleReconnect());

    ws.on("error", () => {
      // 'close' follows and handles the reconnect; this handler just
      // prevents an unhandled error event from crashing the process.
    });
  }

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}
