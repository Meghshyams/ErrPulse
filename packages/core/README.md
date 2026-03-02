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
// => { title: "...", description: "...", suggestion: "..." }

console.log(ERROR_PATTERNS.length); // 46 built-in patterns
```

### Types

```ts
import type { ErrPulseEvent, ErrorGroup, StackFrame, Severity } from "@errpulse/core";
import { ErrorSource, ErrorStatus, ErrorType } from "@errpulse/core";
```

### PII Sanitization

```ts
import { sanitizeHeaders, sanitizeObject } from "@errpulse/core";

const safe = sanitizeHeaders({ Authorization: "Bearer xxx", "Content-Type": "application/json" });
// => { Authorization: "[REDACTED]", "Content-Type": "application/json" }
```

## Key Features

- **Error Fingerprinting** — SHA-256 based deduplication using error type, message, and top stack frames
- **46 Built-in Error Patterns** — Plain-English explanations for common errors (ECONNREFUSED, CORS, React hooks, etc.)
- **PII Sanitization** — Strips Authorization, Cookie, password, token, apiKey, and other sensitive fields
- **Shared Types** — TypeScript types and enums used across all ErrPulse packages
- **UUID Generation** — Event IDs and correlation IDs for request tracing

## Documentation

- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)
- [Full Documentation](https://github.com/Meghshyams/ErrPulse#readme)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
