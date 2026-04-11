# @errpulse/core

## 0.5.1

### Patch Changes

- cba6030: chore: publish updated READMEs and keywords to npm

## 0.5.0

### Minor Changes

- d9066d6: feat: add dedicated Logs section for console.log/warn/info/debug capture
  - New `logs` database table separate from the error pipeline for high-volume console output
  - New SDK interceptors capture `console.log`, `console.warn`, `console.info`, `console.debug` (opt-in via `captureConsoleLogs` config option, default: `false`)
  - Separate log buffer in both SDKs with larger batch size (20) and slower flush interval (500ms) to reduce network noise
  - New REST API endpoints: `POST /api/logs`, `POST /api/logs/batch`, `GET /api/logs`, `POST /api/logs/clear`
  - New WebSocket message type `new_log` for real-time streaming
  - New dashboard Logs page with level/source filtering, full-text search, expandable detail rows, and project-aware clear functionality
  - Added `LogLevel` enum and `LogEntry` type to `@errpulse/core`
  - Project-scoped clear for errors, requests, and logs

## 0.4.0

### Minor Changes

- aa3efb1: ### React SDK: Request Detail Capture
  - Fetch interceptor now captures request headers, response headers, request body, and response body alongside each tracked request
  - Bodies are capped at 16 KB with truncation; sensitive headers are sanitized
  - Response bodies are read via `response.clone()` to avoid consuming the original stream

  ### Dashboard: Inline API Response for HTTP Errors
  - Error detail page now shows the linked API response (response body, request body, headers) inline for `http_error` and `network_error` types
  - Linked via correlation ID — no need to navigate to the Requests page

  ### Dashboard: Toast & Favicon Notifications Fixed
  - Toast notifications and favicon badges now trigger for both new errors (`new_error`) and repeat occurrences (`new_event`)
  - Previously only first-time error groups triggered notifications

  ### Dashboard: Project Selection Persistence
  - Selected project is saved to localStorage and persists across page refreshes

  ### Server: Time-Windowed Health Score
  - Health score now respects the selected time range (1h, 6h, 24h, 7d) instead of counting all requests ever
  - Score naturally recovers as errors age out of the selected window

  ### Server: Regression Detection
  - Resolved errors are automatically reopened to "unresolved" when the same error recurs
  - Ignored and acknowledged errors remain in their current state on recurrence

## 0.3.0

### Minor Changes

- a99a2a5: ### Responsive Dashboard & Request Detail Panel

  **Dashboard**
  - Fully responsive layout with mobile bottom navigation bar, stacked grids, and iOS safe-area support
  - Click any request row to expand an inline detail panel with four tabs: Headers, Payload, Response, and General
  - Added cursor pointer (hand icon) on all clickable elements — time range filters, status buttons, filter chips
  - Fixed screen flicker when changing error status (resolve/acknowledge/ignore) by using optimistic updates

  **Express Middleware**
  - Now captures request headers, response headers, request body, and response body alongside each tracked request
  - Sensitive headers (authorization, cookie, etc.) are automatically redacted
  - Request and response bodies are capped at 16 KB to prevent performance overhead

  **Server**
  - New `GET /api/requests/:id` endpoint returns full request details including headers and body
  - Database schema extended with `response_headers`, `request_body`, and `response_body` columns (auto-migrated)

## 0.2.0

## 0.1.4

### Patch Changes

- c6f12da: Improve npm package discoverability by adding search keywords like debugging, devtools, console-log, error-handler, and localhost

## 0.1.3

## 0.1.2

### Patch Changes

- f87e47d: Add README.md to all packages so npm package pages show install instructions, usage examples, and links to full docs

## 0.1.1

### Patch Changes

- 671649f: Rebrand from ErrLens to ErrPulse, add automated release workflow with changesets, and add documentation site
