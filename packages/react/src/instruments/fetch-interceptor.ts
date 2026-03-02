import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  CORRELATION_HEADER,
  generateCorrelationId,
  type ErrPulseEvent,
} from "@errpulse/core";
import { enqueueEvent, getEndpoint, sendRequestLog } from "../client.js";

export function installFetchInterceptor(): () => void {
  const originalFetch = window.fetch;

  // Store original so our client can use it
  (window as unknown as { __errpulse_original_fetch: typeof fetch }).__errpulse_original_fetch =
    originalFetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    // Don't intercept calls to ErrPulse itself
    const errPulseEndpoint = getEndpoint();
    if (errPulseEndpoint && url.startsWith(errPulseEndpoint)) {
      return originalFetch.call(window, input, init);
    }

    // Inject correlation ID
    const correlationId = generateCorrelationId();
    const headers = new Headers(init?.headers);
    headers.set(CORRELATION_HEADER, correlationId);

    const method = init?.method ?? "GET";
    const startTime = Date.now();

    try {
      const response = await originalFetch.call(window, input, {
        ...init,
        headers,
      });

      const duration = Date.now() - startTime;

      // Log ALL requests to the Requests tab
      sendRequestLog({
        method,
        url,
        statusCode: response.status,
        duration,
        timestamp: new Date().toISOString(),
        correlationId,
        source: "frontend",
      });

      // Additionally report 4xx/5xx as error events
      if (response.status >= 400) {
        const event: ErrPulseEvent = {
          eventId: generateEventId(),
          timestamp: new Date().toISOString(),
          type: ErrorType.HttpError,
          message: `HTTP ${response.status} ${response.statusText} — ${method} ${url}`,
          source: ErrorSource.Frontend,
          severity: response.status >= 500 ? Severity.Error : Severity.Warning,
          correlationId,
          request: {
            method,
            url,
            statusCode: response.status,
            duration,
          },
          environment: {
            runtime: "browser",
            browser: navigator.userAgent,
            url: window.location.href,
          },
        };

        enqueueEvent(event);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log failed request
      sendRequestLog({
        method,
        url,
        statusCode: 0,
        duration,
        timestamp: new Date().toISOString(),
        correlationId,
        source: "frontend",
      });

      // Network error event
      const err = error instanceof Error ? error : new Error(String(error));
      const event: ErrPulseEvent = {
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        type: ErrorType.NetworkError,
        message: `Fetch failed: ${err.message} — ${method} ${url}`,
        stack: err.stack,
        source: ErrorSource.Frontend,
        severity: Severity.Error,
        correlationId,
        request: {
          method,
          url,
          duration,
        },
        environment: {
          runtime: "browser",
          browser: navigator.userAgent,
          url: window.location.href,
        },
      };

      enqueueEvent(event);
      throw error;
    }
  };

  return () => {
    window.fetch = originalFetch;
  };
}
