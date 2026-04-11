# Node.js SDK

`@errpulse/node` captures backend errors and HTTP requests from Node.js, Express, and Next.js applications.

## Installation

```bash
npm install @errpulse/node
```

## Basic Usage

Import the SDK to auto-capture errors with default settings:

```ts
import "@errpulse/node";
```

This single import installs handlers for:

- Uncaught exceptions (`process.on("uncaughtException")`)
- Unhandled promise rejections (`process.on("unhandledRejection")`)
- `console.error` calls
- Memory threshold warnings

With `captureConsoleLogs: true`, it also captures `console.log`, `console.warn`, `console.info`, and `console.debug` calls, which appear in the dedicated **Logs** section of the dashboard.

## Configuration

Use `init()` for custom configuration:

```ts
import { init } from "@errpulse/node";

init({
  serverUrl: "http://localhost:3800",
  projectId: "my-backend",
  enabled: true,
  sampleRate: 1.0,
  captureConsoleErrors: true,
  captureConsoleLogs: false,
  captureUncaughtExceptions: true,
  captureUnhandledRejections: true,
  monitorMemory: true,
  memoryThresholdMB: 512,
  memoryCheckIntervalMs: 30000,
  beforeSend: (event) => {
    // Return null to drop the event
    // Or modify and return it
    return event;
  },
});
```

### Config Reference

<!-- GENERATED:NODE_CONFIG -->

| Option                       | Type       | Default                   | Description                                      |
| ---------------------------- | ---------- | ------------------------- | ------------------------------------------------ |
| `serverUrl`                  | `string`   | `"http://localhost:3800"` | ErrPulse server URL                              |
| `projectId`                  | `string`   | `undefined`               | Project identifier for multi-project setups      |
| `enabled`                    | `boolean`  | `true`                    | Enable or disable the SDK                        |
| `sampleRate`                 | `number`   | `1`                       | Sample rate from 0.0 to 1.0 (1.0 = capture all)  |
| `captureConsoleErrors`       | `boolean`  | `true`                    | Capture `console.error` calls                    |
| `captureConsoleLogs`         | `boolean`  | `false`                   | Capture `console.log/warn/info/debug` to Logs    |
| `captureUncaughtExceptions`  | `boolean`  | `true`                    | Capture uncaught exceptions                      |
| `captureUnhandledRejections` | `boolean`  | `true`                    | Capture unhandled promise rejections             |
| `monitorMemory`              | `boolean`  | `true`                    | Monitor memory usage and emit warnings           |
| `memoryThresholdMB`          | `number`   | `512`                     | Memory threshold in MB before warning            |
| `memoryCheckIntervalMs`      | `number`   | `30000`                   | How often to check memory (ms)                   |
| `beforeSend`                 | `function` | `undefined`               | Callback to modify or drop events before sending |

<!-- /GENERATED:NODE_CONFIG -->

### `beforeSend`

The `beforeSend` callback lets you filter or modify events before they're sent to the server:

```ts
init({
  beforeSend: (event) => {
    // Drop events from a specific source
    if (event.message.includes("harmless warning")) {
      return null; // Drop this event
    }

    // Add custom metadata
    event.extra = { ...event.extra, environment: "staging" };
    return event;
  },
});
```

## Manual Capture

### `captureError(error, extra?)`

Manually capture an error:

```ts
import { captureError } from "@errpulse/node";

try {
  riskyOperation();
} catch (err) {
  captureError(err, { userId: "123", action: "checkout" });
}

// Also accepts a string
captureError("Something went wrong");
```

Returns the event ID (`string`).

### `captureMessage(message, severity?, extra?)`

Capture an informational message:

```ts
import { captureMessage } from "@errpulse/node";

captureMessage("User signed up", "info", { plan: "pro" });
captureMessage("Rate limit approaching", "warning");
captureMessage("Payment failed", "error", { orderId: "456" });
```

Returns the event ID (`string`).

## Express Integration

### `expressRequestHandler()`

Middleware that tracks all HTTP requests. Add it early in your middleware chain:

```ts
import express from "express";
import { expressRequestHandler, expressErrorHandler } from "@errpulse/node";

const app = express();

// Track all requests — add early
app.use(expressRequestHandler());

app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});

// Capture errors — must be last
app.use(expressErrorHandler());
```

The request handler tracks:

- HTTP method and URL
- Status code and response duration
- Correlation ID (from `X-ErrPulse-Correlation-ID` header, or auto-generated)
- **Request headers** (sanitized — sensitive headers like `authorization` and `cookie` are redacted)
- **Response headers** (captured via `res.getHeaders()`)
- **Request body** (from `req.body`, sanitized for sensitive fields like `password`, `token`, etc.)
- **Response body** (intercepted from `res.write()`/`res.end()`)

::: tip Performance
Request and response bodies are capped at **16 KB** each. Anything larger is truncated to prevent memory or network overhead. Header sanitization and body capture happen asynchronously after the response finishes, so they don't add latency to your request handling.
:::

### `expressErrorHandler()`

Error middleware that captures route errors. **Must be the last middleware** in the chain:

```ts
app.use(expressErrorHandler());
```

It captures:

- Error message and stack trace
- Request context (method, URL, headers, query, body)
- Correlation ID
- Status code (from `err.status`, `err.statusCode`, or 500)

## Next.js Integration

### `withErrPulse(handler)`

Wraps a Next.js App Router route handler to capture errors and log requests:

```ts
// app/api/users/route.ts
import { withErrPulse } from "@errpulse/node";

export const GET = withErrPulse(async (req) => {
  const users = await db.getUsers();
  return Response.json({ users });
});

export const POST = withErrPulse(async (req) => {
  const body = await req.json();
  const user = await db.createUser(body);
  return Response.json({ user }, { status: 201 });
});
```

The wrapper:

- Logs the request (method, URL, duration)
- Catches any error thrown by the handler
- Sends the error to ErrPulse with full request context
- Re-throws the error so Next.js handles the response

## Graceful Shutdown

Call `close()` to flush buffered events and remove all listeners:

```ts
import { close } from "@errpulse/node";

process.on("SIGTERM", () => {
  close();
  process.exit(0);
});
```

## Environment Variables

| Variable        | Description                      | Default   |
| --------------- | -------------------------------- | --------- |
| `ERRPULSE_PORT` | Override the default server port | `3800`    |
| `ERRPULSE_HOST` | Override the default server host | `0.0.0.0` |

These are read by the server, not the SDK. The SDK uses `serverUrl` in its config.

## Additional Exports

```ts
import { configure, getConfig } from "@errpulse/node";

// Update config at runtime
configure({ sampleRate: 0.5 });

// Read current config
const config = getConfig();
```
