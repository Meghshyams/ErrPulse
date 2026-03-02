import { AsyncLocalStorage } from "async_hooks";
import { CORRELATION_HEADER, generateCorrelationId } from "@errpulse/core";

const correlationStore = new AsyncLocalStorage<string>();

export function getCorrelationId(): string | undefined {
  return correlationStore.getStore();
}

export function runWithCorrelation<T>(correlationId: string, fn: () => T): T {
  return correlationStore.run(correlationId, fn);
}

export function extractOrCreateCorrelationId(
  headers: Record<string, string | string[] | undefined>
): string {
  const existing = headers[CORRELATION_HEADER];
  if (typeof existing === "string" && existing) {
    return existing;
  }
  return generateCorrelationId();
}
