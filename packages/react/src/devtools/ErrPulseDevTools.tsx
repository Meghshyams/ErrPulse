import React, { useEffect, useRef, useState } from "react";
import {
  type ErrPulseEvent,
  type LogEntry,
  type ErrorGroup,
  Severity,
  ERRORS_ENDPOINT,
} from "@errpulse/core";
import {
  subscribe,
  getEventHistory,
  getLogHistory,
  getRequestHistory,
  getEndpoint,
  type RequestLogData,
} from "../client.js";
import { DEVTOOLS_CSS } from "./styles.js";
import { icons } from "./icons.js";

export interface ErrPulseDevToolsProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialOpen?: boolean;
  enabled?: boolean;
}

type Tab = "errors" | "console" | "network";
type LogFilter = "all" | "log" | "info" | "warn" | "debug" | "error";

interface ServerErrorData {
  explanation_title?: string;
  explanation_text?: string;
  explanation_suggestion?: string;
  count?: number;
  status?: string;
}

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = "errpulse-devtools-pos";
const TRIGGER_SIZE = 46;
const PANEL_W = 420;
const PANEL_H = 520;
const GAP = 12;

function loadPosition(fallback: string): Position {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const p = JSON.parse(saved) as Position;
      if (typeof p.x === "number" && typeof p.y === "number") return clampPosition(p);
    }
  } catch {
    /* ignore */
  }
  return defaultPosition(fallback);
}

function savePosition(pos: Position): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function defaultPosition(corner: string): Position {
  const w = typeof window !== "undefined" ? window.innerWidth : 1024;
  const h = typeof window !== "undefined" ? window.innerHeight : 768;
  switch (corner) {
    case "bottom-left":
      return { x: 16, y: h - TRIGGER_SIZE - 16 };
    case "top-right":
      return { x: w - TRIGGER_SIZE - 16, y: 16 };
    case "top-left":
      return { x: 16, y: 16 };
    default:
      return { x: w - TRIGGER_SIZE - 16, y: h - TRIGGER_SIZE - 16 };
  }
}

function clampPosition(pos: Position): Position {
  const w = typeof window !== "undefined" ? window.innerWidth : 1024;
  const h = typeof window !== "undefined" ? window.innerHeight : 768;
  return {
    x: Math.max(0, Math.min(pos.x, w - TRIGGER_SIZE)),
    y: Math.max(0, Math.min(pos.y, h - TRIGGER_SIZE)),
  };
}

