# Vite Plugin

`@errpulse/vite` is the fastest way to instrument a frontend: **one line in `vite.config`, zero application code**. It works with any framework Vite serves — React, Vue, Svelte, Solid, vanilla — because it injects the framework-agnostic browser SDK into your `index.html` during development.

```bash
npm install -D @errpulse/vite
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import errpulse from "@errpulse/vite";

export default defineConfig({
  plugins: [errpulse()],
});
```

That's it. Run `npx errpulse` for the server, start `vite dev`, and every runtime error, console error, failed fetch/XHR, and resource failure shows up in the dashboard and terminal stream.

## Dev-only by design

The plugin applies only to the dev server (`apply: "serve"`). Production builds contain **zero ErrPulse code** — nothing to strip, no `enabled` flag to remember.

## Options

All options are optional:

```ts
errpulse({
  endpoint: "http://localhost:3800", // ErrPulse server URL
  projectId: "my-app", // default: your package.json name
  captureConsoleErrors: true, // console.error → error events
  captureConsoleLogs: false, // console.log/warn/info/debug → Logs tab
  captureFetch: true, // request logging + 4xx/5xx/network failures
  captureXHR: true,
  captureResourceErrors: true, // failed <img>/<script>/<link> loads
  correlationPropagationTargets: ["api.mycompany.com", /^https:\/\/staging\./],
});
```

`projectId` defaults to your app's `package.json` name, so multiple projects separate cleanly in the dashboard with no configuration.

## How it works

The plugin registers a virtual module that calls `init()` from `@errpulse/browser`, and injects it as the **first** script in `<head>` — so the fetch/XHR/console interceptors are installed before any of your application code runs.

## `@errpulse/browser` — use the SDK directly

The plugin is a thin wrapper around `@errpulse/browser`, which you can also use directly in any browser app (no Vite required):

```ts
import { init } from "@errpulse/browser";

init({ endpoint: "http://localhost:3800", projectId: "my-app" });
```

`init()` returns a teardown function and is safe to call more than once (subsequent calls are no-ops).

## Using with React

If you use the Vite plugin, you don't need `<ErrPulseProvider>` — capture is already installed. Add `@errpulse/react` on top only for the extras:

- `<ErrPulseDevTools />` — the in-app floating debug panel
- `<ErrPulseErrorBoundary>` — React render-crash capture with a fallback UI
- `useErrPulse()` — manual capture hook

Pick **one** capture layer: either the Vite plugin _or_ `<ErrPulseProvider>`, not both.
