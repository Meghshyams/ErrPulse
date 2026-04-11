<p align="center">
  <img src="https://img.shields.io/badge/ErrPulse-Node.js%20SDK-f43f5e?style=for-the-badge&labelColor=09090b" alt="@errpulse/node" />
</p>

# @errpulse/node

Backend error monitoring SDK for Node.js, Express, and Next.js. Part of [ErrPulse](https://github.com/Meghshyams/ErrPulse) — the error monitoring tool that runs with one command.

## Installation

```bash
npm install @errpulse/node
```

## Quick Start

```ts
// Zero-config — auto-captures uncaught exceptions, rejections, console.error
import "@errpulse/node";
```

That's it. Errors are sent to `http://localhost:3800` by default.

## What Gets Caught

| Error Type                     | How                                    |
| ------------------------------ | -------------------------------------- |
| Uncaught exceptions            | `process.on('uncaughtException')`      |
| Unhandled promise rejections   | `process.on('unhandledRejection')`     |
| Express route errors (4xx/5xx) | Error handler middleware               |
| Next.js API route errors       | `withErrPulse()` wrapper               |
| `console.error` calls          | Monkey-patch                           |
| `console.log/warn/info/debug`  | Monkey-patch (opt-in)                  |
| Memory warnings                | Periodic `process.memoryUsage()` check |
| All HTTP requests              | Request handler middleware             |

## Configuration

```ts
import { init } from "@errpulse/node";

init({
  serverUrl: "http://localhost:3800",
  projectId: "my-api",
  enabled: true,
  sampleRate: 1.0,
  captureConsoleErrors: true,
  captureConsoleLogs: false, // opt-in: capture console.log/warn/info/debug to Logs dashboard
  captureUncaughtExceptions: true,
  captureUnhandledRejections: true,
  monitorMemory: true,
  memoryThresholdMB: 512,
  memoryCheckIntervalMs: 30000,
  beforeSend: (event) => event, // Modify or drop events before sending
});
```

### Config Reference

| Option                       | Type       | Default                   | Description                                        |
| ---------------------------- | ---------- | ------------------------- | -------------------------------------------------- |
| `serverUrl`                  | `string`   | `"http://localhost:3800"` | ErrPulse server URL                                |
| `projectId`                  | `string`   | `undefined`               | Project identifier for multi-project setups        |
| `enabled`                    | `boolean`  | `true`                    | Enable or disable the SDK                          |
| `sampleRate`                 | `number`   | `1.0`                     | Sample rate from 0.0 to 1.0 (1.0 = capture all)    |
| `captureConsoleErrors`       | `boolean`  | `true`                    | Capture `console.error` calls                      |
| `captureConsoleLogs`         | `boolean`  | `false`                   | Capture `console.log/warn/info/debug` to Logs view |
| `captureUncaughtExceptions`  | `boolean`  | `true`                    | Capture uncaught exceptions                        |
| `captureUnhandledRejections` | `boolean`  | `true`                    | Capture unhandled promise rejections               |
| `monitorMemory`              | `boolean`  | `true`                    | Monitor memory usage and emit warnings             |
| `memoryThresholdMB`          | `number`   | `512`                     | Memory threshold in MB before warning              |
| `memoryCheckIntervalMs`      | `number`   | `30000`                   | How often to check memory (ms)                     |
| `beforeSend`                 | `function` | `undefined`               | Callback to modify or drop events before sending   |

## Express Integration

```ts
import express from "express";
import { init, expressRequestHandler, expressErrorHandler } from "@errpulse/node";

init({ serverUrl: "http://localhost:3800", projectId: "my-api" });

const app = express();
app.use(expressRequestHandler()); // Track all requests — must be first
// ... your routes ...
app.use(expressErrorHandler()); // Catch route errors — must be last
```

The request handler captures:

- HTTP method, URL, status code, and response duration
- Correlation ID (from `X-ErrPulse-Correlation-ID` header, or auto-generated)
- Request and response headers (sensitive headers redacted)
- Request and response bodies (capped at 16 KB)

## Next.js Integration

```ts
import { withErrPulse } from "@errpulse/node";

export const GET = withErrPulse(async (req) => {
  const data = await db.query();
  return Response.json({ data });
});
```

## Manual Capture

```ts
import { captureError, captureMessage } from "@errpulse/node";

captureError(new Error("Payment failed"), { userId: "123" });
captureMessage("Deployment started", "info", { version: "2.0" });
```

## Graceful Shutdown

```ts
import { close } from "@errpulse/node";

process.on("SIGTERM", () => {
  close(); // Flushes buffered events and removes all listeners
  process.exit(0);
});
```

## Error Correlation

When paired with `@errpulse/react`, the backend SDK reads the `X-ErrPulse-Correlation-ID` header injected by the frontend. The dashboard shows the full chain: **user action -> frontend request -> backend error**.

## Documentation

- [Full SDK Docs](https://meghshyams.github.io/ErrPulse/sdks/node)
- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
