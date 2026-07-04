import React, { useEffect, useRef } from "react";
import { init, type CorrelationTarget } from "@errpulse/browser";
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
  /**
   * URLs to send the X-ErrPulse-Correlation-ID header to. Strings match as
   * substrings, RegExps are tested against the full URL. Defaults to
   * same-origin requests and localhost targets — the header forces a CORS
   * preflight, so it is never sent to third-party origins by default.
   */
  correlationPropagationTargets?: CorrelationTarget[];
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
  correlationPropagationTargets,
  errorBoundaryFallback,
}: ErrPulseProviderProps): React.ReactElement {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const teardown = init({
      endpoint,
      projectId,
      captureConsoleErrors,
      captureConsoleLogs,
      captureFetch,
      captureXHR,
      captureResourceErrors,
      correlationPropagationTargets,
    });

    return () => {
      teardown();
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
