import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrLensEvent,
} from "@errlens/core";
import { enqueueEvent, flushAll } from "../client.js";
import { parseStack } from "../helpers/stack-parser.js";
import { getEnvironment } from "../helpers/environment.js";

let installed = false;

export function installUncaughtExceptionHandler(): () => void {
  if (installed) return () => {};
  installed = true;

  const handler = async (error: Error) => {
    const event: ErrLensEvent = {
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      type: ErrorType.UncaughtException,
      message: error.message || String(error),
      stack: error.stack,
      stackFrames: error.stack ? parseStack(error.stack) : undefined,
      source: ErrorSource.Backend,
      severity: Severity.Fatal,
      environment: getEnvironment(),
    };

    enqueueEvent(event);
    await flushAll();
  };

  process.on("uncaughtException", handler);

  return () => {
    process.removeListener("uncaughtException", handler);
    installed = false;
  };
}
