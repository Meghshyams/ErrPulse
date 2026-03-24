# How It Works

This page explains ErrPulse's architecture, error fingerprinting, event batching, and data handling.

## Architecture

```mermaid
flowchart TB
    subgraph apps ["Your Applications"]
        direction LR
        BE["Backend<br/><small>Express / Next.js</small>"]
        FE["Frontend<br/><small>React</small>"]
    end

    subgraph sdks ["SDKs <small>(auto-capture + batching)</small>"]
        direction LR
        NS["@errpulse/node<br/><small>exceptions · rejections<br/>console.error · memory</small>"]
        RS["@errpulse/react<br/><small>runtime errors · fetch<br/>React crashes · XHR</small>"]
    end

    subgraph server ["ErrPulse Server <small>(localhost:3800)</small>"]
        API["REST API<br/><small>/api/events · /api/errors<br/>/api/stats · /api/requests</small>"]
        ENG["Ingest Engine<br/><small>fingerprinting · grouping<br/>explanation matching</small>"]
        DB[("SQLite + WAL<br/><small>~/.errpulse/errpulse.db</small>")]
        WS["WebSocket<br/><small>real-time broadcast</small>"]
    end

    subgraph dash ["Dashboard"]
        UI["React SPA<br/><small>Overview · Errors · Requests<br/>Light/Dark · Keyboard shortcuts</small>"]
    end

    BE --> NS
    FE --> RS
    NS -- "POST /api/events<br/><small>batched, 100ms window</small>" --> API
    RS -- "POST /api/events<br/><small>batched, sendBeacon on unload</small>" --> API
    RS -. "X-ErrPulse-Correlation-ID<br/><small>in every fetch/XHR</small>" .-> NS
    API --> ENG
    ENG --> DB
    ENG --> WS
    WS -- "live updates" --> UI
    UI -- "REST queries" --> API
```

## Monorepo Structure

ErrPulse is organized as a pnpm monorepo with 5 packages:

| Package           | npm Name           | Purpose                                             |
| ----------------- | ------------------ | --------------------------------------------------- |
| `packages/core`   | `@errpulse/core`   | Shared types, fingerprinting, error explanations    |
| `packages/node`   | `@errpulse/node`   | Backend SDK for Node.js/Express/Next.js             |
| `packages/react`  | `@errpulse/react`  | Frontend SDK for React applications                 |
| `packages/server` | `@errpulse/server` | Express API server + SQLite + WebSocket + Dashboard |
| `packages/cli`    | `errpulse`         | CLI entry point (`npx errpulse`)                    |

## Error Fingerprinting

When an error event arrives, ErrPulse computes a **fingerprint** to group identical errors together. The fingerprint is a SHA-256 hash of:

1. **Error type** — e.g., `uncaught_exception`, `http_error`
2. **Normalized message** — the error message with noise removed:
   - Memory addresses (`0x1a2b3c`) stripped
   - Line:column numbers stripped
   - UUIDs replaced
   - Port numbers normalized
   - Absolute file paths simplified
3. **Top 3 in-app stack frames** — filename, function name, and line number of the first 3 frames from your code (ignoring `node_modules`)

This means the same error thrown from the same location will always be grouped together, even if the specific memory address or UUID in the message changes.

## Event Batching

Both the Node.js and React SDKs batch events before sending them to the server:

- **Buffer size**: 10 events
- **Batch interval**: 100ms
- **Flush trigger**: whichever threshold is reached first

This minimizes network overhead while keeping latency low. When 10 events accumulate or 100ms passes since the first buffered event, the SDK sends all buffered events in a single `POST /api/events/batch` request.

The React SDK also uses `navigator.sendBeacon()` on page unload to ensure final events are delivered even when the user navigates away.

## Ingest Pipeline

When the server receives an event:

1. **Project registration** — if the event has a `projectId`, auto-register the project if it doesn't exist
2. **Fingerprint computation** — SHA-256 of type + normalized message + top 3 frames
3. **Explanation matching** — match the error message against 46 built-in patterns to generate a plain-English explanation
4. **Error group upsert** — create a new error group or increment the count of an existing one
5. **Event storage** — store the full event with stack trace, request context, and environment info
6. **WebSocket broadcast** — notify all connected dashboard clients in real time

## PII Sanitization

Before storing events, ErrPulse sanitizes sensitive data:

**Headers redacted:**

- `authorization`, `cookie`, `set-cookie`, `x-api-key`, `x-auth-token`

**Object fields redacted:**

- `password`, `passwd`, `secret`, `token`, `apiKey`, `api_key`
- `accessToken`, `access_token`, `refreshToken`, `refresh_token`
- `creditCard`, `credit_card`, `ssn`, `cardNumber`, `card_number`, `cvv`, `cvc`

Redacted values are replaced with `[Redacted]`.

## Database

ErrPulse uses **SQLite** with **WAL (Write-Ahead Logging)** mode for the database:

- **Location**: `~/.errpulse/errpulse.db`
- **WAL mode**: allows concurrent reads during writes
- **Foreign keys**: enabled
- **Busy timeout**: 5000ms

### Tables

| Table          | Purpose                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| `projects`     | Registered projects with id, name, created_at                            |
| `errors`       | Error groups with fingerprint, type, message, status, count, explanation |
| `error_events` | Individual error events with full stack trace and context                |
| `requests`     | HTTP request log with method, URL, status, duration, correlation ID      |

## WebSocket Real-Time Feed

The dashboard connects to `ws://localhost:3800/ws` for live updates. The server broadcasts messages when:

| Event                        | Message Type    |
| ---------------------------- | --------------- |
| New error group created      | `new_error`     |
| New event for existing error | `new_event`     |
| Error status updated         | `status_change` |
| HTTP request logged          | `new_request`   |
