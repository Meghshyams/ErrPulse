# API Reference

The ErrPulse server exposes a REST API for event ingestion, error management, and data querying. All endpoints are served at `http://localhost:3800` by default.

All endpoints that return lists support project filtering via the `?projectId=<name>` query parameter.

## Event Ingestion

### `POST /api/events`

Ingest a single error event.

**Request body:** `ErrPulseEvent`

```json
{
  "eventId": "a1b2c3d4e5f6...",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "type": "uncaught_exception",
  "message": "Cannot read properties of undefined (reading 'name')",
  "stack": "TypeError: Cannot read properties of undefined...",
  "source": "backend",
  "severity": "error",
  "projectId": "api-service"
}
```

**Response:**

```json
{
  "id": "a1b2c3d4e5f6...",
  "fingerprint": "sha256hash...",
  "isNew": true
}
```

### `POST /api/events/batch`

Ingest multiple events in a single request.

**Request body:** `ErrPulseEvent[]`

```json
[
  { "eventId": "...", "type": "uncaught_exception", "message": "...", ... },
  { "eventId": "...", "type": "console_error", "message": "...", ... }
]
```

**Response:** `IngestResponse[]`

```json
[
  { "id": "...", "fingerprint": "...", "isNew": true },
  { "id": "...", "fingerprint": "...", "isNew": false }
]
```

### `POST /api/events/request`

Log an HTTP request.

**Request body:**

```json
{
  "method": "POST",
  "url": "/api/checkout",
  "statusCode": 500,
  "duration": 234,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "correlationId": "a1b2c3d4",
  "errorEventId": "evt123",
  "headers": { "content-type": "application/json", "user-agent": "..." },
  "responseHeaders": { "content-type": "application/json", "x-request-id": "..." },
  "requestBody": "{\"items\":[{\"id\":1}]}",
  "responseBody": "{\"error\":\"Internal Server Error\"}",
  "source": "backend",
  "projectId": "api-service"
}
```

**Response:**

```json
{
  "id": "req_abc123"
}
```

## Error Management

### `GET /api/errors`

List error groups with optional filters.

**Query parameters:**

| Parameter   | Type     | Default | Description                                                           |
| ----------- | -------- | ------- | --------------------------------------------------------------------- |
| `status`    | `string` | —       | Filter by status: `unresolved`, `acknowledged`, `resolved`, `ignored` |
| `source`    | `string` | —       | Filter by source: `backend`, `frontend`                               |
| `severity`  | `string` | —       | Filter by severity: `fatal`, `error`, `warning`, `info`               |
| `type`      | `string` | —       | Filter by error type                                                  |
| `search`    | `string` | —       | Search in error messages                                              |
| `page`      | `number` | `1`     | Page number                                                           |
| `pageSize`  | `number` | `50`    | Results per page                                                      |
| `projectId` | `string` | —       | Filter by project                                                     |

**Response:**

```json
{
  "errors": [
    {
      "id": "err_abc123",
      "fingerprint": "sha256hash...",
      "type": "uncaught_exception",
      "message": "Cannot read properties of undefined (reading 'name')",
      "source": "backend",
      "severity": "error",
      "status": "unresolved",
      "explanation": "You tried to access a property on a value that is undefined or null...",
      "firstSeen": "2025-01-15T10:30:00.000Z",
      "lastSeen": "2025-01-15T11:45:00.000Z",
      "count": 42,
      "projectId": "api-service"
    }
  ],
  "total": 156,
  "page": 1,
  "pageSize": 50
}
```

### `GET /api/errors/:id`

Get a single error group with all its events.

**Response:**

