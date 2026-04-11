import { LogLevel, ErrorSource, generateEventId } from "@errpulse/core";
import { enqueueLog } from "../client.js";

export function installConsoleLogInterceptor(): () => void {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  function intercept(level: LogLevel, original: (...args: unknown[]) => void) {
    return (...args: unknown[]) => {
      original.apply(console, args);

      try {
        const message = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");

        enqueueLog({
          id: generateEventId(),
          level,
          message,
          timestamp: new Date().toISOString(),
          source: ErrorSource.Frontend,
          environment: {
            runtime: "browser",
            browser: navigator.userAgent,
            url: window.location.href,
          },
        });
      } catch {
        // Never crash the host app
      }
    };
  }

  console.log = intercept(LogLevel.Log, originalLog);
  console.warn = intercept(LogLevel.Warn, originalWarn);
  console.info = intercept(LogLevel.Info, originalInfo);
  console.debug = intercept(LogLevel.Debug, originalDebug);

  return () => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.info = originalInfo;
    console.debug = originalDebug;
  };
}
