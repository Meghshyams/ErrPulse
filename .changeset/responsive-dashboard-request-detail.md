---
"@errpulse/node": minor
"@errpulse/server": minor
"@errpulse/core": minor
"@errpulse/react": minor
"errpulse": minor
---

### Responsive Dashboard & Request Detail Panel

**Dashboard**

- Fully responsive layout with mobile bottom navigation bar, stacked grids, and iOS safe-area support
- Click any request row to expand an inline detail panel with four tabs: Headers, Payload, Response, and General
- Added cursor pointer (hand icon) on all clickable elements — time range filters, status buttons, filter chips
- Fixed screen flicker when changing error status (resolve/acknowledge/ignore) by using optimistic updates

**Express Middleware**

- Now captures request headers, response headers, request body, and response body alongside each tracked request
- Sensitive headers (authorization, cookie, etc.) are automatically redacted
- Request and response bodies are capped at 16 KB to prevent performance overhead

**Server**

- New `GET /api/requests/:id` endpoint returns full request details including headers and body
- Database schema extended with `response_headers`, `request_body`, and `response_body` columns (auto-migrated)
