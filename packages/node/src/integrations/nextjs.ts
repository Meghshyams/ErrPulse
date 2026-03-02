import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  CORRELATION_HEADER,
  generateCorrelationId,
  type ErrPulseEvent,
} from "@errpulse/core";
import { enqueueEvent, sendRequest } from "../client.js";
import { parseStack } from "../helpers/stack-parser.js";
import { getEnvironment } from "../helpers/environment.js";

type NextRequest = {
  method: string;
  url: string;
  headers: { get(name: string): string | null };
  nextUrl?: { pathname: string };
};

type NextResponse = {
  status: number;
};

/**
 * Wraps a Next.js API route handler to capture errors and log requests.
 *
 * Usage:
 *   import { withErrPulse } from '@errpulse/node'
 *   export const GET = withErrPulse(async (req) => { ... })
 */
export function withErrPulse<T extends (...args: unknown[]) => Promise<unknown>>(handler: T): T {
  return (async (...args: unknown[]) => {
    const req = args[0] as NextRequest | undefined;
    const method = req?.method ?? "UNKNOWN";
    const url = req?.nextUrl?.pathname ?? req?.url ?? "/";
    const correlationId = req?.headers?.get(CORRELATION_HEADER) ?? generateCorrelationId();
    const startTime = Date.now();

    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;

      // Log the request
      const statusCode = (result as NextResponse)?.status ?? 200;
      sendRequest({
        method,
        url,
        statusCode,
        duration,
        timestamp: new Date().toISOString(),
        correlationId,
        source: "backend",
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      // Log the failed request
      sendRequest({
        method,
        url,
        statusCode: 500,
        duration,
        timestamp: new Date().toISOString(),
        correlationId,
        source: "backend",
      });

      // Capture the error
      const event: ErrPulseEvent = {
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        type: ErrorType.HttpError,
        message: err.message || String(err),
        stack: err.stack,
        stackFrames: err.stack ? parseStack(err.stack) : undefined,
        source: ErrorSource.Backend,
        severity: Severity.Error,
        request: {
          method,
          url,
          statusCode: 500,
          duration,
        },
        environment: getEnvironment(),
        correlationId,
      };

      enqueueEvent(event);
      throw error;
    }
  }) as T;
}
