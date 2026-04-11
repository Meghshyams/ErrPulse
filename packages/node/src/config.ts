import { DEFAULT_SERVER_URL } from "@errpulse/core";
import type { ErrPulseEvent } from "@errpulse/core";

export interface NodeSDKConfig {
  serverUrl: string;
  projectId?: string;
  enabled: boolean;
  sampleRate: number;
  beforeSend?: (event: ErrPulseEvent) => ErrPulseEvent | null;
  captureConsoleErrors: boolean;
  captureConsoleLogs: boolean;
  captureUncaughtExceptions: boolean;
  captureUnhandledRejections: boolean;
  monitorMemory: boolean;
  memoryThresholdMB: number;
  memoryCheckIntervalMs: number;
}

const defaultConfig: NodeSDKConfig = {
  serverUrl: DEFAULT_SERVER_URL,
  enabled: true,
  sampleRate: 1.0,
  captureConsoleErrors: true,
  captureConsoleLogs: false,
  captureUncaughtExceptions: true,
  captureUnhandledRejections: true,
  monitorMemory: true,
  memoryThresholdMB: 512,
  memoryCheckIntervalMs: 30000,
};

let currentConfig: NodeSDKConfig = { ...defaultConfig };

export function configure(partial: Partial<NodeSDKConfig>): NodeSDKConfig {
  currentConfig = { ...currentConfig, ...partial };
  return currentConfig;
}

export function getConfig(): NodeSDKConfig {
  return currentConfig;
}
