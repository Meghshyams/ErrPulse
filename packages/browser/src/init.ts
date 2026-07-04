import { DEFAULT_SERVER_PORT } from "@errpulse/core";
import { setEndpoint, setProjectId, flushWithBeacon, flushLogsWithBeacon } from "./client.js";
import { installGlobalErrorHandler } from "./instruments/global-errors.js";
import { installUnhandledRejectionHandler } from "./instruments/unhandled-rejections.js";
import { installFetchInterceptor } from "./instruments/fetch-interceptor.js";
import { installXHRInterceptor } from "./instruments/xhr-interceptor.js";
import { installConsoleInterceptor } from "./instruments/console-interceptor.js";
import { installConsoleLogInterceptor } from "./instruments/console-log-interceptor.js";
import { installResourceErrorHandler } from "./instruments/resource-errors.js";
import {
  setCorrelationPropagationTargets,
  type CorrelationTarget,
} from "./instruments/correlation-target.js";

export interface ErrPulseInitOptions {
  /** ErrPulse server URL. Default: http://localhost:3800 */
  endpoint?: string;
  /** Project ID shown in the dashboard's project selector */
  projectId?: string;
  /** Capture console.error calls as error events. Default: true */
  captureConsoleErrors?: boolean;
  /** Capture console.log/warn/info/debug as log entries. Default: false */
  captureConsoleLogs?: boolean;
  /** Intercept fetch to log requests and report failures. Default: true */
  captureFetch?: boolean;
  /** Intercept XMLHttpRequest to report failures. Default: true */
  captureXHR?: boolean;
  /** Capture resource load failures (img, script, css). Default: true */
  captureResourceErrors?: boolean;
  /**
   * URLs to send the X-ErrPulse-Correlation-ID header to. Strings match as
   * substrings, RegExps are tested against the full URL. Defaults to
   * same-origin requests and localhost targets.
   */
  correlationPropagationTargets?: CorrelationTarget[];
}

let teardown: (() => void) | null = null;

/**
 * Install all ErrPulse browser instrumentation in one call.
 * Safe to call in any framework (or none). Returns a teardown function.
 * Calling init() again while installed is a no-op returning the same teardown.
 */
export function init(options: ErrPulseInitOptions = {}): () => void {
  if (typeof window === "undefined") return () => {};
  if (teardown) return teardown;

  setEndpoint(options.endpoint ?? `http://localhost:${DEFAULT_SERVER_PORT}`);
  if (options.projectId) setProjectId(options.projectId);
  setCorrelationPropagationTargets(options.correlationPropagationTargets);

  const cleanups: (() => void)[] = [];
  cleanups.push(installGlobalErrorHandler());
  cleanups.push(installUnhandledRejectionHandler());

  if (options.captureFetch !== false) cleanups.push(installFetchInterceptor());
  if (options.captureXHR !== false) cleanups.push(installXHRInterceptor());
  if (options.captureConsoleErrors !== false) cleanups.push(installConsoleInterceptor());
  if (options.captureConsoleLogs === true) cleanups.push(installConsoleLogInterceptor());
  if (options.captureResourceErrors !== false) cleanups.push(installResourceErrorHandler());

  const handleUnload = () => {
    flushWithBeacon();
    flushLogsWithBeacon();
  };
  window.addEventListener("beforeunload", handleUnload);

  teardown = () => {
    for (const cleanup of cleanups) cleanup();
    window.removeEventListener("beforeunload", handleUnload);
    teardown = null;
  };
  return teardown;
}
