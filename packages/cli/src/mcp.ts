import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { ErrorGroup, ErrPulseEvent } from "@errpulse/core";

// Caps keep tool results small enough for an AI agent's context window.
const MAX_BODY_CHARS = 2000;
const MAX_STACK_CHARS = 4000;
const DEFAULT_LIMIT = 20;

interface RequestRow {
  id: string;
  method: string;
  url: string;
  statusCode: number;
  duration?: number;
  timestamp: string;
  source?: string;
  correlationId?: string;
  responseBody?: string;
  projectId?: string;
}

function truncate(text: string | undefined, max: number): string | undefined {
  if (text == null) return undefined;
  return text.length > max ? text.slice(0, max) + "…[truncated]" : text;
}

// The server stores explanations as a JSON-stringified object.
function parseExplanation(raw?: string): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function trimErrorGroup(group: ErrorGroup) {
  return {
    id: group.id,
    type: group.type,
    message: group.message,
    severity: group.severity,
    source: group.source,
    status: group.status,
    count: group.count,
    firstSeen: group.firstSeen,
    lastSeen: group.lastSeen,
    projectId: group.projectId,
    explanation: parseExplanation(group.explanation),
  };
}

function trimEvent(event: ErrPulseEvent) {
  return {
    eventId: event.eventId,
    timestamp: event.timestamp,
    message: event.message,
    stack: truncate(event.stack, MAX_STACK_CHARS),
    correlationId: event.correlationId,
    request: event.request,
    environment: event.environment,
    extra: event.extra,
  };
}

