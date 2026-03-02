import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  sanitizeHeaders,
  CORRELATION_HEADER,
  type ErrLensEvent,
  type RequestContext,
} from "@errlens/core";
import { enqueueEvent, sendRequest } from "../client.js";
import { parseStack } from "../helpers/stack-parser.js";
import { getEnvironment } from "../helpers/environment.js";
import { extractOrCreateCorrelationId, runWithCorrelation } from "../helpers/correlation.js";

type Request = {
  method: string;
  url: string;
  originalUrl?: string;
  path?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string>;
  body?: unknown;
  ip?: string;
};

type Response = {
  statusCode: number;
  on(event: string, listener: () => void): void;
};

type NextFunction = (err?: unknown) => void;

export function expressRequestHandler() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const correlationId = extractOrCreateCorrelationId(
      req.headers as Record<string, string | string[] | undefined>
    );
    const startTime = Date.now();

    // Track response completion to log request
    res.on("finish", () => {
      try {
        const duration = Date.now() - startTime;
        sendRequest({
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString(),
          correlationId,
          source: "backend",
        });
      } catch {
        // Never crash host app
      }
    });

    // Run the rest of the middleware chain with correlation context
    runWithCorrelation(correlationId, () => next());
  };
}

export function expressErrorHandler() {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    try {
      const correlationId = extractOrCreateCorrelationId(
        req.headers as Record<string, string | string[] | undefined>
      );

      const requestContext: RequestContext = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode >= 400 ? res.statusCode : 500,
        headers: sanitizeHeaders(
          Object.fromEntries(
            Object.entries(req.headers).map(([k, v]) => [
              k,
              Array.isArray(v) ? v.join(", ") : v || "",
            ])
          )
        ),
        query: req.query as Record<string, string>,
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
      };

      const event: ErrLensEvent = {
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        type: ErrorType.HttpError,
        message: err.message || String(err),
        stack: err.stack,
        stackFrames: err.stack ? parseStack(err.stack) : undefined,
        source: ErrorSource.Backend,
        severity: Severity.Error,
        request: requestContext,
        environment: getEnvironment(),
        correlationId,
      };

      enqueueEvent(event);
    } catch {
      // Never crash host app
    }

    next(err);
  };
}
