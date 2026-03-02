import React from "react";
import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrLensEvent,
} from "@errlens/core";
import { enqueueEvent } from "../client.js";

interface ErrorBoundaryProps {
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrLensErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const event: ErrLensEvent = {
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      type: ErrorType.ReactError,
      message: error.message || String(error),
      stack: error.stack,
      source: ErrorSource.Frontend,
      severity: Severity.Error,
      componentStack: errorInfo.componentStack ?? undefined,
      environment: {
        runtime: "browser",
        browser: navigator.userAgent,
        url: window.location.href,
      },
    };

    enqueueEvent(event);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error);
      }
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
