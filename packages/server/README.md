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
});

console.log(`ErrPulse running at http://${config.host}:${config.port}`);
```

## API Endpoints

| Method  | Endpoint              | Description                     |
| ------- | --------------------- | ------------------------------- |
| `POST`  | `/api/events`         | Ingest a single error event     |
| `POST`  | `/api/events/batch`   | Ingest multiple events          |
| `POST`  | `/api/events/request` | Log an HTTP request             |
| `GET`   | `/api/errors`         | List error groups (filterable)  |
| `GET`   | `/api/errors/:id`     | Error detail with event history |
| `PATCH` | `/api/errors/:id`     | Update error status             |
| `GET`   | `/api/requests`       | List HTTP requests              |
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
- **WebSocket** — Real-time error broadcasting to the dashboard
- **Built-in Dashboard** — React + Tailwind CSS dashboard with Errors, Requests, and Logs views
- **Error Fingerprinting** — SHA-256 deduplication via `@errpulse/core`
- **PII Sanitization** — Sensitive fields stripped before storage
- **Multi-project** — Filter all data by `projectId`

## Exports

```ts
import { startServer, createServer, createApp, resolveConfig } from "@errpulse/server";
import type { ServerConfig, ServerContext, AppContext } from "@errpulse/server";
```

## Documentation

- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)
- [Full Documentation](https://github.com/Meghshyams/ErrPulse#readme)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
