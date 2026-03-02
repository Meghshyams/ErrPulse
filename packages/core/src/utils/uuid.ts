import { randomBytes } from "crypto";

export function generateEventId(): string {
  return randomBytes(16).toString("hex");
}

export function generateCorrelationId(): string {
  return randomBytes(8).toString("hex");
}
