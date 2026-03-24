import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useErrors, type ErrorGroup } from "../hooks/useErrors";
import { useWebSocket } from "../hooks/useWebSocket";
import { AlertTriangle, Search, ChevronRight, Check, Eye, EyeOff } from "lucide-react";
import { cn, timeAgo, severityColor, sourceColor, statusColor } from "../lib/utils";
import { EmptyState } from "../components/EmptyState";
import { Sparkline } from "../components/Sparkline";
import { TimeRangeSelector } from "../components/TimeRangeSelector";
import { fetchTrends } from "../lib/api";

const STATUS_OPTIONS = ["all", "unresolved", "acknowledged", "resolved", "ignored"];
const SOURCE_OPTIONS = ["all", "backend", "frontend"];
const SEVERITY_OPTIONS = ["all", "fatal", "error", "warning", "info"];

const TIME_RANGE_HOURS: Record<string, number> = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 168,
};

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

function QuickActions({
  error,
  onStatusChange,
}: {
  error: ErrorGroup;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      {error.status !== "resolved" && (
        <button
          onClick={() => onStatusChange(error.id, "resolved")}
          title="Resolve"
          className="p-1 rounded hover:bg-emerald-400/15 text-muted-foreground/50 hover:text-emerald-400 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      )}
      {error.status !== "acknowledged" && (
        <button
          onClick={() => onStatusChange(error.id, "acknowledged")}
          title="Acknowledge"
          className="p-1 rounded hover:bg-amber-400/15 text-muted-foreground/50 hover:text-amber-400 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
      {error.status !== "ignored" && (
        <button
          onClick={() => onStatusChange(error.id, "ignored")}
          title="Ignore"
          className="p-1 rounded hover:bg-zinc-400/15 text-muted-foreground/50 hover:text-zinc-400 transition-colors"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function ErrorRow({
  error,
  index,
  selected,
  trend,
  onStatusChange,
}: {
  error: ErrorGroup;
  index: number;
  selected: boolean;
  trend?: number[];
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <Link
      to={`/errors/${error.id}`}
      data-error-index={index}
      className={cn(
        "animate-fade-up group grid grid-cols-[auto_1fr_64px_auto_auto_auto_auto] items-center gap-3 px-4 py-3 transition-colors border-b border-border/30 last:border-0",
        selected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
      )}
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

      {/* Sparkline */}
      <div className="flex items-center justify-center">
        {trend ? <Sparkline data={trend} width={64} height={20} /> : <div className="w-16" />}
      </div>

      {/* Source */}
      <span
        className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded", sourceColor(error.source))}
      >
        {error.source}
      </span>

      {/* Status */}
      <span
        className={cn("text-[11px] font-medium capitalize min-w-[80px]", statusColor(error.status))}
      >
        {error.status}
      </span>

      {/* Count + time */}
      <div className="text-right min-w-[80px]">
        <p className="text-[13px] font-mono font-medium tabular-nums">{error.count}x</p>
        <p className="text-[11px] text-muted-foreground">{timeAgo(error.lastSeen)}</p>
      </div>

      {/* Quick actions (visible on hover) / chevron */}
      <div className="w-[72px] flex justify-end">
        <div className="hidden group-hover:flex">
          <QuickActions error={error} onStatusChange={onStatusChange} />
        </div>
        <div className="group-hover:hidden">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
        </div>
      </div>
    </Link>
  );
}

export function ErrorsPage() {
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [trends, setTrends] = useState<Record<string, number[]>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filters: Record<string, string> = {};
  if (status !== "all") filters.status = status;
  if (source !== "all") filters.source = source;
  if (severity !== "all") filters.severity = severity;
  if (search) filters.search = search;
  if (timeRange !== "all") filters.timeRange = timeRange;

  const { errors, total, loading, reload, updateErrorStatus } = useErrors(filters);

  // Fetch trends when errors change
  useEffect(() => {
    if (errors.length === 0) return;
    const ids = errors.map((e) => e.id);
    const hours = TIME_RANGE_HOURS[timeRange] ?? 24;
    fetchTrends(ids, hours)
      .then(setTrends)
      .catch(() => {});
  }, [errors, timeRange]);

  const handleMessage = useCallback(
    (msg: { type: string }) => {
      if (msg.type === "new_error" || msg.type === "new_event" || msg.type === "status_change") {
        reload();
      }
    },
    [reload]
  );

  useWebSocket(handleMessage);

  const handleStatusChange = useCallback(
    (errorId: string, newStatus: string) => {
      updateErrorStatus(errorId, newStatus);
    },
    [updateErrorStatus]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // "/" focuses search
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Escape clears search focus
      if (e.key === "Escape" && isInput) {
        (target as HTMLInputElement).blur();
        return;
      }

      if (isInput) return;

      // j/k navigation
      if (e.key === "j") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, errors.length - 1));
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      // Enter opens selected error
      if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < errors.length) {
        e.preventDefault();
        navigate(`/errors/${errors[selectedIndex].id}`);
        return;
      }

      // Quick actions on selected error
      if (selectedIndex >= 0 && selectedIndex < errors.length) {
        const error = errors[selectedIndex];
        if (e.key === "r") {
          e.preventDefault();
          handleStatusChange(error.id, "resolved");
        } else if (e.key === "a") {
          e.preventDefault();
          handleStatusChange(error.id, "acknowledged");
        } else if (e.key === "i") {
          e.preventDefault();
          handleStatusChange(error.id, "ignored");
        }
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [errors, selectedIndex, navigate, handleStatusChange]);

  // Reset selection when errors change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [status, source, severity, search, timeRange]);

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
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder='Search errors... (press "/" to focus)'
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

      {/* Keyboard hint */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
        <span>
          <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">j</kbd>{" "}
          <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">k</kbd> navigate
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">r</kbd> resolve
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">a</kbd> ack
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">i</kbd> ignore
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">/</kbd> search
        </span>
      </div>

      {/* Error list */}
      <div className="bg-card/80 border border-border/50 rounded-lg overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[auto_1fr_64px_auto_auto_auto_auto] items-center gap-3 px-4 py-2 border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span className="min-w-[32px]">Sev</span>
          <span>Error</span>
          <span className="text-center">Trend</span>
          <span>Source</span>
          <span className="min-w-[80px]">Status</span>
          <span className="text-right min-w-[80px]">Events</span>
          <span className="w-[72px]" />
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
          Object.keys(filters).length > 0 ? (
            <div className="py-16 text-center">
              <Search className="w-6 h-6 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No errors match your filters</p>
              <p className="text-[13px] text-muted-foreground/60 mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <EmptyState
              icon={<AlertTriangle className="w-5 h-5 text-muted-foreground/40" />}
              title="No errors caught yet"
              description="Add the ErrPulse SDK to your app to start catching errors automatically."
              installCommand="npm install @errpulse/node"
            />
          )
        ) : (
          errors.map((error, i) => (
            <ErrorRow
              key={error.id}
              error={error}
              index={i}
              selected={i === selectedIndex}
              trend={trends[error.id]}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
