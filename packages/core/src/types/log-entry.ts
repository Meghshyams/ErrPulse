import type { LogLevel } from "./enums.js";
import type { ErrorSource } from "./enums.js";
import type { EnvironmentInfo } from "./environment.js";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  source: ErrorSource;
  environment?: EnvironmentInfo;
  correlationId?: string;
  projectId?: string;
  extra?: Record<string, unknown>;
}
