import { LogLevel, ErrorSource, generateEventId } from "@errpulse/core";
import { enqueueLog } from "../client.js";
import { getEnvironment } from "../helpers/environment.js";
import { getCorrelationId } from "../helpers/correlation.js";

let originals: {
  log: typeof console.log;
  warn: typeof console.warn;
  info: typeof console.info;
  debug: typeof console.debug;
} | null = null;

export function installConsoleLogInterceptor(): () => void {
  if (originals) return () => {};

  originals = {
    log: console.log,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  function intercept(
    level: LogLevel,
    original: (...args: unknown[]) => void
  ): (...args: unknown[]) => void {
    return (...args: unknown[]) => {
      original.apply(console, args);

      try {
        const message = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");

        enqueueLog({
          id: generateEventId(),
          level,
          message,
          timestamp: new Date().toISOString(),
          source: ErrorSource.Backend,
          environment: getEnvironment(),
          correlationId: getCorrelationId(),
        });
      } catch {
        // Never crash the host app
      }
    };
  }

  console.log = intercept(LogLevel.Log, originals.log);
  console.warn = intercept(LogLevel.Warn, originals.warn);
  console.info = intercept(LogLevel.Info, originals.info);
  console.debug = intercept(LogLevel.Debug, originals.debug);

  return () => {
    if (originals) {
      console.log = originals.log;
      console.warn = originals.warn;
      console.info = originals.info;
      console.debug = originals.debug;
      originals = null;
    }
  };
}
