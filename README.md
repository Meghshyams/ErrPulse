<p align="center">
  <img src="https://img.shields.io/badge/ErrPulse-Error%20Monitoring-f43f5e?style=for-the-badge&labelColor=09090b" alt="ErrPulse" />
</p>

<h1 align="center">ErrPulse</h1>

<p align="center">
  <strong>The error monitoring tool that runs with one command.</strong><br/>
  Catch every error — frontend and backend — in a real-time dashboard.<br/>
  Zero config. Zero cost. One <code>npx</code> command.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#what-gets-caught">What Gets Caught</a> &bull;
  <a href="#sdks">SDKs</a> &bull;
  <a href="#dashboard">Dashboard</a> &bull;
  <a href="#multi-project">Multi-Project</a> &bull;
  <a href="#api">API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node >= 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-zero--setup-orange.svg" alt="SQLite" />
</p>

---

## Why ErrPulse?

Sentry requires 20+ containers, 16GB RAM, and costs $26+/month. Nothing works during local development. You're stuck with `console.log`.

ErrPulse is different:

- **One command**: `npx errpulse` — server + dashboard at `localhost:3800`
- **Catches everything**: Uncaught exceptions, unhandled rejections, failed fetches, React crashes, console.error, resource failures, memory warnings — all of it
- **Real-time dashboard**: Errors appear instantly via WebSocket
- **Plain-English explanations**: Every error gets a human-readable explanation with fix suggestions
- **Frontend + Backend**: Correlate a user's click to the server error it caused
- **Multi-project**: Monitor multiple apps from one dashboard
- **Zero dependencies on external services**: SQLite database, runs entirely local

## Quick Start

### 1. Start ErrPulse

```bash
npx errpulse
# => ErrPulse running at http://localhost:3800
```

### 2. Add to your backend (Node.js / Express)

```bash
npm install @errpulse/node
```

```typescript
// Minimal — auto-captures uncaught exceptions, rejections, console.error
import "@errpulse/node";

// With Express — also tracks HTTP requests and route errors
import { expressRequestHandler, expressErrorHandler } from "@errpulse/node";
import { init } from "@errpulse/node";

init({ serverUrl: "http://localhost:3800", projectId: "my-api" });

const app = express();
app.use(expressRequestHandler()); // Track all requests
// ... your routes ...
app.use(expressErrorHandler()); // Catch route errors
```

### 3. Add to your frontend (React)

```bash
npm install @errpulse/react
```

```tsx
import { ErrPulseProvider } from "@errpulse/react";

function App() {
  return (
    <ErrPulseProvider endpoint="http://localhost:3800" projectId="my-web-app">
      <YourApp />
    </ErrPulseProvider>
  );
}
```

### 4. Open the dashboard

