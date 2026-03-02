import { describe, it, expect } from "vitest";
import { normalizeMessage, getInAppFrames, getTopFrames } from "../utils/normalize.js";
import type { StackFrame } from "../types/error-event.js";

describe("normalizeMessage", () => {
  it("trims whitespace", () => {
    expect(normalizeMessage("  error  ")).toBe("error");
  });

  it("replaces UUIDs with placeholder", () => {
    expect(normalizeMessage("User 550e8400-e29b-41d4-a716-446655440000 not found")).toBe(
      "User <uuid> not found"
    );
  });

  it("replaces memory addresses", () => {
    expect(normalizeMessage("Segfault at 0x7fff5fbff868")).toBe("Segfault at 0x?");
  });

  it("replaces line:col references", () => {
    expect(normalizeMessage("Error at file.js:42:10")).toBe("Error at file.js:?:?");
  });

  it("replaces localhost port numbers", () => {
    expect(normalizeMessage("Failed to connect to localhost:3000")).toBe(
      "Failed to connect to localhost:?"
    );
  });

  it("truncates very long messages", () => {
    const long = "x".repeat(3000);
    const result = normalizeMessage(long);
    expect(result.length).toBeLessThanOrEqual(2051); // 2048 + "..."
    expect(result.endsWith("...")).toBe(true);
  });
});

describe("getInAppFrames", () => {
  it("filters to inApp frames only", () => {
    const frames: StackFrame[] = [
      { filename: "/app/index.ts", function: "main", lineno: 1, colno: 1, inApp: true },
      { filename: "node:internal/main", function: "run", lineno: 1, colno: 1, inApp: false },
      { filename: "/app/handler.ts", function: "handle", lineno: 5, colno: 1, inApp: true },
    ];
    const result = getInAppFrames(frames);
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe("/app/index.ts");
    expect(result[1].filename).toBe("/app/handler.ts");
  });
});

describe("getTopFrames", () => {
  it("returns top N in-app frames when available", () => {
    const frames: StackFrame[] = [
      { filename: "/app/a.ts", function: "a", lineno: 1, colno: 1, inApp: true },
      { filename: "/app/b.ts", function: "b", lineno: 2, colno: 1, inApp: true },
      { filename: "/app/c.ts", function: "c", lineno: 3, colno: 1, inApp: true },
      { filename: "node:internal", function: "d", lineno: 4, colno: 1, inApp: false },
    ];
    const result = getTopFrames(frames, 2);
    expect(result).toHaveLength(2);
    expect(result[0].function).toBe("a");
    expect(result[1].function).toBe("b");
  });

  it("falls back to all frames when no in-app frames", () => {
    const frames: StackFrame[] = [
      { filename: "node:internal", function: "a", lineno: 1, colno: 1, inApp: false },
      { filename: "node:internal", function: "b", lineno: 2, colno: 1, inApp: false },
    ];
    const result = getTopFrames(frames, 2);
    expect(result).toHaveLength(2);
  });
});
