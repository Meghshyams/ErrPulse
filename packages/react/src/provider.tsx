import React, { useEffect, useRef } from "react";
import { setEndpoint, setProjectId, flushWithBeacon } from "./client.js";
import { installGlobalErrorHandler } from "./instruments/global-errors.js";
import { installUnhandledRejectionHandler } from "./instruments/unhandled-rejections.js";
import { installFetchInterceptor } from "./instruments/fetch-interceptor.js";
import { installXHRInterceptor } from "./instruments/xhr-interceptor.js";
import { installConsoleInterceptor } from "./instruments/console-interceptor.js";
import { installResourceErrorHandler } from "./instruments/resource-errors.js";
import { ErrLensErrorBoundary } from "./components/ErrorBoundary.js";

interface ErrLensProviderProps {
  endpoint: string;
  projectId?: string;
  children: React.ReactNode;
  captureConsoleErrors?: boolean;
  captureFetch?: boolean;
  captureXHR?: boolean;
  captureResourceErrors?: boolean;
  errorBoundaryFallback?: React.ReactNode | ((error: Error) => React.ReactNode);
}

export function ErrLensProvider({
  endpoint,
  projectId,
  children,
  captureConsoleErrors = true,
  captureFetch = true,
  captureXHR = true,
  captureResourceErrors = true,
  errorBoundaryFallback,
}: ErrLensProviderProps): React.ReactElement {
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
    if (captureResourceErrors) cleanups.push(installResourceErrorHandler());

    // Flush on page unload
    const handleUnload = () => flushWithBeacon();
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      for (const cleanup of cleanups) cleanup();
      window.removeEventListener("beforeunload", handleUnload);
      initialized.current = false;
    };
  }, [endpoint, captureConsoleErrors, captureFetch, captureXHR, captureResourceErrors]);

  return <ErrLensErrorBoundary fallback={errorBoundaryFallback}>{children}</ErrLensErrorBoundary>;
}
