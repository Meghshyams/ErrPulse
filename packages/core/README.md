<p align="center">
  <img src="https://img.shields.io/badge/ErrPulse-Core-f43f5e?style=for-the-badge&labelColor=09090b" alt="@errpulse/core" />
</p>

# @errpulse/core

Shared types, error fingerprinting, PII sanitization, and plain-English error explanations for the [ErrPulse](https://github.com/Meghshyams/ErrPulse) ecosystem.

## Installation

```bash
npm install @errpulse/core
```

## Usage

### Error Fingerprinting

```ts
import { computeFingerprint } from "@errpulse/core";

const fingerprint = computeFingerprint({
  type: "TypeError",
  message: "Cannot read properties of undefined",
  stackFrames: [{ file: "app.ts", line: 42, column: 5, function: "handleClick" }],
});
// SHA-256 hash — same error = same fingerprint
```

### Error Explanations

```ts
import { explainError, ERROR_PATTERNS } from "@errpulse/core";

const explanation = explainError(
  "TypeError",
  "Cannot read properties of undefined (reading 'map')"
);
// => { title: "...", explanation: "...", suggestion: "..." }

console.log(ERROR_PATTERNS.length); // 46 built-in patterns
```

### Types & Enums

```ts
import type {
  ErrPulseEvent,
  ErrorGroup,
  StackFrame,
  LogEntry,
  EnvironmentInfo,
  RequestContext,
  WebSocketMessage,
  Project,
} from "@errpulse/core";

import {
  ErrorSource, // Backend | Frontend
  ErrorType, // UncaughtException, HttpError, ConsoleError, etc.
  ErrorStatus, // Unresolved, Acknowledged, Resolved, Ignored
  Severity, // Fatal, Error, Warning, Info
  LogLevel, // Log, Info, Warn, Debug
} from "@errpulse/core";
```

### PII Sanitization

```ts
import { sanitizeHeaders, sanitizeObject } from "@errpulse/core";

const safe = sanitizeHeaders({ Authorization: "Bearer xxx", "Content-Type": "application/json" });
// => { Authorization: "[REDACTED]", "Content-Type": "application/json" }

const safeBody = sanitizeObject({ username: "john", password: "secret123" });
// => { username: "john", password: "[REDACTED]" }
```

### UUID Generation

```ts
import { generateEventId, generateCorrelationId } from "@errpulse/core";

const eventId = generateEventId(); // Unique event identifier
const corrId = generateCorrelationId(); // For request tracing across frontend/backend
```

### Message Normalization

```ts
import { normalizeMessage, normalizeStackFrames, getInAppFrames } from "@errpulse/core";

const normalized = normalizeMessage("Error at 0x1a2b3c in /Users/john/app.ts:42:5");
// Strips memory addresses, absolute paths, line numbers for stable fingerprinting

const appFrames = getInAppFrames(stackFrames);
// Filters out node_modules frames
```

### Constants

```ts
import {
  BATCH_SIZE, // 10 events per batch
  BATCH_INTERVAL_MS, // 100ms flush interval
  LOG_BATCH_SIZE, // 20 logs per batch
  LOG_BATCH_INTERVAL_MS, // 500ms flush interval for logs
  EVENTS_ENDPOINT, // /api/events
  LOGS_ENDPOINT, // /api/logs
  CORRELATION_HEADER, // x-errpulse-correlation-id
  MAX_MESSAGE_LENGTH, // 2048 characters
  SENSITIVE_HEADERS, // ['authorization', 'cookie', ...]
  SENSITIVE_FIELDS, // ['password', 'token', 'apiKey', ...]
} from "@errpulse/core";
```

## Key Features

- **Error Fingerprinting** — SHA-256 based deduplication using error type, normalized message, and top 3 in-app stack frames
- **46 Built-in Error Patterns** — Plain-English explanations for common errors (ECONNREFUSED, CORS, React hooks, module not found, etc.)
- **PII Sanitization** — Strips Authorization, Cookie, password, token, apiKey, creditCard, SSN, and 15+ other sensitive fields
- **Shared Types** — TypeScript types and enums used across all ErrPulse packages, including `LogLevel` and `LogEntry` for console log capture
- **UUID Generation** — Event IDs and correlation IDs for request tracing across frontend and backend
- **Message Normalization** — Strips noise (memory addresses, UUIDs, line numbers, absolute paths) for stable fingerprinting

## Documentation

- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)
- [Full Documentation](https://meghshyams.github.io/ErrPulse/)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
