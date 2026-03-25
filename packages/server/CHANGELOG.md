# @errpulse/server

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
  - @errpulse/core@0.3.0

## 0.2.0

### Minor Changes

- 9bd2a11: Dashboard UX improvements: light/dark theme toggle, toast notifications, favicon error badge, improved empty states, inline quick actions on error rows, "Needs Attention" section, sparkline trend charts, time range selector (1h/6h/24h/7d), keyboard shortcuts (j/k/r/a/i), and request-error visual linking. Added /api/errors/trends endpoint and timeRange query param support.

### Patch Changes

- @errpulse/core@0.2.0

## 0.1.4

### Patch Changes

- c6f12da: Improve npm package discoverability by adding search keywords like debugging, devtools, console-log, error-handler, and localhost
- Updated dependencies [c6f12da]
  - @errpulse/core@0.1.4

## 0.1.3

### Patch Changes

- cbc091a: Fix dashboard not loading when installed from npm by including dashboard build in release workflow
  - @errpulse/core@0.1.3

## 0.1.2

### Patch Changes

- f87e47d: Add README.md to all packages so npm package pages show install instructions, usage examples, and links to full docs
- Updated dependencies [f87e47d]
  - @errpulse/core@0.1.2

## 0.1.1

### Patch Changes

- 671649f: Rebrand from ErrLens to ErrPulse, add automated release workflow with changesets, and add documentation site
- Updated dependencies [671649f]
  - @errpulse/core@0.1.1
