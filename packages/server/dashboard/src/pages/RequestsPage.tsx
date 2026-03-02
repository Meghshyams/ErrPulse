import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useProject } from "../context/ProjectContext";
import { fetchJSON } from "../lib/api";
import { Globe } from "lucide-react";
import { cn, timeAgo } from "../lib/utils";

interface RequestEntry {
  id: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  correlationId?: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-blue-400",
  PUT: "text-amber-400",
  PATCH: "text-amber-400",
  DELETE: "text-red-400",
};

function StatusBadge({ code }: { code: number }) {
  const color =
    code >= 500
      ? "bg-red-400/10 text-red-400"
      : code >= 400
        ? "bg-amber-400/10 text-amber-400"
        : code >= 300
          ? "bg-blue-400/10 text-blue-400"
          : "bg-emerald-400/10 text-emerald-400";

  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-mono font-medium", color)}>
      {code}
    </span>
  );
}

export function RequestsPage() {
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { selectedProjectId } = useProject();

  const load = useCallback(async () => {
    try {
      const params = selectedProjectId ? `?projectId=${selectedProjectId}` : "";
      const data = await fetchJSON<{ requests: RequestEntry[]; total: number }>(
        `/api/requests${params}`
      );
      setRequests(data.requests);
      setTotal(data.total);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, [selectedProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMessage = useCallback(
    (msg: { type: string }) => {
      if (msg.type === "new_request") load();
    },
    [load]
  );

  useWebSocket(handleMessage);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Globe className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Requests</h1>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
          {total}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card/80 border border-border/50 rounded-lg overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[80px_60px_1fr_60px_80px_100px] items-center gap-3 px-4 py-2 border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span>Method</span>
          <span>Status</span>
          <span>URL</span>
          <span className="text-right">Time</span>
          <span className="text-right">Duration</span>
          <span className="text-right">When</span>
        </div>

        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-border/30">
                <div
                  className="shimmer h-4 rounded"
                  style={{ width: `${60 + Math.random() * 30}%` }}
                />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <Globe className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No requests logged yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Install the SDK middleware to start tracking requests
            </p>
          </div>
        ) : (
          requests.map((req, i) => (
            <div
              key={req.id}
              className="animate-fade-up grid grid-cols-[80px_60px_1fr_60px_80px_100px] items-center gap-3 px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <span
                className={cn(
                  "text-[12px] font-mono font-semibold",
                  METHOD_COLORS[req.method] ?? "text-muted-foreground"
                )}
              >
                {req.method}
              </span>
              <StatusBadge code={req.statusCode} />
              <span className="text-[12px] font-mono text-muted-foreground truncate">
                {req.url}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground text-right tabular-nums">
                {req.duration ? `${req.duration}ms` : "—"}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground text-right tabular-nums">
                {req.duration
                  ? req.duration < 100
                    ? "fast"
                    : req.duration < 500
                      ? "ok"
                      : "slow"
                  : "—"}
              </span>
              <span className="text-[11px] text-muted-foreground text-right">
                {timeAgo(req.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
