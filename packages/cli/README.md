<p align="center">
  <img src="https://img.shields.io/badge/ErrPulse-CLI-f43f5e?style=for-the-badge&labelColor=09090b" alt="errpulse" />
</p>

# errpulse

The error monitoring tool that runs with one command. Catch every error — frontend and backend — in a real-time dashboard. Zero config. Zero cost. One `npx` command.

## Quick Start

```bash
npx errpulse
# => ErrPulse running at http://localhost:3800
```

Then add the SDKs to your app:

```bash
npm install @errpulse/node   # Backend: Node.js, Express, Next.js
npm install @errpulse/react  # Frontend: React
```

```ts
// Backend — zero-config auto-capture
import "@errpulse/node";
```

```tsx
// Frontend — wrap your app
import { ErrPulseProvider } from "@errpulse/react";

<ErrPulseProvider endpoint="http://localhost:3800">
  <App />
</ErrPulseProvider>;
```

Open [http://localhost:3800](http://localhost:3800) — see all errors in real-time.

## CLI Commands

| Command                       | Description                |
| ----------------------------- | -------------------------- |
| `npx errpulse`                | Start server on port 3800  |
| `npx errpulse start --port N` | Start on a custom port     |
| `npx errpulse status`         | Check if server is running |
| `npx errpulse clear`          | Clear all stored data      |
| `npx errpulse help`           | Show help                  |

## What You Get

- **Real-time dashboard** with 4 views: Overview, Errors, Requests, and Logs
- **Catches everything** — uncaught exceptions, unhandled rejections, failed fetches, React crashes, console.error, console.log/warn/info/debug (opt-in), resource failures, memory warnings
- **Frontend + Backend correlation** — trace a user's click to the server error it caused
- **Plain-English explanations** — 46 built-in patterns explain errors in human-readable language with fix suggestions
- **Console log capture** — opt-in capture of console.log/warn/info/debug to a dedicated Logs dashboard section
- **Multi-project** — monitor multiple apps from one dashboard
- **SQLite storage** — zero-setup, runs entirely local
- **Light/Dark mode** — toggle themes in the dashboard

## Dashboard

The dashboard at `http://localhost:3800` provides:

- **Overview** — Health score, error count, request count, error rate, real-time feed
- **Errors** — Filterable list with sparklines, keyboard shortcuts (j/k/r/a/i), inline quick actions
- **Requests** — HTTP request log with expandable detail panels (headers, body, response)
- **Logs** — Console output viewer with level/source filtering, search, real-time streaming
- **Project selector** — filter all views by project
- **Clear all** — project-scoped data clearing with confirmation dialog

## Packages

| Package                                                              | Description                                      |
| -------------------------------------------------------------------- | ------------------------------------------------ |
| [`@errpulse/node`](https://www.npmjs.com/package/@errpulse/node)     | Backend SDK for Node.js, Express, Next.js        |
| [`@errpulse/react`](https://www.npmjs.com/package/@errpulse/react)   | Frontend SDK for React                           |
| [`@errpulse/server`](https://www.npmjs.com/package/@errpulse/server) | Express API + SQLite + WebSocket + Dashboard     |
| [`@errpulse/core`](https://www.npmjs.com/package/@errpulse/core)     | Shared types, fingerprinting, error explanations |

## Documentation

- [Full Documentation](https://meghshyams.github.io/ErrPulse/)
- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
