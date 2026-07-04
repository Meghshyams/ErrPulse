# AI Coding Agents (MCP)

ErrPulse ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server so AI coding agents — Claude Code, Cursor, Windsurf, and any other MCP-capable tool — can see your app's **runtime errors** directly: browser console errors, failed network calls, backend crashes.

This closes the loop that coding agents are normally blind to. The agent edits your code, you click through the app, and the agent can then ask ErrPulse _"what actually broke?"_ — without you copy-pasting stack traces from DevTools.

## Setup

Start ErrPulse as usual, and make sure your app has an ErrPulse SDK installed ([Getting Started](/guide/getting-started)):

```bash
npx errpulse
```

Then register the MCP server with your agent:

::: code-group

```bash [Claude Code]
claude mcp add errpulse -- npx errpulse mcp
```

```json [Cursor (~/.cursor/mcp.json)]
{
  "mcpServers": {
    "errpulse": {
      "command": "npx",
      "args": ["errpulse", "mcp"]
    }
  }
}
```

```json [Generic MCP config]
{
  "mcpServers": {
    "errpulse": {
      "command": "npx",
      "args": ["errpulse", "mcp", "--port", "3800"]
    }
  }
}
```

:::

The MCP server talks to the running ErrPulse server over its REST API. If ErrPulse runs on a custom port, pass `--port <number>` (or set `ERRPULSE_PORT`).

## Available tools

| Tool                  | What it does                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_recent_errors`   | List error groups with counts and plain-English explanations. Filterable by project, severity, source, status, time range, and text search    |
| `get_error_details`   | Full detail for one error: every occurrence with stack traces, page URLs, and the linked HTTP request (with response body) for network errors |
| `get_failed_requests` | HTTP requests that failed (4xx/5xx/network) with method, URL, status, duration, and truncated response body                                   |
| `get_console_logs`    | Captured `console.log/warn/info/debug` output from browser and Node                                                                           |
| `get_stats`           | Overview: error counts, request counts, error rate, health score                                                                              |
| `update_error_status` | Mark an error resolved / acknowledged / ignored — useful after the agent fixes the bug                                                        |
| `clear_all_data`      | Wipe all stored data — useful before a reproduction run so only fresh errors show up (destructive!)                                           |

## Example workflow

A typical loop with Claude Code:

```
You:    The login page breaks after my last change — can you fix it?

Agent:  → get_recent_errors (timeRange: "1h")
        Sees: TypeError: Cannot read properties of null (reading 'user')
        ×4, frontend, with explanation "Null Reference Access"

        → get_error_details (errorId: ...)
        Sees the stack trace pointing at Profile.tsx:33, plus the linked
        401 response from POST /api/login with body {"error":"invalid credentials"}

        Fixes the null access AND notices the auth header regression
        that caused the 401.

        → update_error_status (status: "resolved")
```

Or proactively — ask the agent to verify its own work:

```
You:    Refactor the checkout flow, then check ErrPulse for any new errors.
```

## Notes

- The MCP server is read-mostly. The only mutating tools are `update_error_status` and `clear_all_data`; the latter is marked destructive in its description so well-behaved agents will confirm before calling it.
- Responses are trimmed (stack traces capped at 4 KB, bodies at 2 KB, ≤10 events per error) to keep the agent's context window healthy.
- If the ErrPulse server isn't running, every tool returns a clear hint (`Start it with npx errpulse`) instead of failing opaquely.
