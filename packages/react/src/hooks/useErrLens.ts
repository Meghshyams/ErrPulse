import { useCallback } from "react";
import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrLensEvent,
} from "@errlens/core";
import { enqueueEvent } from "../client.js";

export function useErrLens() {
  const captureError = useCallback((error: Error | string, extra?: Record<string, unknown>) => {
    const err = typeof error === "string" ? new Error(error) : error;
    const event: ErrLensEvent = {
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      type: ErrorType.Manual,
      message: err.message || String(err),
      stack: err.stack,
      source: ErrorSource.Frontend,
      severity: Severity.Error,
      environment: {
        runtime: "browser",
        browser: navigator.userAgent,
        url: window.location.href,
      },
      extra,
    };
    enqueueEvent(event);
  }, []);

  const captureMessage = useCallback(
    (
      message: string,
      severity: "info" | "warning" | "error" = "info",
      extra?: Record<string, unknown>
    ) => {
      const event: ErrLensEvent = {
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        type: ErrorType.Manual,
        message,
        source: ErrorSource.Frontend,
        severity: severity as Severity,
        environment: {
          runtime: "browser",
          browser: navigator.userAgent,
          url: window.location.href,
        },
        extra,
      };
      enqueueEvent(event);
    },
    []
  );

  return { captureError, captureMessage };
}
