---
"errpulse": minor
---

feat: stream errors to the terminal — `errpulse tail` + live streaming in `start`

Errors no longer sit silently in the dashboard waiting to be noticed:

- `npx errpulse` (the `start` command) now streams every new error to the terminal it runs in, with severity coloring, the plain-English explanation, and fix suggestion. Recurrences are throttled to one line per error group per 2s window, showing the cumulative ×count. Disable with `--quiet`.
- New `npx errpulse tail` command attaches to an already-running ErrPulse server from any terminal. It waits for the server if it isn't up yet and reconnects automatically if the server restarts.
- `--requests` flag (on both commands) additionally prints failed HTTP requests (4xx/5xx/network failures).