```json
{
  "error": {
    "id": "err_abc123",
    "fingerprint": "sha256hash...",
    "type": "uncaught_exception",
    "message": "Cannot read properties of undefined (reading 'name')",
    "source": "backend",
    "severity": "error",
    "status": "unresolved",
    "firstSeen": "2025-01-15T10:30:00.000Z",
    "lastSeen": "2025-01-15T11:45:00.000Z",
    "count": 42
  },
  "events": [
    {
      "eventId": "evt_123",
      "timestamp": "2025-01-15T11:45:00.000Z",
      "type": "uncaught_exception",
      "message": "Cannot read properties of undefined (reading 'name')",
      "stack": "TypeError: Cannot read properties of undefined...",
      "stackFrames": [
        {
          "filename": "/app/src/handlers/user.ts",
          "function": "getUser",
          "lineno": 42,
          "colno": 15,
          "inApp": true
        }
      ],
      "source": "backend",
      "severity": "error",
      "request": {
        "method": "GET",
        "url": "/api/users/123",
        "statusCode": 500,
        "duration": 12
      },
      "environment": {
        "runtime": "node",
        "nodeVersion": "20.10.0",
        "os": "linux",
        "arch": "x64"
      }
    }
  ]
}
```

### `PATCH /api/errors/:id`

Update an error group's status.

**Request body:**

```json
{
  "status": "resolved"
}
```

Valid statuses: `unresolved`, `acknowledged`, `resolved`, `ignored`

**Response:**

```json
{
  "success": true
}
```

## Requests

### `GET /api/requests`

List tracked HTTP requests.

**Query parameters:**

| Parameter   | Type     | Default | Description       |
| ----------- | -------- | ------- | ----------------- |
| `page`      | `number` | `1`     | Page number       |
| `pageSize`  | `number` | `50`    | Results per page  |
| `projectId` | `string` | —       | Filter by project |

**Response:**

```json
{
  "requests": [
    {
      "id": "req_abc123",
      "method": "POST",
      "url": "/api/checkout",
      "statusCode": 500,
      "duration": 234,
      "timestamp": "2025-01-15T10:30:00.000Z",
      "correlationId": "a1b2c3d4",
      "errorEventId": "evt_123"
    }
  ],
  "total": 1024,
  "page": 1,
  "pageSize": 50
}
```

### `GET /api/requests/:id`

Get full details for a single request, including headers and body.

**Response:**

```json
{
  "id": "req_abc123",
  "method": "POST",
  "url": "/api/checkout",
  "statusCode": 500,
  "duration": 234,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "correlationId": "a1b2c3d4",
  "errorEventId": "evt_123",
  "headers": {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0...",
    "authorization": "[Redacted]"
  },
  "responseHeaders": {
    "content-type": "application/json",
    "x-request-id": "abc-123"
  },
  "requestBody": { "items": [{ "id": 1, "qty": 2 }] },
  "responseBody": { "error": "Internal Server Error" }
}
```

::: tip
Sensitive headers (authorization, cookie, etc.) are automatically redacted. Request and response bodies are capped at 16 KB to prevent performance issues.
:::

## Logs

### `POST /api/logs`

Ingest a single log entry.

**Request body:**

```json
{
  "level": "log",
  "message": "User clicked checkout button",
  "source": "frontend",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "projectId": "web-app",
  "environment": { "runtime": "browser", "browser": "Mozilla/5.0..." },
  "correlationId": "a1b2c3d4",
  "extra": { "component": "CheckoutPage" }
}
```

Required fields: `message`, `level`. Valid levels: `log`, `info`, `warn`, `debug`.

**Response:**

```json
{
  "id": "log_abc123"
}
```

### `POST /api/logs/batch`

Ingest multiple log entries in a single request.

**Request body:** Array of log entries (same format as above).

**Response:** Array of IDs.

### `GET /api/logs`

List log entries with optional filters.

**Query parameters:**

| Parameter   | Type     | Default | Description                                     |
| ----------- | -------- | ------- | ----------------------------------------------- |
| `level`     | `string` | —       | Filter by level: `log`, `info`, `warn`, `debug` |
| `source`    | `string` | —       | Filter by source: `backend`, `frontend`         |
| `search`    | `string` | —       | Search in log messages                          |
| `page`      | `number` | `1`     | Page number                                     |
| `pageSize`  | `number` | `100`   | Results per page                                |
| `projectId` | `string` | —       | Filter by project                               |

