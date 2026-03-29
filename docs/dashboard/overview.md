# Dashboard

The ErrPulse dashboard is a React-based SPA served by the ErrPulse server at [http://localhost:3800](http://localhost:3800). It provides real-time visibility into errors and requests across all your projects.

## Overview Page

The main dashboard shows:

- **Health score** — a 0–100 donut chart based on your error rate within the selected time window. Higher score means fewer errors relative to total requests. The score naturally recovers as errors age out of the window.
- **Error count** — total errors in the last 24 hours
- **Request count** — total tracked HTTP requests
- **Error rate** — percentage of requests that resulted in errors
- **Needs Attention** — a highlighted section showing unresolved errors sorted by frequency, with inline quick actions to resolve/acknowledge/ignore without leaving the overview
- **Real-time error feed** — new errors appear instantly via WebSocket
- **Errors over time** — bar chart showing error frequency over the selected time range
- **Time range selector** — switch between 1h, 6h, 24h, 7d, or all-time views

## Errors Page

A filterable, searchable list of all error groups:

### Filters

- **Severity** — Fatal, Error, Warning, Info
- **Source** — Backend, Frontend
- **Status** — Unresolved, Acknowledged, Resolved, Ignored
- **Search** — full-text search on error messages
- **Time range** — 1h, 6h, 24h, 7d, or All

### Error List

Each row shows:

- Error type icon and severity badge
- Error message (truncated)
- **Sparkline trend** — inline mini chart showing error frequency over the selected time range
- Source (backend/frontend)
- Current status
- Occurrence count and last seen time
- **Inline quick actions** — resolve, acknowledge, or ignore on hover without navigating to the detail page

### Keyboard Shortcuts

The errors page supports keyboard navigation:

| Key       | Action                            |
| --------- | --------------------------------- |
| `j` / `k` | Navigate down / up through errors |
| `Enter`   | Open the selected error detail    |
| `r`       | Resolve the selected error        |
| `a`       | Acknowledge the selected error    |
| `i`       | Ignore the selected error         |
| `/`       | Focus the search input            |
| `Esc`     | Blur the search input             |

Pagination is supported with 50 errors per page.

## Error Detail Page

Click on any error to see full details:

### Plain-English Explanation

ErrPulse matches the error against 46 built-in patterns and shows:

- **Title** — e.g., "Connection Refused"
- **Explanation** — what the error means in plain English
- **Suggestion** — how to fix it

### Stack Trace Viewer

- Full stack trace with syntax highlighting
- In-app frames are highlighted to distinguish your code from library code
- Filename, function name, line number, and column number

### Event Timeline

A chronological list of every occurrence of this error, showing:

- Timestamp
- Request context (if available)
- Environment info (runtime, OS, browser)

### API Response (HTTP Errors)

For HTTP and network errors, the error detail page shows the linked API response inline — no need to navigate to the Requests page. This section includes tabbed views for:

- **Response Body** — the API response formatted as JSON
- **Request Body** — the outgoing payload
- **Headers** — response headers

This section only appears for `http_error` and `network_error` type errors where a linked request (via correlation ID) is available.

### Status Management

Change the error's status:

- **Unresolved** — default, needs attention
- **Acknowledged** — someone is looking at it
- **Resolved** — fixed. If the same error recurs, it is automatically reopened as **unresolved** (regression detection)
- **Ignored** — not worth tracking. Ignored errors stay ignored even if they recur

## Requests Page

An HTTP request log showing all tracked requests:

| Column          | Description                                        |
| --------------- | -------------------------------------------------- |
| Error indicator | Red warning icon if the request triggered an error |
| Method          | HTTP method (GET, POST, etc.)                      |
| URL             | Request URL path                                   |
| Status          | HTTP status code                                   |
| Duration        | Response time in milliseconds                      |
| Timestamp       | When the request was made                          |

Requests that resulted in errors are highlighted with a visual indicator and linked to the errors page.

### Request Detail Panel

Click on any request row to expand an inline detail panel with four tabs:

- **Headers** — request headers and response headers displayed in a table. Sensitive headers (authorization, cookie, etc.) are automatically redacted.
- **Payload** — the request body, auto-formatted as JSON when possible.
- **Response** — the response body returned by the server, auto-formatted as JSON.
- **General** — method, status code, duration, timestamp, full URL, and correlation ID.

::: tip
Request and response bodies are capped at 16 KB to avoid performance overhead. Bodies larger than 16 KB are truncated with a `...[truncated]` indicator.
:::

The detail panel fetches data lazily — it only loads the full request details (headers, body) when you expand a row, keeping the initial page load fast.

## Responsive Design

The dashboard is fully responsive and works on mobile devices:

- On small screens, the sidebar collapses into a **bottom navigation bar** with icons and labels
- Stat cards, grids, and error rows stack vertically on mobile
- Table column headers are hidden on mobile, with data presented in a card-style layout
- The theme toggle and live connection indicator move to the top header bar on mobile
- Safe-area padding is applied for iOS devices with notches

## Project Selector

When you have multiple projects sending errors to ErrPulse, the dashboard shows a project selector:

- Click the project icon in the sidebar to open the project list
- Select a project to filter all views (overview, errors, requests) to that project only
- Select "All Projects" to see everything
- Your project selection is persisted to localStorage and survives page refreshes

## Light / Dark Mode

Toggle between light and dark themes using the sun/moon icon in the sidebar. Your preference is saved to localStorage and persists across sessions.

- **Dark mode**: Near-black background with zinc tones (default)
- **Light mode**: Warm off-white background with stone tones

## Favicon Badge

When the dashboard tab is not focused, a red notification badge appears on the favicon showing the count of new errors (including repeat occurrences) that arrived while you were away. The badge resets automatically when you switch back to the tab.

## Toast Notifications

When a new error is detected (both first-time errors and repeat occurrences), a toast notification slides in from the top-right corner:

- Shows the error message and severity
- Auto-dismisses after 4 seconds
- Stacks up to 3 notifications
- Dismissible with the close button

## Real-Time Updates

The dashboard connects to the ErrPulse server via WebSocket (`ws://localhost:3800/ws`). Updates appear instantly when:

- A new error group is created
- A new event is added to an existing error
- An error's status changes
- A new HTTP request is logged

No polling — all updates are pushed in real time.
