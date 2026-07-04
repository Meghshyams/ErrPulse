import type { ErrorGroup } from "@errpulse/core";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";

const MAX_MESSAGE_LENGTH = 300;

export interface RequestLogPayload {
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  source?: string;
}

function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "fatal":
    case "error":
      return RED;
    case "warning":
      return YELLOW;
    default:
      return CYAN;
  }
}

function time(): string {
  return `${DIM}${new Date().toLocaleTimeString("en-GB")}${RESET}`;
}

function truncate(text: string): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length > MAX_MESSAGE_LENGTH
    ? singleLine.slice(0, MAX_MESSAGE_LENGTH) + "…"
    : singleLine;
}

interface ParsedExplanation {
  title?: string;
  suggestion?: string;
}

// The server stores the explanation as a JSON-stringified object; be
// defensive in case the shape changes or it's plain text.
function parseExplanation(raw?: string): ParsedExplanation | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { title: parsed.title, suggestion: parsed.suggestion };
    }
  } catch {
    return { title: raw };
  }
  return null;
}

export function formatNewError(group: ErrorGroup): string {
  const color = severityColor(group.severity);
  const project = group.projectId ? ` ${DIM}(${group.projectId})${RESET}` : "";
  const source = group.source ? `${BOLD}[${group.source}]${RESET} ` : "";

  let line = `${time()} ${color}✖ ${group.severity.toUpperCase()}${RESET} ${source}${color}${group.type}${RESET}: ${truncate(group.message)}${project}`;

  const explanation = parseExplanation(group.explanation);
  if (explanation?.title) {
    line += `\n           ${DIM}↳ ${explanation.title}`;
    if (explanation.suggestion) line += ` — ${truncate(explanation.suggestion)}`;
    line += RESET;
  }

  return line;
}

export function formatRecurrence(group: ErrorGroup): string {
  const color = severityColor(group.severity);
  return `${time()} ${color}↻${RESET} ${DIM}${group.type}: ${truncate(group.message)}${RESET} ${BOLD}×${group.count}${RESET}`;
}

export function formatFailedRequest(payload: RequestLogPayload): string | null {
  const status = payload.statusCode ?? 0;
  if (status !== 0 && status < 400) return null;

  const color = status === 0 || status >= 500 ? RED : YELLOW;
  const statusLabel = status === 0 ? "FAILED" : String(status);
  const duration = payload.duration != null ? ` ${DIM}(${payload.duration}ms)${RESET}` : "";
  const source = payload.source ? `${BOLD}[${payload.source}]${RESET} ` : "";

  return `${time()} ${color}⇢ ${statusLabel}${RESET} ${source}${payload.method ?? "GET"} ${truncate(payload.url ?? "")}${duration}`;
}

export function formatStatus(text: string, ok = true): string {
  const color = ok ? GREEN : YELLOW;
  return `${time()} ${color}●${RESET} ${DIM}${text}${RESET}`;
}
