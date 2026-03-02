import { createHash } from "crypto";
import type { ErrPulseEvent, StackFrame } from "../types/error-event.js";
import { normalizeMessage, getTopFrames } from "./normalize.js";

function frameKey(frame: StackFrame): string {
  return `${frame.filename}:${frame.function}`;
}

export function computeFingerprint(event: ErrPulseEvent): string {
  const parts: string[] = [event.type];

  parts.push(normalizeMessage(event.message));

  if (event.stackFrames && event.stackFrames.length > 0) {
    const topFrames = getTopFrames(event.stackFrames, 3);
    for (const frame of topFrames) {
      parts.push(frameKey(frame));
    }
  }

  const input = parts.join("\n");
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}
