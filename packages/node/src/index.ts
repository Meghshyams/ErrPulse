import type { ErrLensEvent } from "@errlens/core";
import { ErrorType, ErrorSource, Severity, generateEventId } from "@errlens/core";
import { configure, getConfig, type NodeSDKConfig } from "./config.js";
import { enqueueEvent, flushAll } from "./client.js";
import { installUncaughtExceptionHandler } from "./instruments/uncaught-exception.js";
import { installUnhandledRejectionHandler } from "./instruments/unhandled-rejection.js";
import { installConsoleErrorInterceptor } from "./instruments/console-error.js";
import { installMemoryMonitor } from "./instruments/memory-monitor.js";
import { parseStack } from "./helpers/stack-parser.js";
import { getEnvironment } from "./helpers/environment.js";
import { getCorrelationId } from "./helpers/correlation.js";

// Re-exports
export { configure, getConfig } from "./config.js";
export type { NodeSDKConfig } from "./config.js";
export { expressRequestHandler, expressErrorHandler } from "./integrations/express.js";
export { withErrLens } from "./integrations/nextjs.js";
export { flushAll } from "./client.js";
export { getCorrelationId } from "./helpers/correlation.js";

const cleanups: (() => void)[] = [];

export function init(options?: Partial<NodeSDKConfig>): void {
  if (options) configure(options);

  const config = getConfig();
  if (!config.enabled) return;

  if (config.captureUncaughtExceptions) {
    cleanups.push(installUncaughtExceptionHandler());
  }
  if (config.captureUnhandledRejections) {
    cleanups.push(installUnhandledRejectionHandler());
  }
  if (config.captureConsoleErrors) {
    cleanups.push(installConsoleErrorInterceptor());
  }
  if (config.monitorMemory) {
    cleanups.push(installMemoryMonitor());
  }

  // Flush on exit
  process.on("beforeExit", () => {
    flushAll();
  });
}

export function captureError(error: Error | string, extra?: Record<string, unknown>): string {
  const err = typeof error === "string" ? new Error(error) : error;
  const eventId = generateEventId();

  const event: ErrLensEvent = {
    eventId,
    timestamp: new Date().toISOString(),
    type: ErrorType.Manual,
    message: err.message || String(err),
    stack: err.stack,
    stackFrames: err.stack ? parseStack(err.stack) : undefined,
    source: ErrorSource.Backend,
    severity: Severity.Error,
    environment: getEnvironment(),
    correlationId: getCorrelationId(),
    projectId: getConfig().projectId,
    extra,
  };

  enqueueEvent(event);
  return eventId;
}

export function captureMessage(
  message: string,
  severity: "info" | "warning" | "error" = "info",
  extra?: Record<string, unknown>
): string {
  const eventId = generateEventId();

  const event: ErrLensEvent = {
    eventId,
    timestamp: new Date().toISOString(),
    type: ErrorType.Manual,
    message,
    source: ErrorSource.Backend,
    severity: severity as Severity,
    environment: getEnvironment(),
    correlationId: getCorrelationId(),
    projectId: getConfig().projectId,
    extra,
  };

  enqueueEvent(event);
  return eventId;
}

export function close(): void {
  for (const cleanup of cleanups) {
    cleanup();
  }
  cleanups.length = 0;
  flushAll();
}

// Auto-init with defaults when imported (can be overridden by calling init())
init();
