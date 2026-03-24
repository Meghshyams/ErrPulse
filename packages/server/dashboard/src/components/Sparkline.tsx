import { cn } from "../lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({ data, width = 64, height = 20, className }: SparklineProps) {
  if (data.length === 0 || data.every((d) => d === 0)) {
    return (
      <div
        className={cn("flex items-center justify-center text-muted-foreground/30", className)}
        style={{ width, height }}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        </svg>
      </div>
    );
  }

  const max = Math.max(...data, 1);
  const padding = 2;
  const innerH = height - padding * 2;
  const step = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => {
    const x = padding + i * step;
    const y = padding + innerH - (v / max) * innerH;
    return `${x},${y}`;
  });

  const pathD = `M${points.join(" L")}`;

  // Area fill
  const areaD = `${pathD} L${padding + (data.length - 1) * step},${height} L${padding},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGradient)" />
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
