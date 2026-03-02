import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  CORRELATION_HEADER,
  generateCorrelationId,
  type ErrPulseEvent,
} from "@errpulse/core";
import { enqueueEvent, getEndpoint } from "../client.js";

export function installXHRInterceptor(): () => void {
  const OriginalXHR = window.XMLHttpRequest;
  const originalOpen = OriginalXHR.prototype.open;
  const originalSend = OriginalXHR.prototype.send;

  OriginalXHR.prototype.open = function (method: string, url: string | URL, ...args: unknown[]) {
    (this as unknown as { _errpulse_method: string })._errpulse_method = method;
    (this as unknown as { _errpulse_url: string })._errpulse_url = String(url);
    (this as unknown as { _errpulse_start: number })._errpulse_start = Date.now();
    return (originalOpen as Function).call(this, method, url, ...args);
  };

  OriginalXHR.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const method = (this as unknown as { _errpulse_method: string })._errpulse_method;
    const url = (this as unknown as { _errpulse_url: string })._errpulse_url;
    const startTime = (this as unknown as { _errpulse_start: number })._errpulse_start;

    // Don't intercept calls to ErrPulse
    const errPulseEndpoint = getEndpoint();
    if (errPulseEndpoint && url.startsWith(errPulseEndpoint)) {
      return originalSend.call(this, body);
    }

    // Inject correlation ID
    const correlationId = generateCorrelationId();
    try {
      this.setRequestHeader(CORRELATION_HEADER, correlationId);
    } catch {
      // May throw if request is already sent
    }

    this.addEventListener("loadend", () => {
      if (this.status >= 400) {
        const event: ErrPulseEvent = {
          eventId: generateEventId(),
          timestamp: new Date().toISOString(),
          type: ErrorType.HttpError,
          message: `XHR ${this.status} ${this.statusText} — ${method} ${url}`,
          source: ErrorSource.Frontend,
          severity: this.status >= 500 ? Severity.Error : Severity.Warning,
          correlationId,
          request: {
            method,
            url,
            statusCode: this.status,
            duration: Date.now() - startTime,
          },
          environment: {
            runtime: "browser",
            browser: navigator.userAgent,
            url: window.location.href,
          },
        };

        enqueueEvent(event);
      }
    });

    this.addEventListener("error", () => {
      const event: ErrPulseEvent = {
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        type: ErrorType.NetworkError,
        message: `XHR failed — ${method} ${url}`,
        source: ErrorSource.Frontend,
        severity: Severity.Error,
        correlationId,
        request: {
          method,
          url,
          duration: Date.now() - startTime,
        },
        environment: {
          runtime: "browser",
          browser: navigator.userAgent,
          url: window.location.href,
        },
      };

      enqueueEvent(event);
    });

    return originalSend.call(this, body);
  };

  return () => {
    OriginalXHR.prototype.open = originalOpen;
    OriginalXHR.prototype.send = originalSend;
  };
}
