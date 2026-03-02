import { MAX_MESSAGE_LENGTH, MAX_STACK_FRAMES } from "../constants.js";
import type { StackFrame } from "../types/error-event.js";

export function normalizeMessage(message: string): string {
  let normalized = message.trim();

  // Remove memory addresses (0x1a2b3c4d)
  normalized = normalized.replace(/0x[0-9a-fA-F]+/g, "0x?");

  // Remove specific line/column numbers from inline references
  normalized = normalized.replace(/:\d+:\d+/g, ":?:?");

  // Remove UUIDs
  normalized = normalized.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "<uuid>"
  );

  // Remove specific port numbers in URLs
  normalized = normalized.replace(/localhost:\d+/g, "localhost:?");

  // Remove absolute file paths, keep filename
  normalized = normalized.replace(
    /(?:\/[\w.-]+)+\/([\w.-]+)/g,
    (_match, filename: string) => `<path>/${filename}`
  );

  // Truncate
  if (normalized.length > MAX_MESSAGE_LENGTH) {
    normalized = normalized.slice(0, MAX_MESSAGE_LENGTH) + "...";
  }

  return normalized;
}

export function normalizeStackFrames(frames: StackFrame[]): StackFrame[] {
  return frames.slice(0, MAX_STACK_FRAMES);
}

export function getInAppFrames(frames: StackFrame[]): StackFrame[] {
  return frames.filter((f) => f.inApp);
}

export function getTopFrames(frames: StackFrame[], count: number): StackFrame[] {
  const inApp = getInAppFrames(frames);
  return inApp.length > 0 ? inApp.slice(0, count) : frames.slice(0, count);
}
