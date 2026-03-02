import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useErrors, type ErrorGroup } from "../hooks/useErrors";
import { useWebSocket } from "../hooks/useWebSocket";
import { AlertTriangle, Search, ChevronRight } from "lucide-react";
import { cn, timeAgo, severityColor, sourceColor, statusColor } from "../lib/utils";

const STATUS_OPTIONS = ["all", "unresolved", "acknowledged", "resolved", "ignored"];
const SOURCE_OPTIONS = ["all", "backend", "frontend"];
const SEVERITY_OPTIONS = ["all", "fatal", "error", "warning", "info"];

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 capitalize",
        active
          ? "bg-primary/15 text-primary border border-primary/30"
          : "bg-muted/50 text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function ErrorRow({ error, index }: { error: ErrorGroup; index: number }) {
  return (
    <Link
      to={`/errors/${error.id}`}
      className="animate-fade-up grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Severity */}
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase min-w-[32px] text-center",
          severityColor(error.severity)
        )}
      >
        {error.severity.slice(0, 3)}
      </span>

      {/* Message */}
      <div className="min-w-0">
        <p className="text-[13px] font-medium truncate">{error.message}</p>
        <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{error.type}</p>
      </div>

      {/* Source */}
      <span
        className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded", sourceColor(error.source))}
      >
        {error.source}
      </span>

      {/* Status */}
      <span className={cn("text-[11px] font-medium capitalize", statusColor(error.status))}>
        {error.status}
      </span>

      {/* Count + time */}
      <div className="text-right min-w-[80px]">
        <p className="text-[13px] font-mono font-medium tabular-nums">{error.count}x</p>
        <p className="text-[11px] text-muted-foreground">{timeAgo(error.lastSeen)}</p>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
    </Link>
  );
}

export function ErrorsPage() {
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");

  const filters: Record<string, string> = {};
  if (status !== "all") filters.status = status;
  if (source !== "all") filters.source = source;
  if (severity !== "all") filters.severity = severity;
  if (search) filters.search = search;

  const { errors, total, loading, reload } = useErrors(filters);

  const handleMessage = useCallback(
    (msg: { type: string }) => {
      if (msg.type === "new_error" || msg.type === "new_event" || msg.type === "status_change") {
        reload();
      }
    },
    [reload]
  );

  useWebSocket(handleMessage);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h1 className="text-xl font-semibold tracking-tight">Errors</h1>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            {total}
          </span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search errors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/50 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-[13px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">
              Status
            </span>
            {STATUS_OPTIONS.map((s) => (
              <FilterChip key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">
              Source
            </span>
            {SOURCE_OPTIONS.map((s) => (
              <FilterChip key={s} label={s} active={source === s} onClick={() => setSource(s)} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">
              Severity
            </span>
            {SEVERITY_OPTIONS.map((s) => (
              <FilterChip
                key={s}
                label={s}
                active={severity === s}
                onClick={() => setSeverity(s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error list */}
      <div className="bg-card/80 border border-border/50 rounded-lg overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2 border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span className="min-w-[32px]">Sev</span>
          <span>Error</span>
          <span>Source</span>
          <span>Status</span>
          <span className="text-right min-w-[80px]">Events</span>
          <span className="w-3.5" />
        </div>

        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4 border-b border-border/30">
                <div className="shimmer h-4 w-3/4 rounded" />
                <div className="shimmer h-3 w-1/3 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : errors.length === 0 ? (
          <div className="py-16 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No errors found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {Object.keys(filters).length > 0
                ? "Try adjusting your filters"
                : "Integrate a SDK to start catching errors"}
            </p>
          </div>
        ) : (
          errors.map((error, i) => <ErrorRow key={error.id} error={error} index={i} />)
        )}
      </div>
    </div>
  );
}
