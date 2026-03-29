---
"@errpulse/react": minor
"@errpulse/server": minor
"@errpulse/node": minor
"@errpulse/core": minor
"errpulse": minor
---

### React SDK: Request Detail Capture

- Fetch interceptor now captures request headers, response headers, request body, and response body alongside each tracked request
- Bodies are capped at 16 KB with truncation; sensitive headers are sanitized
- Response bodies are read via `response.clone()` to avoid consuming the original stream

### Dashboard: Inline API Response for HTTP Errors

- Error detail page now shows the linked API response (response body, request body, headers) inline for `http_error` and `network_error` types
- Linked via correlation ID — no need to navigate to the Requests page

### Dashboard: Toast & Favicon Notifications Fixed

- Toast notifications and favicon badges now trigger for both new errors (`new_error`) and repeat occurrences (`new_event`)
- Previously only first-time error groups triggered notifications

### Dashboard: Project Selection Persistence

- Selected project is saved to localStorage and persists across page refreshes

### Server: Time-Windowed Health Score

- Health score now respects the selected time range (1h, 6h, 24h, 7d) instead of counting all requests ever
- Score naturally recovers as errors age out of the selected window

### Server: Regression Detection

- Resolved errors are automatically reopened to "unresolved" when the same error recurs
- Ignored and acknowledged errors remain in their current state on recurrence
