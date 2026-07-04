# errpulse

## 0.7.0

### Minor Changes

- f37c9b0: feat: MCP server — give AI coding agents eyes on your runtime errors

  New `npx errpulse mcp` command starts an MCP (Model Context Protocol) server over stdio, letting Claude Code, Cursor, and other MCP-capable agents query ErrPulse directly:
  - `get_recent_errors` — grouped errors with counts and plain-English explanations, filterable by project/severity/source/status/time/search
  - `get_error_details` — stack traces, occurrences, and the linked HTTP request (with response body) for one error
  - `get_failed_requests` — 4xx/5xx/network failures with truncated response bodies
  - `get_console_logs` — captured console output from browser and Node
  - `get_stats` — error rate and health overview
  - `update_error_status` — mark errors resolved after fixing
  - `clear_all_data` — wipe data before a reproduction run (flagged destructive)

  Responses are context-window-friendly (capped stacks/bodies), and every tool returns an actionable hint when the ErrPulse server isn't running. Register with `claude mcp add errpulse -- npx errpulse mcp`.

- f37c9b0: feat: stream errors to the terminal — `errpulse tail` + live streaming in `start`

  Errors no longer sit silently in the dashboard waiting to be noticed:
  - `npx errpulse` (the `start` command) now streams every new error to the terminal it runs in, with severity coloring, the plain-English explanation, and fix suggestion. Recurrences are throttled to one line per error group per 2s window, showing the cumulative ×count. Disable with `--quiet`.
  - New `npx errpulse tail` command attaches to an already-running ErrPulse server from any terminal. It waits for the server if it isn't up yet and reconnects automatically if the server restarts.
  - `--requests` flag (on both commands) additionally prints failed HTTP requests (4xx/5xx/network failures).

### Patch Changes

- @errpulse/core@0.7.0
- @errpulse/server@0.7.0

## 0.6.0

### Patch Changes

- @errpulse/server@0.6.0

## 0.5.1

### Patch Changes

- cba6030: chore: publish updated READMEs and keywords to npm
- Updated dependencies [cba6030]
  - @errpulse/server@0.5.1

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

### Patch Changes

- Updated dependencies [d9066d6]
  - @errpulse/server@0.5.0

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

### Patch Changes

- Updated dependencies [aa3efb1]
  - @errpulse/server@0.4.0

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

### Patch Changes

- Updated dependencies [a99a2a5]
  - @errpulse/server@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [9bd2a11]
  - @errpulse/server@0.2.0

## 0.1.4

### Patch Changes

- c6f12da: Improve npm package discoverability by adding search keywords like debugging, devtools, console-log, error-handler, and localhost
- Updated dependencies [c6f12da]
  - @errpulse/server@0.1.4

## 0.1.3

### Patch Changes

- cbc091a: Fix dashboard not loading when installed from npm by including dashboard build in release workflow
- Updated dependencies [cbc091a]
  - @errpulse/server@0.1.3

## 0.1.2

### Patch Changes

- f87e47d: Add README.md to all packages so npm package pages show install instructions, usage examples, and links to full docs
- Updated dependencies [f87e47d]
  - @errpulse/server@0.1.2

## 0.1.1

### Patch Changes

- 671649f: Rebrand from ErrLens to ErrPulse, add automated release workflow with changesets, and add documentation site
- Updated dependencies [671649f]
  - @errpulse/server@0.1.1
