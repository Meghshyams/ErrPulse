import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrLensEvent,
} from "@errlens/core";
import { enqueueEvent } from "../client.js";
import { getEnvironment } from "../helpers/environment.js";
import { getConfig } from "../config.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function installMemoryMonitor(): () => void {
  if (intervalId) return () => {};

  const config = getConfig();

  intervalId = setInterval(() => {
    try {
      const mem = process.memoryUsage();
      const heapUsedMB = mem.heapUsed / (1024 * 1024);

      if (heapUsedMB > config.memoryThresholdMB) {
        const event: ErrLensEvent = {
          eventId: generateEventId(),
          timestamp: new Date().toISOString(),
          type: ErrorType.MemoryWarning,
          message: `High memory usage: ${Math.round(heapUsedMB)}MB heap used (threshold: ${config.memoryThresholdMB}MB)`,
          source: ErrorSource.Backend,
          severity: Severity.Warning,
          environment: getEnvironment(),
          extra: {
            heapUsedMB: Math.round(heapUsedMB),
            heapTotalMB: Math.round(mem.heapTotal / (1024 * 1024)),
            rssMB: Math.round(mem.rss / (1024 * 1024)),
            threshold: config.memoryThresholdMB,
          },
        };

        enqueueEvent(event);
      }
    } catch {
      // Never crash host app
    }
  }, config.memoryCheckIntervalMs);

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
