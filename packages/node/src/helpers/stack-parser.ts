import type { StackFrame } from "@errpulse/core";

const NODE_STACK_RE = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/;

export function parseStack(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];

  for (const line of stack.split("\n")) {
    const match = NODE_STACK_RE.exec(line);
    if (!match) continue;

    const [, fn, filename, lineno, colno] = match;

    const isNodeInternal =
      filename.startsWith("node:") ||
      filename.includes("node_modules") ||
      !filename.startsWith("/");

    frames.push({
      function: fn || "<anonymous>",
      filename,
      lineno: Number(lineno),
      colno: Number(colno),
      inApp: !isNodeInternal,
    });
  }

  return frames;
}
