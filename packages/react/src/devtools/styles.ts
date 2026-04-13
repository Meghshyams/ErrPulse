export const DEVTOOLS_CSS = /* css */ `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #fafafa;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    --bg: #09090b;
    --bg-card: #0c0c0e;
    --bg-surface: #111113;
    --bg-hover: rgba(255, 255, 255, 0.04);
    --bg-active: rgba(255, 255, 255, 0.06);
    --border: rgba(255, 255, 255, 0.08);
    --border-strong: rgba(255, 255, 255, 0.12);
    --fg: #fafafa;
    --fg-secondary: #a1a1aa;
    --fg-muted: #52525b;
    --primary: #f43f5e;
    --primary-soft: #ff6b8a;
    --red: #ef4444;
    --red-dim: rgba(239, 68, 68, 0.12);
    --orange: #f97316;
    --orange-dim: rgba(249, 115, 22, 0.12);
    --yellow: #eab308;
    --yellow-dim: rgba(234, 179, 8, 0.12);
    --blue: #3b82f6;
    --blue-dim: rgba(59, 130, 246, 0.12);
    --green: #22c55e;
    --green-dim: rgba(34, 197, 94, 0.12);
    --gray-dim: rgba(255, 255, 255, 0.06);
    --mono: 'SF Mono', SFMono-Regular, ui-monospace, Consolas, 'Liberation Mono', Menlo, monospace;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Floating trigger ── */

  @keyframes ep-pulse-draw {
    0% { stroke-dashoffset: 60; }
    50% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -60; }
  }

  .ep-trigger {
    position: fixed;
    z-index: 2147483647;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid var(--border-strong);
    background: var(--bg);
    color: var(--fg);
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2);
    transition: box-shadow 0.15s, border-color 0.15s;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: auto;
    touch-action: none;
  }
  .ep-trigger:hover {
    border-color: rgba(244, 63, 94, 0.4);
    box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(244, 63, 94, 0.15);
  }
  .ep-trigger.ep-dragging {
    cursor: grabbing;
    border-color: rgba(244, 63, 94, 0.5);
    box-shadow: 0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(244, 63, 94, 0.2);
  }
  .ep-trigger .ep-logo-icon {
    width: 24px;
    height: 24px;
    pointer-events: none;
  }
  .ep-trigger .ep-pulse-line {
    stroke-dasharray: 60;
    stroke-dashoffset: 0;
  }
  .ep-trigger:hover .ep-pulse-line {
    animation: ep-pulse-draw 2s ease-in-out infinite;
  }

  .ep-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--primary);
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    pointer-events: none;
    border: 2px solid var(--bg);
  }

  /* ── Panel ── */

  .ep-panel {
    position: fixed;
    z-index: 2147483646;
    width: 420px;
    max-width: calc(100vw - 24px);
    height: 520px;
    max-height: calc(100vh - 80px);
    border-radius: 12px;
    border: 1px solid var(--border-strong);
    background: var(--bg);
    box-shadow: 0 16px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    pointer-events: auto;
    transition: all 0.2s ease;
  }
  .ep-panel.ep-panel-maximized {
    top: 16px !important;
    left: 16px !important;
    right: 16px;
    bottom: 16px;
    width: calc(100vw - 32px) !important;
    height: calc(100vh - 32px) !important;
    max-width: none !important;
    max-height: none !important;
    border-radius: 16px;
  }

  /* ── Header ── */

  .ep-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    height: 44px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    flex-shrink: 0;
  }
  .ep-header-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--fg);
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: -0.01em;
  }
  .ep-header-title .ep-logo-icon {
    width: 20px;
    height: 20px;
  }
  .ep-header-actions {
    display: flex;
    align-items: center;
    gap: 1px;
  }
  .ep-header-btn {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--fg-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.1s, background 0.1s;
  }
  .ep-header-btn:hover {
    background: var(--bg-hover);
    color: var(--fg-secondary);
  }
  .ep-header-btn svg {
    width: 14px;
    height: 14px;
  }

  /* ── Tabs ── */

  .ep-tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    flex-shrink: 0;
    padding: 0 4px;
  }
  .ep-tab {
    flex: 1;
    padding: 10px 0 8px;
    border: none;
    background: transparent;
    color: var(--fg-muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-bottom: 2px solid transparent;
    transition: color 0.1s;
    font-family: inherit;
    letter-spacing: -0.01em;
  }
  .ep-tab svg { flex-shrink: 0; }
  .ep-tab:hover { color: var(--fg-secondary); }
  .ep-tab.active {
    color: var(--fg);
    border-bottom-color: var(--fg);
  }
  .ep-tab-count {
    font-size: 10px;
    font-weight: 600;
    padding: 0 5px;
    height: 16px;
    border-radius: 8px;
    background: var(--bg-active);
    color: var(--fg-muted);
    display: inline-flex;
    align-items: center;
    font-family: var(--mono);
  }
  .ep-tab.active .ep-tab-count {
    background: var(--fg);
    color: var(--bg);
  }

  /* ── Content area ── */

  .ep-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg-card);
  }
  .ep-content::-webkit-scrollbar { width: 4px; height: 4px; }
  .ep-content::-webkit-scrollbar-track { background: transparent; }
  .ep-content::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }

  /* Global scrollbar styling for all scrollable elements */
  *::-webkit-scrollbar { width: 4px; height: 4px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
  *::-webkit-scrollbar-thumb:hover { background: var(--fg-muted); }
  *::-webkit-scrollbar-corner { background: transparent; }

  .ep-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--fg-muted);
    gap: 8px;
    padding: 40px;
    text-align: center;
    font-size: 12px;
  }
  .ep-empty svg { opacity: 0.3; }

  /* ── Error items ── */

  .ep-item {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.1s;
  }
  .ep-item:hover { background: var(--bg-hover); }
  .ep-item:last-child { border-bottom: none; }

  .ep-item-header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 3px;
  }
  .ep-severity {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
  }
  .ep-severity.fatal, .ep-severity.error { background: var(--red); box-shadow: 0 0 6px var(--red-dim); }
  .ep-severity.warning { background: var(--orange); }
  .ep-severity.info { background: var(--blue); }

  .ep-item-message {
    font-size: 12px;
    color: var(--fg);
    font-weight: 500;
    word-break: break-word;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    letter-spacing: -0.01em;
  }
  .ep-item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--fg-muted);
    margin-top: 2px;
    padding-left: 14px;
  }
  .ep-item-type {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 500;
    font-family: var(--mono);
    letter-spacing: 0.02em;
  }
  .ep-type-error { background: var(--red-dim); color: var(--red); }
  .ep-type-warning { background: var(--orange-dim); color: var(--orange); }
  .ep-type-info { background: var(--blue-dim); color: var(--blue); }

  .ep-item-time {
    margin-left: auto;
    white-space: nowrap;
    font-family: var(--mono);
    font-size: 10px;
  }

  .ep-item-expanded { background: var(--bg-surface); }
  .ep-item-expanded .ep-item-message {
    -webkit-line-clamp: unset;
    display: block;
  }

  /* ── Error detail ── */

  .ep-detail { padding: 8px 0 4px 0; }

  .ep-detail-meta {
    margin-bottom: 8px;
    padding: 6px 10px;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .ep-detail-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 3px 0;
    font-size: 11px;
    border-bottom: 1px solid var(--border);
  }
  .ep-detail-row:last-child { border-bottom: none; }
  .ep-detail-label {
    color: var(--fg-muted);
    min-width: 72px;
    flex-shrink: 0;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.05em;
  }
  .ep-detail-value {
    color: var(--fg-secondary);
    word-break: break-all;
    font-family: var(--mono);
    font-size: 11px;
  }
  .ep-detail-url { color: var(--blue); }
  .ep-severity-tag {
    font-size: 10px;
    font-weight: 500;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: var(--mono);
  }
  .ep-sev-error { background: var(--red-dim); color: var(--red); }
  .ep-sev-warning { background: var(--orange-dim); color: var(--orange); }
  .ep-sev-info { background: var(--blue-dim); color: var(--blue); }
  .ep-detail-section-label {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted);
    margin: 10px 0 4px;
  }

  .ep-explanation {
    margin: 8px 0;
    padding: 8px 10px;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border);
    border-left: 2px solid var(--primary);
    font-size: 12px;
  }
  .ep-explanation-title {
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 4px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ep-explanation-text {
    color: var(--fg-secondary);
    line-height: 1.5;
    font-size: 12px;
  }
  .ep-explanation-suggestion {
    margin-top: 6px;
    color: var(--green);
    font-size: 11px;
  }

  .ep-stack {
    margin: 4px 0;
    padding: 8px 10px;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border);
    font-family: var(--mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--fg-secondary);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 180px;
    overflow-y: auto;
  }

  /* ── Console log items ── */

  .ep-log-item {
    padding: 6px 14px;
    border-bottom: 1px solid var(--border);
    font-family: var(--mono);
    font-size: 11px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.5;
  }
  .ep-log-item:last-child { border-bottom: none; }
  .ep-log-level {
    flex-shrink: 0;
    font-size: 9px;
    font-weight: 600;
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: uppercase;
    margin-top: 1px;
    font-family: inherit;
    letter-spacing: 0.02em;
  }
  .ep-log-level.log { background: var(--gray-dim); color: var(--fg-muted); }
  .ep-log-level.info { background: var(--blue-dim); color: var(--blue); }
  .ep-log-level.warn { background: var(--yellow-dim); color: var(--yellow); }
  .ep-log-level.debug { background: var(--green-dim); color: var(--green); }
  .ep-log-level.error { background: var(--red-dim); color: var(--red); }
  .ep-log-body { flex: 1; min-width: 0; }
  .ep-log-message {
    color: var(--fg);
    word-break: break-word;
    white-space: pre-wrap;
  }
  .ep-log-clickable {
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.1s;
  }
  .ep-log-clickable:hover { background: var(--bg-hover); }
  .ep-log-expanded {
    background: var(--bg-surface);
    padding-bottom: 8px;
  }
  .ep-log-expand-hint {
    display: inline-block;
    font-size: 9px;
    color: var(--fg-muted);
    margin-left: 6px;
    opacity: 0;
    transition: opacity 0.1s;
  }
  .ep-log-clickable:hover .ep-log-expand-hint { opacity: 1; }

  .ep-j-preview { color: var(--fg-muted); }

  .ep-log-tree {
    display: block;
    margin: 6px 0 2px;
    padding: 8px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 11px;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre;
    font-family: inherit;
  }
  .ep-j-key { color: #c4b5fd; }
  .ep-j-idx { color: #818cf8; }
  .ep-j-str { color: #86efac; }
  .ep-j-num { color: #93c5fd; }
  .ep-j-bool { color: #fbbf24; }
  .ep-j-null { color: var(--fg-muted); font-style: italic; }
  .ep-j-bracket { color: var(--fg-muted); }
  .ep-j-colon { color: #3f3f46; }

  .ep-log-time {
    flex-shrink: 0;
    color: var(--fg-muted);
    font-size: 10px;
    font-family: inherit;
  }

  /* ── Network/Request items ── */

  .ep-req-item {
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.1s;
  }
  .ep-req-item:hover { background: var(--bg-hover); }
  .ep-req-item:last-child { border-bottom: none; }
  .ep-req-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ep-req-method {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--bg-active);
    color: var(--fg);
    font-family: var(--mono);
    letter-spacing: 0.02em;
  }
  .ep-req-url {
    font-size: 12px;
    color: var(--fg);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--mono);
    font-size: 11px;
  }
  .ep-req-status {
    font-size: 11px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    font-family: var(--mono);
  }
  .ep-req-status.success { background: var(--green-dim); color: var(--green); }
  .ep-req-status.client-error { background: var(--orange-dim); color: var(--orange); }
  .ep-req-status.server-error { background: var(--red-dim); color: var(--red); }
  .ep-req-duration {
    font-size: 11px;
    color: var(--fg-muted);
    white-space: nowrap;
    font-family: var(--mono);
  }
  .ep-req-expanded { background: var(--bg-surface); }
  .ep-req-expanded .ep-req-url {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }

  /* ── Console filters ── */

  .ep-filters {
    display: flex;
    gap: 2px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    flex-shrink: 0;
  }
  .ep-filter-btn {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--fg-muted);
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
    font-family: inherit;
  }
  .ep-filter-btn:hover {
    background: var(--bg-hover);
    color: var(--fg-secondary);
  }
  .ep-filter-btn.active {
    background: var(--fg);
    color: var(--bg);
  }

  /* ── Footer ── */

  .ep-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    height: 36px;
    border-top: 1px solid var(--border);
    background: var(--bg);
    flex-shrink: 0;
  }
  .ep-footer-link {
    font-size: 11px;
    color: var(--fg-secondary);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    background: none;
    border: none;
    font-family: inherit;
    transition: color 0.1s;
  }
  .ep-footer-link:hover { color: var(--fg); }
  .ep-footer-link svg { width: 12px; height: 12px; }
  .ep-server-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--fg-muted);
  }
  .ep-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .ep-status-dot.connected { background: var(--green); }
  .ep-status-dot.disconnected { background: var(--orange); }
  .ep-server-hint {
    font-size: 10px;
    color: var(--fg-muted);
  }
  .ep-server-hint code {
    font-family: var(--mono);
    background: var(--bg-active);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 10px;
    color: var(--fg-secondary);
  }
`;
