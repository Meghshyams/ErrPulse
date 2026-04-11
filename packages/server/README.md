<p align="center">
  <img src="https://img.shields.io/badge/ErrPulse-Server-f43f5e?style=for-the-badge&labelColor=09090b" alt="@errpulse/server" />
</p>

# @errpulse/server

Express API server with SQLite storage, WebSocket broadcasting, and a built-in React dashboard. Part of [ErrPulse](https://github.com/Meghshyams/ErrPulse) — the error monitoring tool that runs with one command.

> **Tip:** Most users should use the [`errpulse` CLI](https://www.npmjs.com/package/errpulse) which wraps this package. Use `@errpulse/server` directly for programmatic control.

## Installation

```bash
npm install @errpulse/server
```

## Programmatic Usage

```ts
import { startServer } from "@errpulse/server";

const { server, config } = await startServer({
  port: 3800,
  host: "0.0.0.0",
  dbPath: "./errpulse.db",
  dashboardEnabled: true,
  corsOrigin: "*",
});

console.log(`ErrPulse running at http://${config.host}:${config.port}`);
```

## Dashboard

The built-in dashboard at the root URL provides:

- **Overview** — Health score, error count, request count, error rate, needs attention section, real-time feed, errors-over-time chart
- **Errors** — Filterable list with severity/source/status/search, sparkline trends, keyboard shortcuts, inline quick actions
- **Requests** — HTTP request log with expandable detail panels (headers, body, response)
- **Logs** — Console output viewer (`console.log/warn/info/debug`) with level/source filtering, search, and real-time streaming
- **Project Selector** — Filter all views by project
- **Light/Dark Mode** — Persisted theme toggle
- **Clear All** — Project-scoped data clearing with confirmation

## API Endpoints

| Method  | Endpoint              | Description                     |
| ------- | --------------------- | ------------------------------- |
| `POST`  | `/api/events`         | Ingest a single error event     |
| `POST`  | `/api/events/batch`   | Ingest multiple events          |
| `POST`  | `/api/events/request` | Log an HTTP request             |
| `GET`   | `/api/errors`         | List error groups (filterable)  |
| `GET`   | `/api/errors/trends`  | Sparkline trend data for errors |
| `GET`   | `/api/errors/:id`     | Error detail with event history |
| `PATCH` | `/api/errors/:id`     | Update error status             |
| `GET`   | `/api/requests`       | List HTTP requests              |
| `GET`   | `/api/requests/:id`   | Request detail (headers, body)  |
| `POST`  | `/api/logs`           | Ingest a single log entry       |
| `POST`  | `/api/logs/batch`     | Ingest multiple log entries     |
| `GET`   | `/api/logs`           | List logs (filterable)          |
| `POST`  | `/api/logs/clear`     | Clear log entries               |
| `GET`   | `/api/stats`          | Dashboard overview stats        |
| `GET`   | `/api/projects`       | List registered projects        |
| `GET`   | `/api/health`         | Health check                    |
| `POST`  | `/api/clear`          | Clear all stored data           |
| `WS`    | `/ws`                 | Real-time WebSocket feed        |

All list endpoints support `?projectId=<name>` to filter by project.

## Key Features

- **SQLite + WAL** — Zero-setup database with Write-Ahead Logging for concurrent reads
- **WebSocket** — Real-time broadcasting of errors, requests, logs, and status changes
- **Built-in Dashboard** — React + Tailwind CSS dashboard with Errors, Requests, and Logs views
- **Error Fingerprinting** — SHA-256 deduplication via `@errpulse/core`
- **Plain-English Explanations** — 46 built-in error patterns with human-readable explanations and fix suggestions
- **PII Sanitization** — Sensitive fields (passwords, tokens, API keys) stripped before storage
- **Multi-project** — Filter all data by `projectId`, auto-registers projects on first event
- **Regression Detection** — Resolved errors are automatically reopened when they recur

## Database

SQLite database stored at `~/.errpulse/errpulse.db` with 5 tables:

| Table          | Purpose                                    |
| -------------- | ------------------------------------------ |
| `projects`     | Registered projects                        |
| `errors`       | Error groups (deduplicated by fingerprint) |
| `error_events` | Individual error occurrences               |
| `requests`     | HTTP request log with headers and bodies   |
| `logs`         | Console log entries (log/info/warn/debug)  |

## Exports

```ts
import { startServer, createServer, createApp, resolveConfig } from "@errpulse/server";
import type { ServerConfig, ServerContext, AppContext } from "@errpulse/server";
```

## Documentation

- [API Reference](https://meghshyams.github.io/ErrPulse/api/reference)
- [Dashboard Guide](https://meghshyams.github.io/ErrPulse/dashboard/overview)
- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
