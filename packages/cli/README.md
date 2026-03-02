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

- **Real-time dashboard** — Errors appear instantly via WebSocket
- **Frontend + Backend** — Correlate user actions to server errors
- **Plain-English explanations** — Every error gets a human-readable explanation with fix suggestions
- **Multi-project** — Monitor multiple apps from one dashboard
- **SQLite storage** — Zero-setup, runs entirely local

## Packages

| Package                                                              | Description                                      |
| -------------------------------------------------------------------- | ------------------------------------------------ |
| [`@errpulse/node`](https://www.npmjs.com/package/@errpulse/node)     | Backend SDK for Node.js, Express, Next.js        |
| [`@errpulse/react`](https://www.npmjs.com/package/@errpulse/react)   | Frontend SDK for React                           |
| [`@errpulse/server`](https://www.npmjs.com/package/@errpulse/server) | Express API + SQLite + WebSocket server          |
| [`@errpulse/core`](https://www.npmjs.com/package/@errpulse/core)     | Shared types, fingerprinting, error explanations |

## Documentation

- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)
- [Full Documentation](https://github.com/Meghshyams/ErrPulse#readme)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
