import { useState, useCallback, useEffect, useRef } from "react";
import { useLogs, type LogEntry } from "../hooks/useLogs";
import { useWebSocket } from "../hooks/useWebSocket";
import { useProject } from "../context/ProjectContext";
import { postJSON } from "../lib/api";
import { Terminal, Search, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { cn, timeAgo } from "../lib/utils";
import { EmptyState } from "../components/EmptyState";

const LEVEL_OPTIONS = ["all", "log", "info", "warn", "debug"];
const SOURCE_OPTIONS = ["all", "frontend", "backend"];

const LEVEL_COLORS: Record<string, string> = {
  log: "bg-slate-400/10 text-slate-400",
  info: "bg-blue-400/10 text-blue-400",
  warn: "bg-amber-400/10 text-amber-400",
  debug: "bg-purple-400/10 text-purple-400",
};

const SOURCE_COLORS: Record<string, string> = {
  frontend: "bg-blue-400/10 text-blue-400",
  backend: "bg-emerald-400/10 text-emerald-400",
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
        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 capitalize cursor-pointer",
        active
          ? "bg-primary/15 text-primary border border-primary/30"
          : "bg-muted/50 text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function LogDetailPanel({ log }: { log: LogEntry }) {
  return (
    <div className="border-t border-border/30 bg-muted/10 px-4 py-3 space-y-3">
      {/* Full message */}
      <div className="space-y-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Message
        </div>
        <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed p-3 bg-muted/30 rounded-lg border border-border/30 max-h-[300px] overflow-y-auto">
          {log.message}
        </pre>
      </div>

      {/* Environment */}
      {log.environment && Object.keys(log.environment).length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Environment
          </div>
          <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed p-3 bg-muted/30 rounded-lg border border-border/30 max-h-[200px] overflow-y-auto">
            {JSON.stringify(log.environment, null, 2)}
          </pre>
        </div>
      )}

      {/* Correlation ID */}
      {log.correlationId && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Correlation ID
          </div>
          <div className="text-[12px] font-mono text-primary/70 bg-primary/5 rounded p-2 border border-primary/10">
            {log.correlationId}
          </div>
        </div>
      )}

      {/* Extra data */}
      {log.extra && Object.keys(log.extra).length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Extra Data
          </div>
          <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed p-3 bg-muted/30 rounded-lg border border-border/30 max-h-[200px] overflow-y-auto">
            {JSON.stringify(log.extra, null, 2)}
          </pre>
        </div>
      )}

      {/* Metadata row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Level
          </div>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase",
              LEVEL_COLORS[log.level] ?? "bg-muted/50 text-muted-foreground"
            )}
          >
            {log.level}
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Source
          </div>
          <span
            className={cn(
              "text-[11px] font-mono px-1.5 py-0.5 rounded",
              SOURCE_COLORS[log.source] ?? "bg-muted/50 text-muted-foreground"
            )}
          >
            {log.source}
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Timestamp
          </div>
          <div className="text-[12px] font-mono text-muted-foreground">
            {new Date(log.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LogsPage() {
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { selectedProjectId, projects } = useProject();
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const filters: Record<string, string> = {};
  if (level !== "all") filters.level = level;
  if (source !== "all") filters.source = source;
  if (search) filters.search = search;

  const { logs, total, loading, reload, silentReload } = useLogs(filters);

  const handleMessage = useCallback(
    (msg: { type: string }) => {
      if (msg.type === "new_log") {
        silentReload();
      }
    },
    [silentReload]
  );

  useWebSocket(handleMessage);

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      await postJSON(
        "/api/logs/clear",
        selectedProjectId ? { projectId: selectedProjectId } : undefined
      );
      reload();
    } catch {
      // Silently fail
    }
    setClearing(false);
    setShowClearConfirm(false);
  }, [reload, selectedProjectId]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Keyboard: "/" to focus search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "Escape" && isInput) {
        (target as HTMLInputElement).blur();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-primary" />
          <h1 className="text-lg md:text-xl font-semibold tracking-tight">Logs</h1>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            {total}
          </span>
        </div>
        {total > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-destructive/80 hover:text-destructive bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Logs</span>
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
                    ? `This will permanently delete all logs for "${selectedProject.name}". This action cannot be undone.`
                    : "This will permanently delete all logs across all projects. This action cannot be undone."}
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
                {clearing ? "Clearing..." : "Clear Logs"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder='Search logs... (press "/" to focus)'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/50 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-[13px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">
              Level
            </span>
            {LEVEL_OPTIONS.map((l) => (
              <FilterChip key={l} label={l} active={level === l} onClick={() => setLevel(l)} />
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
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="hidden md:flex items-center gap-3 text-[10px] text-muted-foreground/50">
        <span>
          <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono">/</kbd> search
        </span>
      </div>

      {/* Log list */}
      <div className="bg-card/80 border border-border/50 rounded-lg overflow-hidden">
        {/* Column headers - hidden on mobile */}
        <div className="hidden md:grid grid-cols-[28px_60px_1fr_80px_100px] items-center gap-3 px-4 py-2 border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span />
          <span>Level</span>
          <span>Message</span>
          <span>Source</span>
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
        ) : logs.length === 0 ? (
          Object.keys(filters).length > 0 ? (
            <div className="py-16 text-center">
              <Search className="w-6 h-6 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No logs match your filters</p>
              <p className="text-[13px] text-muted-foreground/60 mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <EmptyState
              icon={<Terminal className="w-5 h-5 text-muted-foreground/40" />}
              title="No logs captured yet"
              description="Enable captureConsoleLogs in your SDK to start capturing console output."
              installCommand="captureConsoleLogs: true"
            />
          )
        ) : (
          logs.map((log, i) => {
            const isExpanded = expandedId === log.id;

            return (
              <div key={log.id}>
                <div
                  className={cn(
                    "animate-fade-up cursor-pointer",
                    "md:grid md:grid-cols-[28px_60px_1fr_80px_100px] md:items-center md:gap-3",
                    "flex flex-col gap-1.5",
                    "px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors",
                    isExpanded && "bg-muted/30"
                  )}
                  style={{ animationDelay: `${i * 20}ms` }}
                  onClick={() => toggleExpand(log.id)}
                >
                  {/* Expand chevron */}
                  <div className="hidden md:flex items-center justify-center">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Mobile: level + source inline */}
                  <div className="flex items-center gap-2 md:contents">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70 md:hidden" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 md:hidden" />
                    )}

                    {/* Level badge */}
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase",
                        LEVEL_COLORS[log.level] ?? "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {log.level}
                    </span>

                    {/* Mobile: source inline */}
                    <span
                      className={cn(
                        "md:hidden text-[10px] font-mono px-1.5 py-0.5 rounded",
                        SOURCE_COLORS[log.source] ?? "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {log.source}
                    </span>

                    {/* Mobile: timestamp */}
                    <span className="md:hidden ml-auto text-[11px] text-muted-foreground">
                      {timeAgo(log.timestamp)}
                    </span>
                  </div>

                  {/* Message */}
                  <span className="text-[12px] font-mono text-muted-foreground truncate">
                    {log.message}
                  </span>

                  {/* Desktop: source */}
                  <span
                    className={cn(
                      "hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded w-fit",
                      SOURCE_COLORS[log.source] ?? "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {log.source}
                  </span>

                  {/* Desktop: timestamp */}
                  <span className="hidden md:inline text-[11px] text-muted-foreground text-right">
                    {timeAgo(log.timestamp)}
                  </span>
                </div>

                {/* Expandable detail panel */}
                {isExpanded && <LogDetailPanel log={log} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
