export enum ErrorSource {
  Backend = "backend",
  Frontend = "frontend",
}

export enum Severity {
  Fatal = "fatal",
  Error = "error",
  Warning = "warning",
  Info = "info",
}

export enum ErrorType {
  UncaughtException = "uncaught_exception",
  UnhandledRejection = "unhandled_rejection",
  HttpError = "http_error",
  ConsoleError = "console_error",
  ReactError = "react_error",
  ResourceError = "resource_error",
  NetworkError = "network_error",
  MemoryWarning = "memory_warning",
  Manual = "manual",
}

export enum ErrorStatus {
  Unresolved = "unresolved",
  Acknowledged = "acknowledged",
  Resolved = "resolved",
  Ignored = "ignored",
}

export enum LogLevel {
  Log = "log",
  Info = "info",
  Warn = "warn",
  Debug = "debug",
}
