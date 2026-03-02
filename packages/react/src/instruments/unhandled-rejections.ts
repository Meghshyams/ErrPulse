import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrLensEvent,
} from "@errlens/core";
import { enqueueEvent } from "../client.js";

export function installUnhandledRejectionHandler(): () => void {
  const handler = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));

    const errEvent: ErrLensEvent = {
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      type: ErrorType.UnhandledRejection,
      message: error.message || String(reason),
      stack: error.stack,
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

  window.addEventListener("unhandledrejection", handler);
  return () => window.removeEventListener("unhandledrejection", handler);
}
