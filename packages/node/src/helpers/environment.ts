import type { EnvironmentInfo } from "@errpulse/core";
import os from "os";

export function getEnvironment(): EnvironmentInfo {
  const mem = process.memoryUsage();
  return {
    runtime: "node",
    runtimeVersion: process.version,
    nodeVersion: process.version,
    os: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    memoryUsage: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
    },
  };
}
