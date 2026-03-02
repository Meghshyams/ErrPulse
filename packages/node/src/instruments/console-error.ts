import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrPulseEvent,
} from "@errpulse/core";
import { enqueueEvent } from "../client.js";
import { getEnvironment } from "../helpers/environment.js";
import { getCorrelationId } from "../helpers/correlation.js";

let originalConsoleError: typeof console.error | null = null;

export function installConsoleErrorInterceptor(): () => void {
  if (originalConsoleError) return () => {};

  originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    // Always call original
    originalConsoleError!.apply(console, args);

    try {
      const message = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");

      const event: ErrPulseEvent = {
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        type: ErrorType.ConsoleError,
        message,
        source: ErrorSource.Backend,
        severity: Severity.Warning,
        environment: getEnvironment(),
        correlationId: getCorrelationId(),
      };

      enqueueEvent(event);
    } catch {
      // Never crash the host app
    }
  };

  return () => {
    if (originalConsoleError) {
      console.error = originalConsoleError;
      originalConsoleError = null;
    }
  };
}