function panelStyle(trigger: Position): string {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  // Determine which side has more room
  const spaceRight = vw - trigger.x - TRIGGER_SIZE;
  const spaceLeft = trigger.x;
  const spaceBelow = vh - trigger.y - TRIGGER_SIZE;
  const spaceAbove = trigger.y;

  let px: number;
  let py: number;

  // Horizontal: align to whichever side of the trigger has more room
  if (spaceRight >= PANEL_W + GAP) {
    px = trigger.x + TRIGGER_SIZE + GAP;
  } else if (spaceLeft >= PANEL_W + GAP) {
    px = trigger.x - PANEL_W - GAP;
  } else {
    // Center horizontally, clamped
    px = Math.max(8, Math.min(trigger.x + TRIGGER_SIZE / 2 - PANEL_W / 2, vw - PANEL_W - 8));
  }

  // Vertical: open above or below trigger
  if (spaceAbove > spaceBelow) {
    py = Math.max(8, trigger.y - PANEL_H - GAP);
  } else {
    py = trigger.y + TRIGGER_SIZE + GAP;
  }
  py = Math.max(8, Math.min(py, vh - PANEL_H - 8));

  return `left:${px}px;top:${py}px`;
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

function timeAgo(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 1000) return "just now";
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3_600_000)}h ago`;
  } catch {
    return "";
  }
}

function truncateUrl(url: string, max = 50): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path.length > max ? path.slice(0, max) + "..." : path;
  } catch {
    return url.length > max ? url.slice(0, max) + "..." : url;
  }
}

function statusClass(code: number): string {
  if (code >= 500) return "server-error";
  if (code >= 400) return "client-error";
  return "success";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function objectPreview(obj: unknown, maxLen = 60): string {
  if (Array.isArray(obj)) {
    const inner = obj.map((v) => valuePreview(v)).join(", ");
    const full = `[${inner}]`;
    return full.length > maxLen ? `Array(${obj.length})` : full;
  }
  if (typeof obj === "object" && obj !== null) {
    const keys = Object.keys(obj);
    const inner = keys
      .slice(0, 3)
      .map((k) => `${k}: ${valuePreview((obj as Record<string, unknown>)[k])}`)
      .join(", ");
    const full = `{${inner}${keys.length > 3 ? ", ..." : ""}}`;
    return full.length > maxLen ? `{...} (${keys.length} keys)` : full;
  }
  return String(obj);
}

function valuePreview(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "string") return val.length > 30 ? `"${val.slice(0, 27)}..."` : `"${val}"`;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return `Array(${val.length})`;
  if (typeof val === "object") {
    const keys = Object.keys(val);
    return `{...} (${keys.length})`;
  }
  return String(val);
}

function renderJsonTree(val: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);

  if (val === null) return `<span class="ep-j-null">null</span>`;
  if (val === undefined) return `<span class="ep-j-null">undefined</span>`;
  if (typeof val === "string") return `<span class="ep-j-str">"${escapeHtml(val)}"</span>`;
  if (typeof val === "number") return `<span class="ep-j-num">${val}</span>`;
  if (typeof val === "boolean") return `<span class="ep-j-bool">${val}</span>`;

  if (Array.isArray(val)) {
    if (val.length === 0) return `<span class="ep-j-bracket">[]</span>`;
    const items = val
      .map(
        (v, i) =>
          `${padInner}<span class="ep-j-idx">${i}</span><span class="ep-j-colon">: </span>${renderJsonTree(v, indent + 1)}`
      )
      .join("\n");
    return `<span class="ep-j-bracket">[</span>\n${items}\n${pad}<span class="ep-j-bracket">]</span>`;
  }

  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return `<span class="ep-j-bracket">{}</span>`;
    const items = entries
      .map(
        ([k, v]) =>
          `${padInner}<span class="ep-j-key">${escapeHtml(k)}</span><span class="ep-j-colon">: </span>${renderJsonTree(v, indent + 1)}`
      )
      .join("\n");
    return `<span class="ep-j-bracket">{</span>\n${items}\n${pad}<span class="ep-j-bracket">}</span>`;
  }

  return escapeHtml(String(val));
}

function tryFormatBody(body: string): string {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === "object" && parsed !== null) {
      return `<pre class="ep-log-tree">${renderJsonTree(parsed)}</pre>`;
    }
  } catch {
    /* not JSON */
  }
  // Show as raw text
  return `<pre class="ep-log-tree">${escapeHtml(body)}</pre>`;
}

function findJsonStart(str: string): { index: number; parsed: unknown; end: number } | null {
  // Scan for the first `{` or `[` that starts valid JSON
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch !== "{" && ch !== "[") continue;
    // Try parsing from this position with increasing lengths
    const closer = ch === "{" ? "}" : "]";
    let depth = 0;
    for (let j = i; j < str.length; j++) {
      if (str[j] === ch) depth++;
      else if (str[j] === closer) depth--;
      if (depth === 0) {
        const candidate = str.slice(i, j + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (typeof parsed === "object" && parsed !== null) {
            return { index: i, parsed, end: j + 1 };
          }
        } catch {
          /* not valid JSON at this boundary, keep scanning */
        }
        break;
      }
    }
  }
  return null;
}

function formatLogMessage(raw: string, isExpanded: boolean): string {
  const found = findJsonStart(raw);
  if (!found) return escapeHtml(raw);

  const textBefore = raw.slice(0, found.index).trim();
  const textPart = textBefore ? `${escapeHtml(textBefore)} ` : "";

  if (!isExpanded) {
    return `${textPart}<span class="ep-j-preview">${escapeHtml(objectPreview(found.parsed))}</span>`;
  }

  return `${textPart}\n<pre class="ep-log-tree">${renderJsonTree(found.parsed)}</pre>`;
}

export function ErrPulseDevTools({
  position = "bottom-right",
  initialOpen = false,
  enabled,
}: ErrPulseDevToolsProps): React.ReactElement | null {
  const isDev =
    enabled ?? (typeof process !== "undefined" && process.env?.NODE_ENV !== "production");

  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  // Drag state (refs to avoid re-renders during drag)
  const dragRef = useRef({
    dragging: false,
    didDrag: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const triggerPosRef = useRef<Position>(loadPosition(position));

  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeTab, setActiveTab] = useState<Tab>("errors");
  const [errors, setErrors] = useState<ErrPulseEvent[]>(() => getEventHistory());
  const [logs, setLogs] = useState<LogEntry[]>(() => getLogHistory());
  const [requests, setRequests] = useState<RequestLogData[]>(() => getRequestHistory());
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [expandedReqs, setExpandedReqs] = useState<Set<string>>(new Set());
  const [isMaximized, setIsMaximized] = useState(false);
  const [serverData, setServerData] = useState<Record<string, ServerErrorData>>({});
  const [serverConnected, setServerConnected] = useState(false);

  // Subscribe to local events
  useEffect(() => {
    return subscribe({
      onError: (event) => setErrors((prev) => [...prev, event]),
      onLog: (entry) => setLogs((prev) => [...prev, entry]),
      onRequest: (entry) => setRequests((prev) => [...prev, entry]),
    });
  }, []);

  // Server enrichment when panel is open
  useEffect(() => {
    if (!isOpen) return;
    const endpoint = getEndpoint();
    if (!endpoint) return;

    let ws: WebSocket | null = null;
    let cancelled = false;

    async function fetchErrors() {
      try {
        const originalFetch =
          (window as unknown as { __errpulse_original_fetch?: typeof fetch })
            .__errpulse_original_fetch || fetch;
        const res = await originalFetch(`${endpoint}${ERRORS_ENDPOINT}?pageSize=100`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const map: Record<string, ServerErrorData> = {};
        for (const err of data.errors as ErrorGroup[]) {
          if (err.fingerprint) {
            map[err.fingerprint] = {
              explanation_title: (err as unknown as Record<string, string>).explanation_title,
              explanation_text: (err as unknown as Record<string, string>).explanation_text,
              explanation_suggestion: (err as unknown as Record<string, string>)
                .explanation_suggestion,
              count: err.count,
              status: err.status,
            };
          }
        }
        setServerData(map);
        setServerConnected(true);
      } catch {
        setServerConnected(false);
      }
    }

    fetchErrors();

    try {
      const wsUrl = endpoint.replace(/^http/, "ws") + "/ws";
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        if (!cancelled) setServerConnected(true);
      };
      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "new_error" || msg.type === "new_event") fetchErrors();
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        if (!cancelled) setServerConnected(false);
      };
      ws.onerror = () => {
        if (!cancelled) setServerConnected(false);
      };
    } catch {
      setServerConnected(false);
    }

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, [isOpen]);

  // Keyboard shortcut: Ctrl+Shift+E
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Recalculate position on window resize
  useEffect(() => {
    const handler = () => {
      triggerPosRef.current = clampPosition(triggerPosRef.current);
      renderToShadow();
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Attach shadow DOM once
  useEffect(() => {
    const host = hostRef.current;
    if (!host || mountedRef.current) return;
    mountedRef.current = true;

    const shadow = host.attachShadow({ mode: "open" });
    shadowRef.current = shadow;

    const style = document.createElement("style");
    style.textContent = DEVTOOLS_CSS;
    shadow.appendChild(style);

    const container = document.createElement("div");
    containerRef.current = container;
    shadow.appendChild(container);

    renderToShadow();
  }, []);

  // Drag handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trigger = target.closest(".ep-trigger") as HTMLElement | null;
      if (!trigger) return;

      e.preventDefault();
      const pos = triggerPosRef.current;
      dragRef.current = {
        dragging: true,
        didDrag: false,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - pos.x,
        offsetY: e.clientY - pos.y,
      };
      trigger.classList.add("ep-dragging");
    };

    const onMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.dragging) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.didDrag && Math.abs(dx) + Math.abs(dy) < 5) return;
      d.didDrag = true;

      const newPos = clampPosition({ x: e.clientX - d.offsetX, y: e.clientY - d.offsetY });
      triggerPosRef.current = newPos;

      // Move trigger element directly for smooth dragging (no React re-render)
      const trigger = container.querySelector(".ep-trigger") as HTMLElement | null;
      if (trigger) {
        trigger.style.left = `${newPos.x}px`;
        trigger.style.top = `${newPos.y}px`;
      }

      // Move panel if open
      const panel = container.querySelector(".ep-panel") as HTMLElement | null;
      if (panel) {
        const ps = panelStyle(newPos);
        ps.split(";").forEach((rule) => {
          const [k, v] = rule.split(":");
          if (k && v) panel.style.setProperty(k, v);
        });
      }
    };

    const onMouseUp = () => {
      const d = dragRef.current;
      if (!d.dragging) return;
      d.dragging = false;

      const trigger = container.querySelector(".ep-trigger") as HTMLElement | null;
      if (trigger) trigger.classList.remove("ep-dragging");

      if (d.didDrag) {
        savePosition(triggerPosRef.current);
        d.didDrag = false;
        renderToShadow();
      } else {
        // No drag — mousedown was on trigger, so this is a click → toggle
        setIsOpen((p) => !p);
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  });

  // Click delegation (for non-trigger actions)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: Event) => {
      // Skip if this was a drag release
      if (dragRef.current.didDrag) return;

      const target = e.target as HTMLElement;
      // Skip clicks on the trigger — handled by mouseup
      if (target.closest(".ep-trigger")) return;

      const actionEl = target.closest("[data-action]") as HTMLElement | null;
      if (actionEl) handleAction(actionEl);
    };

    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [activeTab]);

  // Touch support for mobile dragging
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const trigger = target.closest(".ep-trigger") as HTMLElement | null;
      if (!trigger) return;

      const touch = e.touches[0];
      const pos = triggerPosRef.current;
      dragRef.current = {
        dragging: true,
        didDrag: false,
        startX: touch.clientX,
        startY: touch.clientY,
        offsetX: touch.clientX - pos.x,
        offsetY: touch.clientY - pos.y,
      };
      trigger.classList.add("ep-dragging");
    };

    const onTouchMove = (e: TouchEvent) => {
      const d = dragRef.current;
      if (!d.dragging) return;

      const touch = e.touches[0];
      const dx = touch.clientX - d.startX;
      const dy = touch.clientY - d.startY;
      if (!d.didDrag && Math.abs(dx) + Math.abs(dy) < 5) return;
      d.didDrag = true;
      e.preventDefault();

      const newPos = clampPosition({ x: touch.clientX - d.offsetX, y: touch.clientY - d.offsetY });
      triggerPosRef.current = newPos;

      const trigger = container.querySelector(".ep-trigger") as HTMLElement | null;
      if (trigger) {
        trigger.style.left = `${newPos.x}px`;
        trigger.style.top = `${newPos.y}px`;
      }
      const panel = container.querySelector(".ep-panel") as HTMLElement | null;
      if (panel) {
        const ps = panelStyle(newPos);
        ps.split(";").forEach((rule) => {
          const [k, v] = rule.split(":");
          if (k && v) panel.style.setProperty(k, v);
        });
      }
    };

    const onTouchEnd = () => {
      const d = dragRef.current;
      if (!d.dragging) return;
      d.dragging = false;

      const trigger = container.querySelector(".ep-trigger") as HTMLElement | null;
      if (trigger) trigger.classList.remove("ep-dragging");

      if (d.didDrag) {
        savePosition(triggerPosRef.current);
        d.didDrag = false;
        renderToShadow();
      } else {
        setIsOpen((p) => !p);
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  });

  function handleAction(el: HTMLElement) {
    const action = el.dataset.action;
    switch (action) {
      case "toggle":
        setIsOpen((p) => !p);
        break;
      case "tab":
        setActiveTab(el.dataset.tab as Tab);
        break;
      case "expand-error":
        setExpandedError((prev) => {
          const id = el.dataset.id || "";
          return prev === id ? null : id;
        });
        break;
      case "expand-log":
        setExpandedLogs((prev) => {
          const next = new Set(prev);
          const id = el.dataset.id || "";
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        break;
      case "expand-req":
        setExpandedReqs((prev) => {
          const next = new Set(prev);
          const id = el.dataset.id || "";
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        break;
      case "filter":
        setLogFilter(el.dataset.filter as LogFilter);
        break;
      case "clear":
        if (activeTab === "errors") setErrors([]);
        else if (activeTab === "console") setLogs([]);
        else setRequests([]);
        break;
      case "maximize":
        setIsMaximized((p) => !p);
        break;
      case "dashboard": {
        const ep = getEndpoint();
        if (ep) window.open(ep, "_blank");
        break;
      }
    }
  }

  // Stable render function using refs
  function renderToShadow() {
    // Wrapped in setTimeout(0) so React state is settled
    setTimeout(() => renderToShadowSync(), 0);
  }

  // Render into shadow DOM on every state change
  useEffect(() => {
    renderToShadowSync();
  }, [
    isOpen,
    activeTab,
    errors,
    logs,
    requests,
    expandedError,
    expandedLogs,
    expandedReqs,
    isMaximized,
    logFilter,
    serverData,
    serverConnected,
    position,
  ]);

  function renderToShadowSync() {
    const container = containerRef.current;
    if (!container) return;

    const endpoint = getEndpoint();
    const errorCount = errors.length;
    const filteredLogs = logFilter === "all" ? logs : logs.filter((l) => l.level === logFilter);
    const pos = triggerPosRef.current;

    // --- Stable trigger element (create once, update in place) ---
    let trigger = container.querySelector(".ep-trigger") as HTMLElement | null;
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.className = "ep-trigger";
      trigger.dataset.action = "toggle";
      container.appendChild(trigger);
    }
    trigger.style.left = `${pos.x}px`;
    trigger.style.top = `${pos.y}px`;
    trigger.innerHTML = `${icons.logo}${errorCount > 0 ? `<span class="ep-badge">${errorCount > 99 ? "99+" : errorCount}</span>` : ""}`;

    // --- Stable panel element (create once, update content in place) ---
    let panel = container.querySelector(".ep-panel") as HTMLElement | null;

    if (!isOpen) {
      if (panel) panel.remove();
      return;
    }

    // Build content strings
    const errorItems = buildErrorItems(errors, expandedError, serverData);
    const logItems = buildLogItems(filteredLogs, expandedLogs);
    const requestItems = buildRequestItems(requests, expandedReqs);

    const filterButtons = (["all", "log", "info", "warn", "debug"] as LogFilter[])
      .map(
        (f) =>
          `<button class="ep-filter-btn ${logFilter === f ? "active" : ""}" data-action="filter" data-filter="${f}">${f}</button>`
      )
      .join("");

    const activeContent =
      activeTab === "errors"
        ? errorCount === 0
          ? `<div class="ep-empty">${icons.empty}<span>No errors captured yet</span></div>`
          : errorItems
        : activeTab === "console"
          ? filteredLogs.length === 0
            ? `<div class="ep-empty">${icons.empty}<span>No console logs captured</span></div>`
            : logItems
          : requests.length === 0
            ? `<div class="ep-empty">${icons.empty}<span>No network requests captured</span></div>`
            : requestItems;

    if (!panel) {
      // Create panel structure once
      panel = document.createElement("div");
      panel.className = "ep-panel";
      panel.innerHTML = `
        <div class="ep-header">
          <div class="ep-header-title">${icons.logo} ErrPulse DevTools</div>
          <div class="ep-header-actions">
            <button class="ep-header-btn" data-action="clear" title="Clear">${icons.clear}</button>
            <button class="ep-header-btn ep-maximize-btn" data-action="maximize" title="Expand"></button>
            <button class="ep-header-btn" data-action="toggle" title="Close">${icons.close}</button>
          </div>
        </div>
        <div class="ep-tabs"></div>
        <div class="ep-filters-slot"></div>
        <div class="ep-content"></div>
        <div class="ep-footer"></div>
      `;
      container.appendChild(panel);
    }

    // Toggle maximized class and icon
    panel.classList.toggle("ep-panel-maximized", isMaximized);
    const maxBtn = panel.querySelector(".ep-maximize-btn") as HTMLElement;
    if (maxBtn) {
      maxBtn.innerHTML = isMaximized ? icons.collapse : icons.expand;
      maxBtn.title = isMaximized ? "Collapse" : "Expand";
    }

    // Update panel position (skip when maximized — CSS handles it)
    if (!isMaximized) {
      const ps = panelStyle(pos);
      panel.style.cssText = "";
      ps.split(";").forEach((rule) => {
        const [k, v] = rule.split(":");
        if (k && v) panel!.style.setProperty(k.trim(), v.trim());
      });
    } else {
      panel.style.cssText = "";
    }

    // Update tabs
    const tabsEl = panel.querySelector(".ep-tabs") as HTMLElement;
    tabsEl.innerHTML = `
      <button class="ep-tab ${activeTab === "errors" ? "active" : ""}" data-action="tab" data-tab="errors">
        ${icons.errors} Errors ${errorCount > 0 ? `<span class="ep-tab-count">${errorCount}</span>` : ""}
      </button>
      <button class="ep-tab ${activeTab === "console" ? "active" : ""}" data-action="tab" data-tab="console">
        ${icons.console} Console ${logs.length > 0 ? `<span class="ep-tab-count">${logs.length}</span>` : ""}
      </button>
      <button class="ep-tab ${activeTab === "network" ? "active" : ""}" data-action="tab" data-tab="network">
        ${icons.network} Network ${requests.length > 0 ? `<span class="ep-tab-count">${requests.length}</span>` : ""}
      </button>
    `;

    // Update filters slot (only show for console tab)
    const filtersSlot = panel.querySelector(".ep-filters-slot") as HTMLElement;
    filtersSlot.innerHTML =
      activeTab === "console" ? `<div class="ep-filters">${filterButtons}</div>` : "";

    // Update content — preserve scroll position
    const contentEl = panel.querySelector(".ep-content") as HTMLElement;
    const scrollTop = contentEl.scrollTop;
    contentEl.innerHTML = activeContent;
    contentEl.scrollTop = scrollTop;

    // Update footer
    const footerEl = panel.querySelector(".ep-footer") as HTMLElement;
    footerEl.innerHTML = `
      <div class="ep-server-status" title="${serverConnected ? "Connected to ErrPulse server at " + escapeHtml(endpoint || "") : "ErrPulse server not running. Start it with: npx errpulse"}">
        <span class="ep-status-dot ${serverConnected ? "connected" : "disconnected"}"></span>
        ${
          serverConnected
            ? "Server connected"
            : `<span class="ep-server-hint">Server offline — <code>npx errpulse</code></span>`
        }
      </div>
      ${endpoint && serverConnected ? `<button class="ep-footer-link" data-action="dashboard">Dashboard ${icons.externalLink}</button>` : ""}
    `;
  }

  if (!isDev) return null;

  return (
    <div
      ref={hostRef}
      id="errpulse-devtools"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        overflow: "visible",
        zIndex: 2147483647,
      }}
    />
  );
}

function buildErrorItems(
  errors: ErrPulseEvent[],
  expandedError: string | null,
  serverData: Record<string, ServerErrorData>
): string {
  return errors
    .slice()
    .reverse()
    .map((e) => {
      const severityType =
        e.severity === Severity.Error || e.severity === Severity.Fatal
          ? "error"
          : e.severity === Severity.Warning
            ? "warning"
            : "info";
      const isExpanded = expandedError === e.eventId;
      const explanationHtml = buildExplanation(e, serverData);
      const serverInfo = e.fingerprint ? serverData[e.fingerprint] : null;

      let detailHtml = "";
      if (isExpanded) {
        const metaRows: string[] = [];
        metaRows.push(
          `<div class="ep-detail-row"><span class="ep-detail-label">Type</span><span class="ep-detail-value">${escapeHtml(e.type.replace(/_/g, " "))}</span></div>`
        );
        metaRows.push(
          `<div class="ep-detail-row"><span class="ep-detail-label">Severity</span><span class="ep-detail-value"><span class="ep-severity-tag ep-sev-${severityType}">${e.severity}</span></span></div>`
        );
        metaRows.push(
          `<div class="ep-detail-row"><span class="ep-detail-label">Time</span><span class="ep-detail-value">${formatTime(e.timestamp)}</span></div>`
        );
        if (e.environment?.url)
          metaRows.push(
            `<div class="ep-detail-row"><span class="ep-detail-label">Page</span><span class="ep-detail-value ep-detail-url">${escapeHtml(e.environment.url)}</span></div>`
          );
        if (e.request?.method)
          metaRows.push(
            `<div class="ep-detail-row"><span class="ep-detail-label">Request</span><span class="ep-detail-value"><span class="ep-req-method">${e.request.method}</span> ${escapeHtml(e.request.url || "")}</span></div>`
          );
        if (e.request?.statusCode)
          metaRows.push(
            `<div class="ep-detail-row"><span class="ep-detail-label">Status</span><span class="ep-detail-value"><span class="ep-req-status ${statusClass(e.request.statusCode)}">${e.request.statusCode}</span></span></div>`
          );
        if (serverInfo?.count && serverInfo.count > 1)
          metaRows.push(
            `<div class="ep-detail-row"><span class="ep-detail-label">Occurrences</span><span class="ep-detail-value">${serverInfo.count} times</span></div>`
          );
        if (serverInfo?.status)
          metaRows.push(
            `<div class="ep-detail-row"><span class="ep-detail-label">Status</span><span class="ep-detail-value">${serverInfo.status}</span></div>`
          );
        if (e.componentStack)
          metaRows.push(
            `<div class="ep-detail-row"><span class="ep-detail-label">Component</span><span class="ep-detail-value ep-detail-url">${escapeHtml(e.componentStack.split("\\n")[0].trim())}</span></div>`
          );

        detailHtml = `<div class="ep-detail">
        <div class="ep-detail-meta">${metaRows.join("")}</div>
        ${explanationHtml}
        ${e.stack ? `<div class="ep-detail-section-label">Stack Trace</div><div class="ep-stack">${escapeHtml(e.stack)}</div>` : ""}
      </div>`;
      }

      return `
      <div class="ep-item ${isExpanded ? "ep-item-expanded" : ""}" data-action="expand-error" data-id="${e.eventId}">
        <div class="ep-item-header">
          <div class="ep-severity ${e.severity}"></div>
          <div class="ep-item-message">${escapeHtml(e.message)}</div>
        </div>
        <div class="ep-item-meta">
          <span class="ep-item-type ep-type-${severityType}">${escapeHtml(e.type.replace(/_/g, " "))}</span>
          <span class="ep-item-time">${timeAgo(e.timestamp)}</span>
        </div>
        ${detailHtml}
      </div>
    `;
    })
    .join("");
}

function buildLogItems(filteredLogs: LogEntry[], expandedLogs: Set<string>): string {
  return filteredLogs
    .slice()
    .reverse()
    .map((l) => {
      const isLogExpanded = expandedLogs.has(l.id);
      const hasObject = findJsonStart(l.message) !== null;
      return `
      <div class="ep-log-item ${isLogExpanded ? "ep-log-expanded" : ""} ${hasObject ? "ep-log-clickable" : ""}" ${hasObject ? `data-action="expand-log" data-id="${l.id}"` : ""}>
        <span class="ep-log-level ${l.level}">${l.level}</span>
        <div class="ep-log-body">
          <span class="ep-log-message">${formatLogMessage(l.message, isLogExpanded)}</span>
          ${hasObject ? `<span class="ep-log-expand-hint">${isLogExpanded ? "collapse" : "expand"}</span>` : ""}
        </div>
        <span class="ep-log-time">${formatTime(l.timestamp)}</span>
      </div>
    `;
    })
    .join("");
}

function buildRequestItems(requests: RequestLogData[], expandedReqs: Set<string>): string {
  return requests
    .slice()
    .reverse()
    .map((r, i) => {
      const reqId = `req-${i}-${r.timestamp}`;
      const isReqExpanded = expandedReqs.has(reqId);

      let detailHtml = "";
      if (isReqExpanded) {
        const sections: string[] = [];
        const metaRows = [
          `<div class="ep-detail-row"><span class="ep-detail-label">URL</span><span class="ep-detail-value ep-detail-url">${escapeHtml(r.url)}</span></div>`,
          `<div class="ep-detail-row"><span class="ep-detail-label">Method</span><span class="ep-detail-value">${r.method}</span></div>`,
          `<div class="ep-detail-row"><span class="ep-detail-label">Status</span><span class="ep-detail-value"><span class="ep-req-status ${statusClass(r.statusCode)}">${r.statusCode}</span></span></div>`,
          `<div class="ep-detail-row"><span class="ep-detail-label">Duration</span><span class="ep-detail-value">${r.duration}ms</span></div>`,
          `<div class="ep-detail-row"><span class="ep-detail-label">Time</span><span class="ep-detail-value">${formatTime(r.timestamp)}</span></div>`,
        ];
        if (r.correlationId)
          metaRows.push(
            `<div class="ep-detail-row"><span class="ep-detail-label">Correlation</span><span class="ep-detail-value">${escapeHtml(r.correlationId)}</span></div>`
          );
        sections.push(`<div class="ep-detail-meta">${metaRows.join("")}</div>`);
        if (r.headers && Object.keys(r.headers).length > 0)
          sections.push(
            `<div class="ep-detail-section-label">Request Headers</div><pre class="ep-log-tree">${renderJsonTree(r.headers)}</pre>`
          );
        if (r.requestBody)
          sections.push(
            `<div class="ep-detail-section-label">Request Body</div>${tryFormatBody(r.requestBody)}`
          );
        if (r.responseHeaders && Object.keys(r.responseHeaders).length > 0)
          sections.push(
            `<div class="ep-detail-section-label">Response Headers</div><pre class="ep-log-tree">${renderJsonTree(r.responseHeaders)}</pre>`
          );
        if (r.responseBody)
          sections.push(
            `<div class="ep-detail-section-label">Response Body</div>${tryFormatBody(r.responseBody)}`
          );
        detailHtml = `<div class="ep-detail">${sections.join("")}</div>`;
      }

      return `
      <div class="ep-req-item ${isReqExpanded ? "ep-req-expanded" : ""}" data-action="expand-req" data-id="${reqId}">
        <div class="ep-req-row">
          <span class="ep-req-method">${r.method}</span>
          <span class="ep-req-url">${escapeHtml(truncateUrl(r.url))}</span>
          <span class="ep-req-status ${statusClass(r.statusCode)}">${r.statusCode}</span>
          <span class="ep-req-duration">${r.duration}ms</span>
        </div>
        <div class="ep-item-meta">
          <span class="ep-item-time">${formatTime(r.timestamp)}</span>
        </div>
        ${detailHtml}
      </div>
    `;
    })
    .join("");
}

function buildExplanation(
  event: ErrPulseEvent,
  serverData: Record<string, ServerErrorData>
): string {
  const data = event.fingerprint ? serverData[event.fingerprint] : null;
  if (!data?.explanation_title) return "";
  return `
    <div class="ep-explanation">
      <div class="ep-explanation-title">${escapeHtml(data.explanation_title)}</div>
      <div class="ep-explanation-text">${escapeHtml(data.explanation_text || "")}</div>
      ${data.explanation_suggestion ? `<div class="ep-explanation-suggestion">${escapeHtml(data.explanation_suggestion)}</div>` : ""}
    </div>
  `;
}
