import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useProject } from "../context/ProjectContext";
import { fetchJSON, clearAllLogs } from "../lib/api";
import {
  Globe,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  ArrowDownUp,
  FileCode,
  Trash2,
} from "lucide-react";
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

interface RequestDetail extends RequestEntry {
  headers?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
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

type DetailTab = "headers" | "payload" | "response-body" | "general";

function HeadersTable({ headers, title }: { headers: Record<string, string>; title: string }) {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return (
      <div className="text-[12px] text-muted-foreground/50 py-3">
        No {title.toLowerCase()} captured
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
        {title}
      </div>
      <div className="rounded-md border border-border/40 overflow-hidden">
        {entries.map(([key, value], i) => (
          <div
            key={key}
            className={cn(
              "flex text-[12px] font-mono",
              i % 2 === 0 ? "bg-muted/20" : "bg-transparent"
            )}
          >
            <span className="text-primary/80 font-medium px-3 py-1.5 w-[200px] flex-shrink-0 truncate border-r border-border/30">
              {key}
            </span>
            <span className="text-muted-foreground px-3 py-1.5 flex-1 min-w-0 break-all">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BodyViewer({ body, label }: { body: unknown; label: string }) {
  if (body === undefined || body === null) {
    return (
      <div className="text-[12px] text-muted-foreground/50 py-3">
        No {label.toLowerCase()} captured
      </div>
    );
  }

  const formatted = typeof body === "string" ? tryFormatJson(body) : JSON.stringify(body, null, 2);

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
        {label}
      </div>
      <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed p-3 bg-muted/30 rounded-lg border border-border/30 max-h-[400px] overflow-y-auto">
        {formatted}
      </pre>
    </div>
  );
}

function tryFormatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function RequestDetailPanel({ requestId }: { requestId: string }) {
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>("headers");

  useEffect(() => {
    setLoading(true);
    fetchJSON<RequestDetail>(`/api/requests/${requestId}`)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-2">
        <div className="shimmer h-4 w-1/3 rounded" />
        <div className="shimmer h-20 rounded" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="px-4 py-4 text-[12px] text-muted-foreground">
        Failed to load request details.
      </div>
    );
  }

  const hasHeaders = detail.headers && Object.keys(detail.headers).length > 0;
  const hasResponseHeaders =
    detail.responseHeaders && Object.keys(detail.responseHeaders).length > 0;
  const hasRequestBody = detail.requestBody !== undefined && detail.requestBody !== null;
  const hasResponseBody = detail.responseBody !== undefined && detail.responseBody !== null;

  const tabs: { id: DetailTab; label: string; icon: typeof FileText; badge?: boolean }[] = [
    {
      id: "headers",
      label: "Headers",
      icon: ArrowDownUp,
      badge: !!(hasHeaders || hasResponseHeaders),
    },
    { id: "payload", label: "Payload", icon: FileCode, badge: hasRequestBody },
    { id: "response-body", label: "Response", icon: FileText, badge: hasResponseBody },
    { id: "general", label: "General", icon: FileText, badge: true },
  ];

  return (
    <div className="border-t border-border/30 bg-muted/10">
      {/* Tabs */}
      <div className="flex items-center gap-0 px-4 border-b border-border/30">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors cursor-pointer",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 py-3 max-h-[500px] overflow-y-auto">
        {tab === "headers" && (
          <div className="space-y-4">
            <HeadersTable headers={detail.headers ?? {}} title="Request Headers" />
            <HeadersTable headers={detail.responseHeaders ?? {}} title="Response Headers" />
          </div>
        )}

        {tab === "payload" && <BodyViewer body={detail.requestBody} label="Request Body" />}

        {tab === "response-body" && <BodyViewer body={detail.responseBody} label="Response Body" />}

        {tab === "general" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Method
                </div>
                <div
                  className={cn(
                    "text-[13px] font-mono font-semibold",
                    METHOD_COLORS[detail.method] ?? "text-foreground"
                  )}
                >
                  {detail.method}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Status
                </div>
                <div>
                  <StatusBadge code={detail.statusCode} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Duration
                </div>
                <div className="text-[13px] font-mono">
                  {detail.duration ? `${detail.duration}ms` : "—"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Timestamp
                </div>
                <div className="text-[12px] font-mono text-muted-foreground">
                  {new Date(detail.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                URL
              </div>
              <div className="text-[12px] font-mono text-muted-foreground break-all bg-muted/30 rounded p-2 border border-border/30">
                {detail.url}
              </div>
            </div>
            {detail.correlationId && (
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Correlation ID
                </div>
                <div className="text-[12px] font-mono text-primary/70 bg-primary/5 rounded p-2 border border-primary/10">
                  {detail.correlationId}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function RequestsPage() {
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { selectedProjectId, projects } = useProject();
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

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

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      await clearAllLogs(selectedProjectId);
      load();
    } catch {
      // Silently fail
    }
    setClearing(false);
    setShowClearConfirm(false);
  }, [load, selectedProjectId]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Globe className="w-5 h-5 text-primary" />
        <h1 className="text-lg md:text-xl font-semibold tracking-tight">Requests</h1>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
          {total}
        </span>
        {total > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-destructive/80 hover:text-destructive bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        )}
      </div>

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-up">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold">
                  {selectedProject
                    ? `Clear logs for "${selectedProject.name}"?`
                    : "Clear all logs?"}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {selectedProject
                    ? `This will permanently delete all errors and requests for "${selectedProject.name}". This action cannot be undone.`
                    : "This will permanently delete all errors and requests across all projects. This action cannot be undone."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-destructive hover:bg-destructive/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card/80 border border-border/50 rounded-lg overflow-hidden">
        {/* Header row - hidden on mobile */}
        <div className="hidden md:grid grid-cols-[28px_24px_80px_60px_1fr_60px_80px_100px] items-center gap-3 px-4 py-2 border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span />
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
            const isExpanded = expandedId === req.id;

            return (
              <div key={req.id}>
                <div
                  className={cn(
                    "animate-fade-up cursor-pointer",
                    // Desktop: grid layout
                    "md:grid md:grid-cols-[28px_24px_80px_60px_1fr_60px_80px_100px] md:items-center md:gap-3",
                    // Mobile: flex card layout
                    "flex flex-col gap-1.5",
                    "px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors",
                    hasError && "bg-destructive/[0.03]",
                    isExpanded && "bg-muted/30"
                  )}
                  style={{ animationDelay: `${i * 20}ms` }}
                  onClick={() => toggleExpand(req.id)}
                >
                  {/* Expand chevron */}
                  <div className="hidden md:flex items-center justify-center">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Error indicator - hidden on mobile (shown inline instead) */}
                  <div className="hidden md:flex items-center justify-center">
                    {hasError ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive/70" />
                    ) : (
                      <span />
                    )}
                  </div>

                  {/* Mobile: method + status + error indicator inline */}
                  <div className="flex items-center gap-2 md:contents">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70 md:hidden" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 md:hidden" />
                    )}
                    {hasError && (
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive/70 md:hidden" />
                    )}
                    <span
                      className={cn(
                        "text-[12px] font-mono font-semibold",
                        METHOD_COLORS[req.method] ?? "text-muted-foreground"
                      )}
                    >
                      {req.method}
                    </span>
                    <StatusBadge code={req.statusCode} />
                    {/* Mobile: duration inline */}
                    <span className="md:hidden ml-auto text-[11px] font-mono text-muted-foreground tabular-nums">
                      {req.duration ? `${req.duration}ms` : "—"}
                    </span>
                  </div>

                  {/* URL */}
                  <span className="text-[12px] font-mono text-muted-foreground truncate">
                    {req.url}
                  </span>

                  {/* Desktop-only columns */}
                  <span className="hidden md:inline text-[11px] font-mono text-muted-foreground text-right tabular-nums">
                    {req.duration ? `${req.duration}ms` : "—"}
                  </span>
                  <span className="hidden md:inline text-[11px] font-mono text-muted-foreground text-right tabular-nums">
                    {req.duration
                      ? req.duration < 100
                        ? "fast"
                        : req.duration < 500
                          ? "ok"
                          : "slow"
                      : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground md:text-right">
                    {timeAgo(req.timestamp)}
                  </span>
                </div>

                {/* Expandable detail panel */}
                {isExpanded && <RequestDetailPanel requestId={req.id} />}

                {/* Error link */}
                {hasError && req.correlationId && !isExpanded && (
                  <div className="px-4 py-1.5 border-b border-border/30 bg-destructive/[0.02]">
                    <Link
                      to="/errors"
                      className="text-[10px] text-destructive/70 hover:text-destructive flex items-center gap-1 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      This request triggered an error — view errors
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
