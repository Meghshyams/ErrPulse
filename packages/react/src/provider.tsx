import React, { useEffect, useRef } from "react";
import { setEndpoint, setProjectId, flushWithBeacon, flushLogsWithBeacon } from "./client.js";
import { installGlobalErrorHandler } from "./instruments/global-errors.js";
import { installUnhandledRejectionHandler } from "./instruments/unhandled-rejections.js";
import { installFetchInterceptor } from "./instruments/fetch-interceptor.js";
import { installXHRInterceptor } from "./instruments/xhr-interceptor.js";
import { installConsoleInterceptor } from "./instruments/console-interceptor.js";
import { installConsoleLogInterceptor } from "./instruments/console-log-interceptor.js";
import { installResourceErrorHandler } from "./instruments/resource-errors.js";
import { ErrPulseErrorBoundary } from "./components/ErrorBoundary.js";

interface ErrPulseProviderProps {
  endpoint: string;
  projectId?: string;
  children: React.ReactNode;
  captureConsoleErrors?: boolean;
  captureConsoleLogs?: boolean;
  captureFetch?: boolean;
  captureXHR?: boolean;
  captureResourceErrors?: boolean;
  errorBoundaryFallback?: React.ReactNode | ((error: Error) => React.ReactNode);
}

export function ErrPulseProvider({
  endpoint,
  projectId,
  children,
  captureConsoleErrors = true,
  captureConsoleLogs = false,
  captureFetch = true,
  captureXHR = true,
  captureResourceErrors = true,
  errorBoundaryFallback,
}: ErrPulseProviderProps): React.ReactElement {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setEndpoint(endpoint);
    if (projectId) setProjectId(projectId);

    const cleanups: (() => void)[] = [];

    cleanups.push(installGlobalErrorHandler());
    cleanups.push(installUnhandledRejectionHandler());

    if (captureFetch) cleanups.push(installFetchInterceptor());
    if (captureXHR) cleanups.push(installXHRInterceptor());
    if (captureConsoleErrors) cleanups.push(installConsoleInterceptor());
    if (captureConsoleLogs) cleanups.push(installConsoleLogInterceptor());
    if (captureResourceErrors) cleanups.push(installResourceErrorHandler());

    // Flush on page unload
    const handleUnload = () => {
      flushWithBeacon();
      flushLogsWithBeacon();
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      for (const cleanup of cleanups) cleanup();
      window.removeEventListener("beforeunload", handleUnload);
      initialized.current = false;
    };
  }, [
    endpoint,
    captureConsoleErrors,
    captureConsoleLogs,
    captureFetch,
    captureXHR,
    captureResourceErrors,
  ]);

  return <ErrPulseErrorBoundary fallback={errorBoundaryFallback}>{children}</ErrPulseErrorBoundary>;
}
