import { useStats } from "../hooks/useStats";
import { useErrors, type ErrorGroup } from "../hooks/useErrors";
import { useWebSocket } from "../hooks/useWebSocket";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Globe, TrendingDown, ArrowRight } from "lucide-react";
import { cn, timeAgo, severityColor, sourceColor } from "../lib/utils";

function HealthDonut({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 90 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#27272a" strokeWidth="5" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold font-mono" style={{ color }}>
          {score}
        </span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">health</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  accent?: string;
}) {
  return (
    <div className="bg-card/80 border border-border/50 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3.5 h-3.5", accent ?? "text-muted-foreground")} />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold font-mono tracking-tight">{value}</p>
    </div>
  );
}

function MiniBar({ data }: { data: { timestamp: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
        No data yet
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-[3px] h-20">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-primary/30 hover:bg-primary/50 transition-colors relative group min-w-[3px]"
          style={{
            height: `${Math.max((d.count / max) * 100, 4)}%`,
          }}
        >
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-card border border-border text-[10px] px-1.5 py-0.5 rounded font-mono whitespace-nowrap z-10">
            {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorFeedItem({ error, index }: { error: ErrorGroup; index: number }) {
  return (
    <Link
      to={`/errors/${error.id}`}
      className="animate-fade-up flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={cn(
          "mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase",
          severityColor(error.severity)
        )}
      >
        {error.severity.slice(0, 3)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate">{error.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded", sourceColor(error.source))}
          >
            {error.source}
          </span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(error.lastSeen)}</span>
        </div>
      </div>
      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
        {error.count}x
      </span>
    </Link>
  );
}

export function OverviewPage() {
  const { stats, loading: statsLoading, reload: reloadStats } = useStats();
  const {
    errors,
    loading: errorsLoading,
    reload: reloadErrors,
  } = useErrors({
    pageSize: "10",
  });
  const [feed, setFeed] = useState<ErrorGroup[]>([]);

  const handleMessage = useCallback(
    (msg: { type: string; payload: unknown }) => {
      if (msg.type === "new_error" || msg.type === "new_event") {
        reloadStats();
        reloadErrors();
        const errorGroup =
          msg.type === "new_error"
            ? (msg.payload as ErrorGroup)
            : (msg.payload as { errorGroup: ErrorGroup }).errorGroup;
        if (errorGroup) {
          setFeed((prev) => [errorGroup, ...prev.slice(0, 19)]);
        }
      }
    },
    [reloadStats, reloadErrors]
  );

  useWebSocket(handleMessage);

  const displayErrors = feed.length > 0 ? feed : errors;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Real-time error monitoring</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card/80 border border-border/50 rounded-lg p-4 flex items-center gap-4">
          <HealthDonut score={stats?.healthScore ?? 100} />
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              App Health
            </span>
            <p className="text-sm text-muted-foreground">
              {stats?.healthScore !== undefined && stats.healthScore >= 90
                ? "Systems nominal"
                : stats?.healthScore !== undefined && stats.healthScore >= 70
                  ? "Degraded"
                  : stats?.healthScore !== undefined
                    ? "Critical issues"
                    : "Loading..."}
            </p>
          </div>
        </div>
        <StatCard
          label="Errors (24h)"
          value={stats?.errorsLast24h ?? 0}
          icon={AlertTriangle}
          accent="text-destructive"
        />
        <StatCard
          label="Total Requests"
          value={stats?.totalRequests ?? 0}
          icon={Globe}
          accent="text-primary"
        />
        <StatCard
          label="Error Rate"
          value={
            stats && stats.totalRequests > 0
              ? `${((stats.errorRequests / stats.totalRequests) * 100).toFixed(1)}%`
              : "0%"
          }
          icon={TrendingDown}
          accent="text-warning"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Error timeline */}
        <div className="col-span-1 bg-card/80 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Errors over time (24h)
            </span>
          </div>
          <MiniBar data={stats?.errorsOverTime ?? []} />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>24h ago</span>
            <span>now</span>
          </div>
        </div>

        {/* Live error feed */}
        <div className="col-span-2 bg-card/80 border border-border/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Recent Errors
              </span>
            </div>
            <Link
              to="/errors"
              className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {displayErrors.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No errors captured yet. Integrate a SDK to start monitoring.
              </div>
            ) : (
              displayErrors.map((error, i) => (
                <ErrorFeedItem key={error.id + i} error={error} index={i} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top errors */}
      {stats?.topErrors && stats.topErrors.length > 0 && (
        <div className="bg-card/80 border border-border/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Most Frequent Errors
            </span>
          </div>
          <div className="divide-y divide-border/30">
            {stats.topErrors.map((err, i) => (
              <Link
                key={err.id}
                to={`/errors/${err.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="text-[11px] font-mono text-muted-foreground w-5">#{i + 1}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase",
                    severityColor(err.severity)
                  )}
                >
                  {err.severity.slice(0, 3)}
                </span>
                <span className="flex-1 text-[13px] truncate">{err.message}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    sourceColor(err.source)
                  )}
                >
                  {err.source}
                </span>
                <span className="text-sm font-mono font-medium tabular-nums w-14 text-right">
                  {err.count}x
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
