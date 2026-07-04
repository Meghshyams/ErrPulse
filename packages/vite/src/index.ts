import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Plugin } from "vite";

export type CorrelationTarget = string | RegExp;

export interface ErrPulseVitePluginOptions {
  /** ErrPulse server URL. Default: http://localhost:3800 */
  endpoint?: string;
  /** Project ID shown in the dashboard. Default: the app's package.json name */
  projectId?: string;
  /** Capture console.error calls as error events. Default: true */
  captureConsoleErrors?: boolean;
  /** Capture console.log/warn/info/debug as log entries. Default: false */
  captureConsoleLogs?: boolean;
  /** Intercept fetch to log requests and report failures. Default: true */
  captureFetch?: boolean;
  /** Intercept XMLHttpRequest to report failures. Default: true */
  captureXHR?: boolean;
  /** Capture resource load failures (img, script, css). Default: true */
  captureResourceErrors?: boolean;
  /**
   * URLs to send the X-ErrPulse-Correlation-ID header to. Strings match as
   * substrings, RegExps are tested against the full URL. Defaults to
   * same-origin requests and localhost targets.
   */
  correlationPropagationTargets?: CorrelationTarget[];
}

const VIRTUAL_ID = "virtual:errpulse";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

/** Serialize plugin options into a JS expression (RegExps become literals). */
export function serializeOptions(options: Record<string, unknown>): string {
  const entries = Object.entries(options)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${JSON.stringify(key)}: ${serializeValue(value)}`);
  return `{ ${entries.join(", ")} }`;
}

function serializeValue(value: unknown): string {
  if (value instanceof RegExp) return value.toString();
  if (Array.isArray(value)) return `[${value.map(serializeValue).join(", ")}]`;
  return JSON.stringify(value);
}

function readPackageName(root: string): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    return typeof pkg.name === "string" ? pkg.name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * ErrPulse Vite plugin — injects browser error monitoring into the app
 * during `vite dev`. No SDK install, no provider, works with any framework.
 * Never included in production builds (`apply: "serve"`).
 */
export default function errpulse(options: ErrPulseVitePluginOptions = {}): Plugin {
  let initCode = "";

  return {
    name: "errpulse",
    apply: "serve",

    config() {
      // The injected module imports @errpulse/browser by absolute path;
      // keep it out of esbuild pre-bundling so Vite serves it directly.
      return { optimizeDeps: { exclude: ["@errpulse/browser"] } };
    },

    configResolved(config) {
      const projectId = options.projectId ?? readPackageName(config.root) ?? basename(config.root);
      // Resolve from this plugin's own location — works under pnpm's strict
      // node_modules where the user's app can't resolve transitive deps.
      // require.resolve returns the CJS entry; prefer the ESM sibling.
      let browserEntry = createRequire(import.meta.url).resolve("@errpulse/browser");
      const esmEntry = browserEntry.replace(/index\.cjs$/, "index.js");
      if (esmEntry !== browserEntry && existsSync(esmEntry)) browserEntry = esmEntry;
      initCode =
        `import { init } from ${JSON.stringify(browserEntry)};\n` +
        `init(${serializeOptions({ ...options, projectId })});\n`;
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id === RESOLVED_ID) return initCode;
    },

    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "module", src: "/@id/__x00__" + VIRTUAL_ID },
          // head-prepend so interceptors install before the app's code runs
          injectTo: "head-prepend" as const,
        },
      ];
    },
  };
}
