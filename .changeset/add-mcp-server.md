---
"errpulse": minor
---

feat: MCP server — give AI coding agents eyes on your runtime errors

New `npx errpulse mcp` command starts an MCP (Model Context Protocol) server over stdio, letting Claude Code, Cursor, and other MCP-capable agents query ErrPulse directly:

- `get_recent_errors` — grouped errors with counts and plain-English explanations, filterable by project/severity/source/status/time/search
- `get_error_details` — stack traces, occurrences, and the linked HTTP request (with response body) for one error
- `get_failed_requests` — 4xx/5xx/network failures with truncated response bodies
- `get_console_logs` — captured console output from browser and Node
- `get_stats` — error rate and health overview
- `update_error_status` — mark errors resolved after fixing
- `clear_all_data` — wipe data before a reproduction run (flagged destructive)

Responses are context-window-friendly (capped stacks/bodies), and every tool returns an actionable hint when the ErrPulse server isn't running. Register with `claude mcp add errpulse -- npx errpulse mcp`.
