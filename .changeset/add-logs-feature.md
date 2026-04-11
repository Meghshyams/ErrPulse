---
"@errpulse/core": minor
"@errpulse/node": minor
"@errpulse/react": minor
"@errpulse/server": minor
"errpulse": minor
---

feat: add dedicated Logs section for console.log/warn/info/debug capture

- New `logs` database table separate from the error pipeline for high-volume console output
- New SDK interceptors capture `console.log`, `console.warn`, `console.info`, `console.debug` (opt-in via `captureConsoleLogs` config option, default: `false`)
- Separate log buffer in both SDKs with larger batch size (20) and slower flush interval (500ms) to reduce network noise
- New REST API endpoints: `POST /api/logs`, `POST /api/logs/batch`, `GET /api/logs`, `POST /api/logs/clear`
- New WebSocket message type `new_log` for real-time streaming
- New dashboard Logs page with level/source filtering, full-text search, expandable detail rows, and project-aware clear functionality
- Added `LogLevel` enum and `LogEntry` type to `@errpulse/core`
- Project-scoped clear for errors, requests, and logs