export async function startMcpServer(port: number): Promise<void> {
  const api = `http://localhost:${port}/api`;

  async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(`${api}${path}`, {
      ...init,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`ErrPulse API returned ${res.status} for ${path}`);
    }
    return res.json();
  }

  function ok(data: unknown) {
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }

  function fail(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const hint =
      message.includes("fetch failed") || message.includes("timeout")
        ? `ErrPulse server is not reachable on port ${port}. Start it with \`npx errpulse\` (or pass the right port via --port / ERRPULSE_PORT).`
        : message;
    return { content: [{ type: "text" as const, text: hint }], isError: true };
  }

  const server = new McpServer({ name: "errpulse", version: "0.6.0" });

  server.registerTool(
    "get_recent_errors",
    {
      title: "Get recent errors",
      description:
        "List error groups captured by ErrPulse (frontend and backend runtime errors, console errors, failed network calls). Call this after making code changes or reproducing a bug to see what errors actually occurred at runtime. Returns grouped errors with occurrence counts and plain-English explanations.",
      inputSchema: {
        projectId: z.string().optional().describe("Filter by project ID"),
        severity: z.enum(["fatal", "error", "warning", "info"]).optional(),
        source: z.enum(["frontend", "backend"]).optional(),
        status: z.enum(["unresolved", "acknowledged", "resolved", "ignored"]).optional(),
        search: z.string().optional().describe("Full-text search in error messages"),
        timeRange: z.enum(["1h", "6h", "24h", "7d"]).optional().describe("Default: all time"),
        limit: z.number().int().min(1).max(100).optional().describe(`Default ${DEFAULT_LIMIT}`),
      },
    },
    async (args) => {
      try {
        const params = new URLSearchParams();
        if (args.projectId) params.set("projectId", args.projectId);
        if (args.severity) params.set("severity", args.severity);
        if (args.source) params.set("source", args.source);
        if (args.status) params.set("status", args.status);
        if (args.search) params.set("search", args.search);
        if (args.timeRange) params.set("timeRange", args.timeRange);
        params.set("pageSize", String(args.limit ?? DEFAULT_LIMIT));
        const data = (await apiFetch(`/errors?${params}`)) as {
          errors: ErrorGroup[];
          total: number;
        };
        return ok({ total: data.total, errors: data.errors.map(trimErrorGroup) });
      } catch (err) {
        return fail(err);
      }
    }
  );

  server.registerTool(
    "get_error_details",
    {
      title: "Get error details",
      description:
        "Get full detail for one error group: every occurrence with stack traces, page URLs, correlation IDs, and — for HTTP/network errors — the linked request with response body. Use the `id` from get_recent_errors.",
      inputSchema: {
        errorId: z.string().describe("Error group ID from get_recent_errors"),
      },
    },
    async (args) => {
      try {
        const data = (await apiFetch(`/errors/${encodeURIComponent(args.errorId)}`)) as {
          error: ErrorGroup;
          events: ErrPulseEvent[];
          linkedRequest: RequestRow | null;
        };
        return ok({
          error: trimErrorGroup(data.error),
          events: data.events.slice(0, 10).map(trimEvent),
          linkedRequest: data.linkedRequest
            ? {
                ...data.linkedRequest,
                responseBody: truncate(data.linkedRequest.responseBody, MAX_BODY_CHARS),
              }
            : null,
        });
      } catch (err) {
        return fail(err);
      }
    }
  );

  server.registerTool(
    "get_failed_requests",
    {
      title: "Get failed HTTP requests",
      description:
        "List HTTP requests that failed (4xx, 5xx, or network failure) with method, URL, status, duration, and a truncated response body. Use this to see API calls that broke — including ones the app swallowed silently.",
      inputSchema: {
        projectId: z.string().optional().describe("Filter by project ID"),
        limit: z.number().int().min(1).max(100).optional().describe(`Default ${DEFAULT_LIMIT}`),
      },
    },
    async (args) => {
      try {
        const params = new URLSearchParams({ pageSize: "200" });
        if (args.projectId) params.set("projectId", args.projectId);
        const data = (await apiFetch(`/requests?${params}`)) as { requests: RequestRow[] };
        const failed = data.requests
          .filter((r) => r.statusCode === 0 || r.statusCode >= 400)
          .slice(0, args.limit ?? DEFAULT_LIMIT)
          .map((r) => ({
            id: r.id,
            method: r.method,
            url: r.url,
            statusCode: r.statusCode,
            duration: r.duration,
            timestamp: r.timestamp,
            source: r.source,
            correlationId: r.correlationId,
            responseBody: truncate(r.responseBody, MAX_BODY_CHARS),
          }));
        return ok({ failedRequests: failed });
      } catch (err) {
        return fail(err);
      }
    }
  );

  server.registerTool(
    "get_console_logs",
    {
      title: "Get console logs",
      description:
        "List captured console.log/warn/info/debug output from the instrumented apps (browser and Node). Useful for seeing debug output without access to the browser console.",
      inputSchema: {
        level: z.enum(["log", "warn", "info", "debug"]).optional(),
        source: z.enum(["frontend", "backend"]).optional(),
        projectId: z.string().optional(),
        search: z.string().optional().describe("Full-text search in log messages"),
        limit: z.number().int().min(1).max(200).optional().describe(`Default 50`),
      },
    },
    async (args) => {
      try {
        const params = new URLSearchParams();
        if (args.level) params.set("level", args.level);
        if (args.source) params.set("source", args.source);
        if (args.projectId) params.set("projectId", args.projectId);
        if (args.search) params.set("search", args.search);
        params.set("pageSize", String(args.limit ?? 50));
        return ok(await apiFetch(`/logs?${params}`));
      } catch (err) {
        return fail(err);
      }
    }
  );

  server.registerTool(
    "get_stats",
    {
      title: "Get overview stats",
      description:
        "Dashboard overview: total errors, total requests, error rate, and health score for a time window. A quick signal for whether the app is currently healthy.",
      inputSchema: {
        projectId: z.string().optional(),
        timeRange: z.enum(["1h", "6h", "24h", "7d"]).optional().describe("Default: 24h"),
      },
    },
    async (args) => {
      try {
        const params = new URLSearchParams();
        if (args.projectId) params.set("projectId", args.projectId);
        if (args.timeRange) params.set("timeRange", args.timeRange);
        return ok(await apiFetch(`/stats?${params}`));
      } catch (err) {
        return fail(err);
      }
    }
  );

  server.registerTool(
    "update_error_status",
    {
      title: "Update error status",
      description:
        "Mark an error group as resolved, acknowledged, ignored, or unresolved. Use after fixing a bug to mark the corresponding error resolved.",
      inputSchema: {
        errorId: z.string().describe("Error group ID from get_recent_errors"),
        status: z.enum(["unresolved", "acknowledged", "resolved", "ignored"]),
      },
    },
    async (args) => {
      try {
        await apiFetch(`/errors/${encodeURIComponent(args.errorId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: args.status }),
        });
        return ok({ success: true, errorId: args.errorId, status: args.status });
      } catch (err) {
        return fail(err);
      }
    }
  );

  server.registerTool(
    "clear_all_data",
    {
      title: "Clear all ErrPulse data",
      description:
        "DESTRUCTIVE: permanently deletes ALL stored errors, requests, and logs across all projects. Useful before a reproduction run so only fresh errors show up. Ask the user before calling this unless they explicitly requested a clean slate.",
      inputSchema: {},
    },
    async () => {
      try {
        await apiFetch(`/clear`, { method: "POST" });
        return ok({ success: true, message: "All ErrPulse data cleared." });
      } catch (err) {
        return fail(err);
      }
    }
  );

  await server.connect(new StdioServerTransport());
  // stdout belongs to the MCP protocol — status goes to stderr.
  console.error(`[ErrPulse MCP] ready — proxying ErrPulse server on port ${port}`);
}
