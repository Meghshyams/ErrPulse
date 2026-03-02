import type { ErrorSource, ErrorType, Severity } from "./enums.js";
import type { RequestContext } from "./request-context.js";
import type { EnvironmentInfo } from "./environment.js";

export interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
  colno: number;
  inApp: boolean;
  contextLine?: string;
  preContext?: string[];
  postContext?: string[];
}

export interface ErrPulseEvent {
  eventId: string;
  timestamp: string;
  type: ErrorType;
  message: string;
  stack?: string;
  stackFrames?: StackFrame[];
  source: ErrorSource;
  severity: Severity;
  fingerprint?: string;
  request?: RequestContext;
  environment?: EnvironmentInfo;
  correlationId?: string;
  componentStack?: string;
  componentName?: string;
  projectId?: string;
  extra?: Record<string, unknown>;
}

export interface ErrorGroup {
  id: string;
  fingerprint: string;
  type: ErrorType;
  message: string;
  source: ErrorSource;
  severity: Severity;
  status: string;
  explanation?: string;
  firstSeen: string;
  lastSeen: string;
  count: number;
  projectId?: string;
  lastEvent?: ErrPulseEvent;
}
