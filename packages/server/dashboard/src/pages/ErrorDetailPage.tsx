import { useParams, Link } from "react-router-dom";
import { useErrorDetail, type ErrorEvent } from "../hooks/useErrors";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Lightbulb,
  Code2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn, timeAgo, severityColor, sourceColor, statusColor } from "../lib/utils";

interface Explanation {
  title: string;
  explanation: string;
  suggestion: string;
}

function parseExplanation(json?: string): Explanation | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Explanation;
  } catch {
    return null;
  }
}

function ExplanationCard({ explanation }: { explanation: Explanation }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">{explanation.title}</span>
      </div>
      <p className="text-[13px] text-foreground/80 leading-relaxed">{explanation.explanation}</p>
      <div className="bg-background/50 rounded-md p-3 border border-border/30">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">
          Suggestion
        </span>
        <p className="text-[13px] text-foreground/70 leading-relaxed">{explanation.suggestion}</p>
      </div>
    </div>
  );
}

function StackTraceViewer({ event }: { event: ErrorEvent }) {
  if (!event.stackFrames || event.stackFrames.length === 0) {
    if (event.stack) {
      return (
        <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed p-4 bg-muted/30 rounded-lg overflow-x-auto">
          {event.stack}
        </pre>
      );
    }
    return null;
  }

  return (
    <div className="space-y-0 rounded-lg overflow-hidden border border-border/50">
      {event.stackFrames.map((frame, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-2 border-b border-border/30 last:border-0 font-mono text-[12px]",
            frame.inApp ? "bg-primary/5" : "bg-transparent opacity-50"
          )}
        >
          <div className="flex items-center gap-2">
            {frame.inApp && (
              <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-semibold">
                APP
              </span>
            )}
            <span className={frame.inApp ? "text-foreground" : "text-muted-foreground"}>
              {frame.function}
            </span>
          </div>
          <div className="text-muted-foreground mt-0.5 pl-0">
            {frame.filename}
            <span className="text-primary/60">
              :{frame.lineno}:{frame.colno}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventTimeline({ events }: { events: ErrorEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div
          key={event.eventId}
          className="animate-fade-up flex gap-3 px-4 py-3 border-b border-border/30 last:border-0"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="flex flex-col items-center">
            <div
              className={cn("w-2 h-2 rounded-full mt-1.5", i === 0 ? "bg-primary" : "bg-border")}
            />
            {i < events.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground">
                {new Date(event.timestamp).toLocaleString()}
              </span>
              {event.correlationId && (
                <span className="text-[10px] font-mono text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                  {event.correlationId}
                </span>
              )}
            </div>
            {event.request && (
              <div className="flex items-center gap-2 mt-1.5 text-[12px] font-mono">
                <span className="text-primary font-medium">{event.request.method}</span>
                <span className="text-muted-foreground truncate">{event.request.url}</span>
                {event.request.statusCode && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px]",
                      event.request.statusCode >= 500
                        ? "bg-red-400/10 text-red-400"
                        : event.request.statusCode >= 400
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-emerald-400/10 text-emerald-400"
                    )}
                  >
                    {event.request.statusCode}
                  </span>
                )}
                {event.request.duration && (
                  <span className="text-muted-foreground/60">{event.request.duration}ms</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusButton({
  label,
  icon: Icon,
  active,
  onClick,
  variant,
}: {
  label: string;
  icon: typeof Check;
  active: boolean;
  onClick: () => void;
  variant: string;
}) {
  const colors: Record<string, string> = {
    resolve: "hover:bg-emerald-400/10 hover:text-emerald-400 hover:border-emerald-400/30",
    acknowledge: "hover:bg-amber-400/10 hover:text-amber-400 hover:border-amber-400/30",
    ignore: "hover:bg-zinc-400/10 hover:text-zinc-400 hover:border-zinc-400/30",
    unresolve: "hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/30",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all duration-150",
        active
          ? "bg-primary/10 text-primary border-primary/30"
          : cn("bg-transparent text-muted-foreground border-border/50", colors[variant])
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

export function ErrorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, updateStatus } = useErrorDetail(id!);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="shimmer h-6 w-48 rounded" />
        <div className="shimmer h-40 rounded-lg" />
        <div className="shimmer h-60 rounded-lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center py-20">
        <AlertTriangle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Error not found</p>
        <Link to="/errors" className="text-primary text-sm mt-2 inline-block hover:underline">
          Back to errors
        </Link>
      </div>
    );
  }

  const { error, events } = data;
  const explanation = parseExplanation(error.explanation);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Back link */}
      <Link
        to="/errors"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to errors
      </Link>

      {/* Error header */}
      <div className="bg-card/80 border border-border/50 rounded-lg p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase",
                  severityColor(error.severity)
                )}
              >
                {error.severity}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono",
                  sourceColor(error.source)
                )}
              >
                {error.source}
              </span>
              <span className={cn("text-[11px] font-medium capitalize", statusColor(error.status))}>
                {error.status}
              </span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight break-words">{error.message}</h1>
            <p className="text-[12px] font-mono text-muted-foreground">{error.type}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-mono font-semibold tabular-nums">{error.count}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">events</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            First: {new Date(error.firstSeen).toLocaleString()}
          </span>
          <span>Last: {timeAgo(error.lastSeen)}</span>
          <span className="font-mono text-[11px]">fp: {error.fingerprint}</span>
        </div>

        {/* Status actions */}
        <div className="flex items-center gap-2 pt-1">
          <StatusButton
            label="Resolve"
            icon={Check}
            active={error.status === "resolved"}
            onClick={() => updateStatus("resolved")}
            variant="resolve"
          />
          <StatusButton
            label="Acknowledge"
            icon={Eye}
            active={error.status === "acknowledged"}
            onClick={() => updateStatus("acknowledged")}
            variant="acknowledge"
          />
          <StatusButton
            label="Ignore"
            icon={EyeOff}
            active={error.status === "ignored"}
            onClick={() => updateStatus("ignored")}
            variant="ignore"
          />
          {error.status !== "unresolved" && (
            <StatusButton
              label="Unresolve"
              icon={RotateCcw}
              active={false}
              onClick={() => updateStatus("unresolved")}
              variant="unresolve"
            />
          )}
        </div>
      </div>

      {/* Explanation */}
      {explanation && <ExplanationCard explanation={explanation} />}

      {/* Stack Trace */}
      {events.length > 0 && (events[0].stackFrames?.length || events[0].stack) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Stack Trace
            </span>
          </div>
          <StackTraceViewer event={events[0]} />
          {events[0].componentStack && (
            <div className="space-y-2 mt-3">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Component Stack
              </span>
              <pre className="text-[12px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed p-4 bg-muted/30 rounded-lg">
                {events[0].componentStack}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Event timeline */}
      {events.length > 0 && (
        <div className="bg-card/80 border border-border/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Event Timeline
            </span>
            <span className="text-[11px] font-mono text-muted-foreground/60">
              ({events.length})
            </span>
          </div>
          <EventTimeline events={events} />
        </div>
      )}
    </div>
  );
}