Navigate to [http://localhost:3800](http://localhost:3800) — see all errors in real-time.

---

## What Gets Caught

### Backend (`@errpulse/node`)

| Error Type                     | How                                    |
| ------------------------------ | -------------------------------------- |
| Uncaught exceptions            | `process.on('uncaughtException')`      |
| Unhandled promise rejections   | `process.on('unhandledRejection')`     |
| Express route errors (4xx/5xx) | Error handler middleware               |
| Next.js API route errors       | `withErrPulse()` wrapper               |
| `console.error` calls          | Monkey-patch                           |
| Memory warnings                | Periodic `process.memoryUsage()` check |
| All HTTP requests              | Request handler middleware             |

### Frontend (`@errpulse/react`)

| Error Type                                | How                                       |
| ----------------------------------------- | ----------------------------------------- |
| JavaScript runtime errors                 | `window.onerror`                          |
| Unhandled promise rejections              | `window.onunhandledrejection`             |
| React component crashes                   | Error Boundary                            |
| Failed fetch/XHR requests                 | `fetch()` + `XMLHttpRequest` interceptors |
| `console.error` calls                     | Monkey-patch                              |
| Resource load failures (img, script, css) | Capture-phase error listener              |
| All HTTP requests                         | Fetch interceptor                         |

### Error Correlation

Frontend injects an `X-ErrPulse-Correlation-ID` header into every fetch request. Backend reads the same ID. The dashboard shows the full chain: **user action → frontend request → backend error**.

---

## SDKs

### `@errpulse/node` — Backend SDK

```typescript
import { init, captureError, captureMessage, close } from "@errpulse/node";

// Configure
init({
  serverUrl: "http://localhost:3800",
  projectId: "my-api", // Multi-project support
  enabled: true, // Kill switch
  sampleRate: 1.0, // 0.0 - 1.0
  captureConsoleErrors: true,
  captureUncaughtExceptions: true,
  captureUnhandledRejections: true,
  monitorMemory: true,
  memoryThresholdMB: 512,
  beforeSend: (event) => event, // Modify/filter events
});

// Manual capture
captureError(new Error("Something went wrong"), { userId: "123" });
captureMessage("Deployment started", "info", { version: "2.0" });

// Graceful shutdown
close();
```

#### Express Integration

```typescript
import { expressRequestHandler, expressErrorHandler } from "@errpulse/node";

app.use(expressRequestHandler()); // Must be first middleware
// ... routes ...
app.use(expressErrorHandler()); // Must be last middleware
```

#### Next.js Integration

```typescript
import { withErrPulse } from "@errpulse/node";

export const GET = withErrPulse(async (req) => {
  // Your handler — errors are auto-captured
  return Response.json({ data: "hello" });
});
```

### `@errpulse/react` — Frontend SDK

```tsx
import { ErrPulseProvider } from "@errpulse/react";

<ErrPulseProvider
  endpoint="http://localhost:3800"
  projectId="my-web-app"
  captureConsoleErrors={true}
  captureFetch={true}
  captureXHR={true}
  captureResourceErrors={true}
  errorBoundaryFallback={<div>Something went wrong</div>}
>
  <App />
</ErrPulseProvider>;
```

#### Manual Capture Hook

```tsx
import { useErrPulse } from "@errpulse/react";

function MyComponent() {
  const { captureError, captureMessage } = useErrPulse();

  const handleClick = () => {
    try {
      riskyOperation();
    } catch (err) {
      captureError(err, { component: "MyComponent" });
    }
  };
}
```

---

## Dashboard

The dashboard runs at `http://localhost:3800` and provides:

- **Overview**: Health score donut, error count, request count, error rate, "Needs Attention" section for unresolved errors, real-time error feed, errors-over-time chart
- **Errors**: Filterable list by severity, source, status, and time range (1h/6h/24h/7d). Inline sparkline trends per error. Search by message. Inline quick actions (resolve/acknowledge/ignore) on hover — no need to click into detail view
- **Error Detail**: Plain-English explanation, stack trace viewer with in-app frame highlighting, event timeline, status management
- **Requests**: HTTP request log with method, URL, status code, duration, timing. Error-linked requests are flagged with a visual indicator
- **Project Selector**: Filter all views by project when monitoring multiple apps
- **Light/Dark Mode**: Toggle between themes, persisted to localStorage
- **Keyboard Shortcuts**: `j`/`k` navigate errors, `r` resolve, `a` acknowledge, `i` ignore, `/` search
- **Favicon Badge**: Error count notification dot when the tab is not focused
- **Toast Notifications**: Real-time popups when new errors arrive

Built with React + Tailwind CSS + WebSocket for real-time updates.

---

## Multi-Project

Monitor multiple apps from a single ErrPulse instance. Each SDK sends a `projectId`, and the dashboard lets you filter by project.

```typescript
// Backend app 1
init({ serverUrl: 'http://localhost:3800', projectId: 'api-server' });

// Backend app 2
init({ serverUrl: 'http://localhost:3800', projectId: 'worker-service' });

// Frontend
<ErrPulseProvider endpoint="http://localhost:3800" projectId="web-app">
```

The dashboard sidebar shows a project dropdown. Select a project to scope all data (errors, requests, stats) to that project, or choose "All Projects" to see everything.

Projects are auto-registered on first event — no manual setup required.

---

## Architecture

```
┌─────────────────────┐       ┌─────────────────────┐
│   Your Backend       │       │   Your Frontend      │
│   (Express / Next)   │       │   (React)            │
│                      │       │                      │
│   @errpulse/node     │       │   @errpulse/react    │
│   ▸ exceptions       │       │   ▸ runtime errors   │
│   ▸ rejections       │  ◄──── ▸ correlation ID ────►│
│   ▸ console.error    │       │   ▸ fetch / XHR      │
│   ▸ memory warnings  │       │   ▸ React crashes    │
└──────────┬──────────┘       └──────────┬──────────┘
           │ POST /api/events             │
           │ (batched, 100ms)             │
           └──────────┬───────────────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │     ErrPulse Server       │
        │     localhost:3800        │
        │                          │
        │  ┌────────────────────┐  │
        │  │ REST API            │  │
        │  │ /events /errors     │  │
        │  │ /stats  /requests   │  │
        │  ├────────────────────┤  │
        │  │ Ingest Engine       │  │
        │  │ fingerprint → group │  │
        │  │ → explain → store   │  │
        │  ├────────────────────┤  │
        │  │ SQLite + WAL        │  │
        │  │ ~/.errpulse/        │  │
        │  ├────────────────────┤  │
        │  │ WebSocket           │◄─── real-time broadcast
        │  └────────────────────┘  │
        └─────────────┬────────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │     Dashboard (React)     │
        │                          │
        │  Overview · Errors        │
        │  Requests · Detail        │
        │  Light/Dark · Shortcuts   │
        │  Toasts · Favicon badge   │
        └──────────────────────────┘
```

### Monorepo Structure

```
errpulse/
├── packages/
│   ├── core/        # @errpulse/core — shared types, fingerprinting, 46 error explanations
│   ├── server/      # @errpulse/server — Express API + SQLite + WebSocket
│   │   └── dashboard/  # React dashboard (Vite + Tailwind CSS)
│   ├── node/        # @errpulse/node — Backend SDK
│   ├── react/       # @errpulse/react — Frontend SDK
│   └── cli/         # errpulse — CLI entry point
├── package.json
├── pnpm-workspace.yaml
└── vitest.workspace.ts
```

### Key Design Decisions

- **Error Fingerprinting**: SHA-256 hash of (error type + normalized message + top 3 in-app stack frames). Same error = one group with an occurrence count
- **PII Sanitization**: Strips Authorization, Cookie, password, token, apiKey, and other sensitive fields before storing
- **Batching**: SDKs buffer events for 100ms or 10 events (whichever first) to minimize network overhead
- **Resilience**: SDKs never crash the host app — all internal errors are swallowed with `console.warn`
- **SQLite + WAL**: Zero-setup database with Write-Ahead Logging for concurrent reads during writes
- **46 Error Patterns**: Built-in pattern matcher for common errors (ECONNREFUSED, TypeError, CORS, React hooks, etc.) with plain-English explanations and fix suggestions

---

## API

All endpoints are served from the ErrPulse server (default `http://localhost:3800`).

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
| `GET`   | `/api/stats`          | Dashboard overview stats        |
| `GET`   | `/api/projects`       | List registered projects        |
| `GET`   | `/api/health`         | Health check                    |
| `POST`  | `/api/clear`          | Clear all stored data           |
| `WS`    | `/ws`                 | Real-time WebSocket feed        |

All list endpoints support `?projectId=<name>` to filter by project.

---

## CLI

```bash
npx errpulse                    # Start server on port 3800
npx errpulse start --port 4000  # Custom port
npx errpulse status             # Check if running
npx errpulse clear              # Clear all data
npx errpulse help               # Show help
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build + watch the dashboard
pnpm dev:dashboard

# Run tests
pnpm test

# Type check
pnpm lint
```

## License

[MIT](LICENSE)
