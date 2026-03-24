import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useProject } from "../context/ProjectContext";
import { fetchJSON } from "../lib/api";
import { Globe, AlertTriangle } from "lucide-react";
import { cn, timeAgo } from "../lib/utils";
import { EmptyState } from "../components/EmptyState";

interface RequestEntry {
  id: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  correlationId?: string;
  errorEventId?: string;
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
        <div className="grid grid-cols-[24px_80px_60px_1fr_60px_80px_100px] items-center gap-3 px-4 py-2 border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span />
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
          <EmptyState
            icon={<Globe className="w-5 h-5 text-muted-foreground/40" />}
            title="No requests logged yet"
            description="Add the Express middleware to start tracking HTTP requests automatically."
            installCommand="npm install @errpulse/node"
          />
        ) : (
          requests.map((req, i) => {
            const hasError = !!req.errorEventId;
            const row = (
              <div
                key={req.id}
                className={cn(
                  "animate-fade-up grid grid-cols-[24px_80px_60px_1fr_60px_80px_100px] items-center gap-3 px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors",
                  hasError && "bg-destructive/[0.03]"
                )}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {/* Error indicator */}
                <div className="flex items-center justify-center">
                  {hasError ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive/70" />
                  ) : (
                    <span />
                  )}
                </div>

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
            );

            // If request has an associated error, wrap with a link to find it
            if (hasError && req.correlationId) {
              return (
                <Link
                  key={req.id}
                  to={`/errors`}
                  title="This request triggered an error — click to view errors"
                  className="block"
                >
                  {row}
                </Link>
              );
            }

            return row;
          })
        )}
      </div>
    </div>
  );
}
