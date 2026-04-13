# Getting Started

Get ErrPulse running in under 5 minutes. You'll have a full error monitoring server with a real-time dashboard — no accounts, no config files.

## Prerequisites

- **Node.js** >= 18
- **npm**, **pnpm**, or **yarn**

## Step 1: Start the Server

```bash
npx errpulse
```

This starts the ErrPulse server and dashboard at [http://localhost:3800](http://localhost:3800). That's it — the server is running.

You can also specify a custom port:

```bash
npx errpulse start --port 4000
```

## Step 2: Add the Node.js SDK

Install the backend SDK in your Express or Next.js project:

```bash
npm install @errpulse/node
```

### Express

```ts
import express from "express";
import "@errpulse/node"; // Auto-captures uncaught exceptions, rejections, console.error
import { expressRequestHandler, expressErrorHandler } from "@errpulse/node";

const app = express();

// Track all HTTP requests
app.use(expressRequestHandler());

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

// Capture route errors — must be the last middleware
app.use(expressErrorHandler());

app.listen(3000);
```

### Next.js

```ts
// app/api/example/route.ts
import { withErrPulse } from "@errpulse/node";

export const GET = withErrPulse(async (req) => {
  return Response.json({ message: "Hello" });
});
```

## Step 3: Add the React SDK

Install the frontend SDK in your React app:

```bash
npm install @errpulse/react
```

Wrap your app with the `ErrPulseProvider`:

```tsx
import { ErrPulseProvider, ErrPulseDevTools } from "@errpulse/react";

function App() {
  return (
    <ErrPulseProvider endpoint="http://localhost:3800">
      <YourApp />
      <ErrPulseDevTools /> {/* Optional: floating in-app debug panel */}
    </ErrPulseProvider>
  );
}
```

This automatically captures:

- JavaScript runtime errors
- Unhandled promise rejections
- React component crashes
- Failed fetch/XHR requests
- `console.error` calls
- Resource load failures (images, scripts, CSS)

## Step 4: Open the Dashboard

Open [http://localhost:3800](http://localhost:3800) in your browser. You'll see:

- **Health score** — a 0–100 score based on your error rate
- **Real-time error feed** — errors appear instantly via WebSocket
- **Error timeline** — hourly breakdown of errors over the last 24 hours
- **Error details** — plain-English explanations, stack traces, and event history
- **HTTP request log** — every tracked request with method, URL, status, and duration

## Next Steps

- [Why ErrPulse?](/guide/why-errpulse) — See how ErrPulse compares to Sentry and LogRocket
- [Node.js SDK Reference](/sdks/node) — Full configuration and API reference
- [React SDK Reference](/sdks/react) — All provider props, hooks, and DevTools widget
- [API Reference](/api/reference) — REST endpoints and WebSocket protocol
