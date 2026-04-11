// Types
export { ErrorSource, Severity, ErrorType, ErrorStatus, LogLevel } from "./types/enums.js";
export type { LogEntry } from "./types/log-entry.js";
export type { StackFrame, ErrPulseEvent, ErrorGroup } from "./types/error-event.js";
export type { RequestContext } from "./types/request-context.js";
export type { EnvironmentInfo } from "./types/environment.js";
export type {
  IngestResponse,
  ErrorListResponse,
  ErrorDetailResponse,
  RequestLogEntry,
  RequestListResponse,
  HealthStats,
  WebSocketMessage,
  ErrorFilters,
  Project,
} from "./types/api.js";

// Utils
export { computeFingerprint } from "./utils/fingerprint.js";
export {
  normalizeMessage,
  normalizeStackFrames,
  getInAppFrames,
  getTopFrames,
} from "./utils/normalize.js";
export { sanitizeHeaders, sanitizeObject } from "./utils/sanitize.js";
export { generateEventId, generateCorrelationId } from "./utils/uuid.js";

// Explanations
export { explainError, matchPattern } from "./explanations/matcher.js";
export type { ErrorExplanation } from "./explanations/matcher.js";
export { ERROR_PATTERNS } from "./explanations/patterns.js";
export type { ErrorPattern } from "./explanations/patterns.js";

// Constants
export {
  DEFAULT_SERVER_PORT,
  DEFAULT_DB_DIR,
  DEFAULT_DB_FILENAME,
  DEFAULT_SERVER_URL,
  EVENTS_ENDPOINT,
  ERRORS_ENDPOINT,
  REQUESTS_ENDPOINT,
  HEALTH_ENDPOINT,
  STATS_ENDPOINT,
  CORRELATION_HEADER,
  PROJECT_HEADER,
  MAX_MESSAGE_LENGTH,
  MAX_STACK_FRAMES,
  BATCH_SIZE,
  BATCH_INTERVAL_MS,
  SENSITIVE_HEADERS,
  SENSITIVE_FIELDS,
  LOGS_ENDPOINT,
  LOG_BATCH_SIZE,
  LOG_BATCH_INTERVAL_MS,
} from "./constants.js";
