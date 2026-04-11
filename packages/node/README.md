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

## Express Integration

```ts
import express from "express";
import { init, expressRequestHandler, expressErrorHandler } from "@errpulse/node";

init({ serverUrl: "http://localhost:3800", projectId: "my-api" });

const app = express();
app.use(expressRequestHandler()); // Track all requests — add first
// ... your routes ...
app.use(expressErrorHandler()); // Catch route errors — add last
```

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

## What Gets Caught

| Error Type                    | How                                    |
| ----------------------------- | -------------------------------------- |
| Uncaught exceptions           | `process.on('uncaughtException')`      |
| Unhandled promise rejections  | `process.on('unhandledRejection')`     |
| Express route errors          | Error handler middleware               |
| Next.js API route errors      | `withErrPulse()` wrapper               |
| `console.error` calls         | Monkey-patch                           |
| `console.log/warn/info/debug` | Monkey-patch (opt-in)                  |
| Memory warnings               | Periodic `process.memoryUsage()` check |
| All HTTP requests             | Request handler middleware             |

## Configuration

```ts
import { init } from "@errpulse/node";

init({
  serverUrl: "http://localhost:3800",
  projectId: "my-api",
  enabled: true,
  sampleRate: 1.0,
  captureConsoleErrors: true,
  captureConsoleLogs: false, // opt-in: capture console.log/warn/info/debug to Logs
  captureUncaughtExceptions: true,
  captureUnhandledRejections: true,
  monitorMemory: true,
  memoryThresholdMB: 512,
  beforeSend: (event) => event, // Modify or drop events
});
```

## Documentation

- [Full SDK Docs](https://github.com/Meghshyams/ErrPulse/blob/main/docs/sdks/node.md)
- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