**Response:**

```json
{
  "logs": [
    {
      "id": "log_abc123",
      "level": "warn",
      "message": "Slow query detected: SELECT * FROM users took 2340ms",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "source": "backend",
      "environment": { "runtime": "node", "nodeVersion": "20.10.0" },
      "correlationId": "a1b2c3d4",
      "projectId": "api-service"
    }
  ],
  "total": 1024
}
```

### `POST /api/logs/clear`

Clear all log entries. Optionally pass `{ "projectId": "..." }` to clear only a specific project's logs.

**Response:**

```json
{
  "success": true
}
```

## Stats & Health

### `GET /api/stats`

Get dashboard overview statistics.

**Query parameters:**

| Parameter   | Type     | Description             |
| ----------- | -------- | ----------------------- |
| `projectId` | `string` | Filter stats by project |

**Response:**

```json
{
  "totalRequests": 15234,
  "errorRequests": 342,
  "healthScore": 97.8,
  "errorsLast24h": 42,
  "topErrors": [
    {
      "id": "err_abc123",
      "message": "Cannot read properties of undefined",
      "count": 15,
      "type": "uncaught_exception",
      "severity": "error"
    }
  ],
  "errorsByType": {
    "uncaught_exception": 20,
    "http_error": 15,
    "console_error": 7
  },
  "errorsBySource": {
    "backend": 30,
    "frontend": 12
  },
  "errorsOverTime": [
    { "timestamp": "2025-01-15T00:00:00.000Z", "count": 3 },
    { "timestamp": "2025-01-15T01:00:00.000Z", "count": 1 }
  ]
}
```

### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

## Projects

### `GET /api/projects`

List all registered projects.

**Response:**

```json
{
  "projects": [
    { "id": "abc123", "name": "api-service", "createdAt": "2025-01-15T10:30:00.000Z" },
    { "id": "def456", "name": "web-app", "createdAt": "2025-01-15T10:31:00.000Z" }
  ]
}
```

## Data Management

### `POST /api/clear`

Clear all stored data (errors, events, requests, logs). Optionally pass `{ "projectId": "..." }` to clear only a specific project's data.

**Response:**

```json
{
  "success": true
}
```

## WebSocket

### `WS /ws`

Connect to the WebSocket endpoint for real-time updates.

**Connection:**

```js
const ws = new WebSocket("ws://localhost:3800/ws");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message.type, message.payload);
};
```

**Message types:**

| Type            | Payload                                            | When                                            |
| --------------- | -------------------------------------------------- | ----------------------------------------------- |
| `new_error`     | `ErrorGroup`                                       | A new error group is created                    |
| `new_event`     | `{ errorGroup: ErrorGroup, event: ErrPulseEvent }` | A new event is added to an existing error group |
| `status_change` | `ErrorGroup`                                       | An error's status is updated                    |
| `new_request`   | `RequestLogEntry`                                  | An HTTP request is logged                       |
| `new_log`       | `LogEntry`                                         | A console log is captured                       |

**Example messages:**

```json
{
  "type": "new_error",
  "payload": {
    "id": "err_abc123",
    "fingerprint": "sha256hash...",
    "type": "uncaught_exception",
    "message": "Cannot read properties of undefined",
    "source": "backend",
    "severity": "error",
    "status": "unresolved",
    "count": 1,
    "firstSeen": "2025-01-15T10:30:00.000Z",
    "lastSeen": "2025-01-15T10:30:00.000Z"
  }
}
```

```json
{
  "type": "new_request",
  "payload": {
    "id": "req_abc123",
    "method": "GET",
    "url": "/api/users",
    "statusCode": 200,
    "duration": 45,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```
