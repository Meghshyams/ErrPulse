---
"@errpulse/react": minor
---

feat: add ErrPulseDevTools — floating in-app debug panel

New `<ErrPulseDevTools />` component that provides a floating, draggable debug widget directly inside your app. Features include:

- **Errors tab** with expandable stack traces and server-provided explanations
- **Console tab** with live log output and click-to-expand JSON tree viewer
- **Network tab** with full request/response headers and payload inspection
- **Hybrid data** — works locally without the server, enriched with AI explanations when connected
- **Expandable panel** — maximize to near-fullscreen for large payloads
- **Draggable** — position persists across reloads via localStorage
- **Shadow DOM** — fully isolated styles, no CSS leakage
- **Dev-only by default** — hidden in production unless explicitly enabled
- **Keyboard shortcut** — Ctrl+Shift+E to toggle

Also adds an internal event subscription system to `client.ts` for real-time local event streaming.
