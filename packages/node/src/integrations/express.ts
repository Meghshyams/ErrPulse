import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  sanitizeHeaders,
  sanitizeObject,
  CORRELATION_HEADER,
  type ErrPulseEvent,
  type RequestContext,
} from "@errpulse/core";
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
  getHeaders(): Record<string, string | string[] | number | undefined>;
  write: (...args: unknown[]) => boolean;
  end: (...args: unknown[]) => void;
};

type NextFunction = (err?: unknown) => void;

// Max size for request body capture (16 KB) to avoid performance issues
const MAX_BODY_SIZE = 16 * 1024;

function flattenHeaders(
  headers: Record<string, string | string[] | number | undefined>
): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    flat[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  return flat;
}

function captureBody(body: unknown): string | undefined {
  if (body === undefined || body === null) return undefined;
  try {
    const str = typeof body === "string" ? body : JSON.stringify(sanitizeObject(body));
    // Truncate if too large
    if (str.length > MAX_BODY_SIZE) {
      return str.slice(0, MAX_BODY_SIZE) + "...[truncated]";
    }
    return str;
  } catch {
    return undefined;
  }
}

export function expressRequestHandler() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const correlationId = extractOrCreateCorrelationId(
      req.headers as Record<string, string | string[] | undefined>
    );
    const startTime = Date.now();

    // Capture request headers and body early (before body may be consumed)
    const reqHeaders = sanitizeHeaders(
      flattenHeaders(req.headers as Record<string, string | string[] | number | undefined>)
    );
    const reqBody = captureBody(req.body);

    // Intercept response body by patching write/end (size-limited)
    const resChunks: Buffer[] = [];
    let resBodySize = 0;
    let resBodyOverflow = false;
    const origWrite = res.write;
    const origEnd = res.end;

    res.write = (chunk: unknown, ...args: unknown[]): boolean => {
      if (!resBodyOverflow && chunk) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
        resBodySize += buf.length;
        if (resBodySize <= MAX_BODY_SIZE) {
          resChunks.push(buf);
        } else {
          resBodyOverflow = true;
        }
      }
      return (origWrite as Function).apply(res, [chunk, ...args]) as boolean;
    };

    res.end = (chunk: unknown, ...args: unknown[]): void => {
      if (!resBodyOverflow && chunk && typeof chunk !== "function") {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
        resBodySize += buf.length;
        if (resBodySize <= MAX_BODY_SIZE) {
          resChunks.push(buf);
        } else {
          resBodyOverflow = true;
        }
      }
      (origEnd as Function).apply(res, [chunk, ...args]);
    };

    // Track response completion to log request
    res.on("finish", () => {
      try {
        const duration = Date.now() - startTime;

        // Capture response headers
        let resHeaders: Record<string, string> | undefined;
        try {
          resHeaders = flattenHeaders(res.getHeaders());
        } catch {
          // getHeaders may not exist in all environments
        }

        // Build response body string
        let resBody: string | undefined;
        if (resChunks.length > 0) {
          resBody = Buffer.concat(resChunks).toString("utf-8");
          if (resBodyOverflow) {
            resBody += "...[truncated]";
          }
        }

        sendRequest({
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString(),
          correlationId,
          headers: reqHeaders,
          responseHeaders: resHeaders,
          requestBody: reqBody,
          responseBody: resBody,
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

      const event: ErrPulseEvent = {
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
