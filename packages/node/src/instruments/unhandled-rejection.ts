import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrPulseEvent,
} from "@errpulse/core";
import { enqueueEvent } from "../client.js";
import { parseStack } from "../helpers/stack-parser.js";
import { getEnvironment } from "../helpers/environment.js";

let installed = false;

export function installUnhandledRejectionHandler(): () => void {
  if (installed) return () => {};
  installed = true;

  const handler = (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    const event: ErrPulseEvent = {
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      type: ErrorType.UnhandledRejection,
      message: error.message || String(reason),
      stack: error.stack,
      stackFrames: error.stack ? parseStack(error.stack) : undefined,
      source: ErrorSource.Backend,
      severity: Severity.Error,
      environment: getEnvironment(),
    };

    enqueueEvent(event);
  };

  process.on("unhandledRejection", handler);

  return () => {
    process.removeListener("unhandledRejection", handler);
    installed = false;
  };
}
