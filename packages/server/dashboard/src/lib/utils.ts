import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "fatal":
      return "text-red-400 bg-red-400/10";
    case "error":
      return "text-red-400 bg-red-400/10";
    case "warning":
      return "text-amber-400 bg-amber-400/10";
    case "info":
      return "text-blue-400 bg-blue-400/10";
    default:
      return "text-zinc-400 bg-zinc-400/10";
  }
}

export function sourceColor(source: string): string {
  switch (source) {
    case "backend":
      return "text-emerald-400 bg-emerald-400/10";
    case "frontend":
      return "text-violet-400 bg-violet-400/10";
    default:
      return "text-zinc-400 bg-zinc-400/10";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "unresolved":
      return "text-red-400";
    case "acknowledged":
      return "text-amber-400";
    case "resolved":
      return "text-emerald-400";
    case "ignored":
      return "text-zinc-500";
    default:
      return "text-zinc-400";
  }
}
