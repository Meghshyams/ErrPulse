import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrPulseEvent,
} from "@errpulse/core";
import { enqueueEvent } from "../client.js";

export function installConsoleInterceptor(): () => void {
  const originalConsoleError = console.error;

  console.error = (...args: unknown[]) => {
    originalConsoleError.apply(console, args);

    try {
      const message = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");

      const event: ErrPulseEvent = {
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        type: ErrorType.ConsoleError,
        message,
        source: ErrorSource.Frontend,
        severity: Severity.Warning,
        environment: {
          runtime: "browser",
          browser: navigator.userAgent,
          url: window.location.href,
        },
      };

      enqueueEvent(event);
    } catch {
      // Never crash the host app
    }
  };

  return () => {
    console.error = originalConsoleError;
  };
}
