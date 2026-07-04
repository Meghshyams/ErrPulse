# CLI Reference

The `errpulse` CLI starts the ErrPulse server and manages its lifecycle.

## Installation

The CLI is available as the `errpulse` npm package. You can run it directly with `npx`:

```bash
npx errpulse
```

Or install it globally:

```bash
npm install -g errpulse
```

## Commands

### `errpulse` / `errpulse start`

Start the ErrPulse server.

```bash
npx errpulse
npx errpulse start
npx errpulse start --port 4000
```

**Options:**

| Flag              | Description               | Default |
| ----------------- | ------------------------- | ------- |
| `--port <number>` | Port to run the server on | `3800`  |

This starts:

- The REST API server
- The SQLite database (created at `~/.errpulse/errpulse.db` if it doesn't exist)
- The WebSocket server for real-time updates
- The dashboard (served at the root URL)

Unless `--quiet` is passed, the server also streams every new error to the terminal it runs in — severity-colored, with the plain-English explanation. Add `--requests` to also print failed HTTP requests.

### `errpulse tail`

Stream errors from an already-running ErrPulse server into the current terminal.

```bash
npx errpulse tail
npx errpulse tail --requests   # also show failed HTTP requests (4xx/5xx/network)
npx errpulse tail --port 4000
```

Repeated occurrences of the same error are collapsed to one `×N` line per 2-second window. If the server isn't running yet, `tail` waits for it and reconnects automatically if it restarts — handy in an IDE terminal pane.

### `errpulse mcp`

Start an [MCP server](/guide/ai-agents) (stdio transport) so AI coding agents like Claude Code and Cursor can query captured errors, failed requests, and console logs.

```bash
npx errpulse mcp
npx errpulse mcp --port 4000   # if the ErrPulse server runs on a custom port
```

This command is meant to be launched _by_ the agent's MCP client, not run interactively — see [AI Coding Agents](/guide/ai-agents) for setup and the tool list.

### `errpulse status`

Check if the ErrPulse server is running.

```bash
npx errpulse status
```

Output when running:

```
ErrPulse is running
Uptime: 1h 23m 45s
```

Output when not running:

```
ErrPulse is not running
```

Uses a 3-second timeout to check the `GET /api/health` endpoint.

### `errpulse clear`

Clear all stored data (errors, events, requests, projects).

```bash
npx errpulse clear
```

This sends a `POST /api/clear` request to the running server. The server must be running for this command to work.

### `errpulse help`

Show usage information.

```bash
npx errpulse help
npx errpulse -h
npx errpulse --help
```

## Environment Variables

| Variable        | Description                | Default   |
| --------------- | -------------------------- | --------- |
| `ERRPULSE_PORT` | Port to run the server on  | `3800`    |
| `ERRPULSE_HOST` | Host to bind the server to | `0.0.0.0` |

Environment variables are overridden by CLI flags. For example:

```bash
ERRPULSE_PORT=4000 npx errpulse          # Uses port 4000
npx errpulse start --port 5000            # Uses port 5000
ERRPULSE_PORT=4000 npx errpulse --port 5000  # Uses port 5000 (flag wins)
```

## Exit Codes

| Code | Meaning                                             |
| ---- | --------------------------------------------------- |
| `0`  | Success                                             |
| `1`  | Error (server not running, connection failed, etc.) |
