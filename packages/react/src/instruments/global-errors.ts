import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrLensEvent,
} from "@errlens/core";
import { enqueueEvent } from "../client.js";

export function installGlobalErrorHandler(): () => void {
  const handler = (event: ErrorEvent) => {
    const err = event.error;
    const errEvent: ErrLensEvent = {
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      type: ErrorType.UncaughtException,
      message: event.message || (err?.message ?? "Unknown error"),
      stack: err?.stack,
      source: ErrorSource.Frontend,
      severity: Severity.Error,
      environment: {
        runtime: "browser",
        browser: navigator.userAgent,
        url: window.location.href,
      },
    };

    enqueueEvent(errEvent);
  };

  window.addEventListener("error", handler);
  return () => window.removeEventListener("error", handler);
}
