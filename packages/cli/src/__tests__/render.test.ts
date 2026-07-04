import { describe, it, expect } from "vitest";
import { formatNewError, formatRecurrence, formatFailedRequest } from "../render.js";
import type { ErrorGroup } from "@errpulse/core";

// eslint-disable-next-line no-control-regex
const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, "");

function makeGroup(overrides: Partial<ErrorGroup> = {}): ErrorGroup {
  return {
    id: "err-1",
    fingerprint: "fp-1",
    type: "TypeError",
    message: "Cannot read properties of undefined",
    source: "frontend",
    severity: "error",
    status: "unresolved",
    firstSeen: "2026-07-04T11:00:00.000Z",
    lastSeen: "2026-07-04T11:00:00.000Z",
    count: 1,
    ...overrides,
  } as ErrorGroup;
}

describe("formatNewError", () => {
  it("includes severity, source, type, message, and project", () => {
    const line = stripAnsi(formatNewError(makeGroup({ projectId: "demo" })));
    expect(line).toContain("✖ ERROR");
    expect(line).toContain("[frontend]");
    expect(line).toContain("TypeError: Cannot read properties of undefined");
    expect(line).toContain("(demo)");
  });

  it("renders a JSON-stringified explanation as a second line", () => {
    const group = makeGroup({
      explanation: JSON.stringify({ title: "Null Reference", suggestion: "Use ?. chaining" }),
    });
    const line = stripAnsi(formatNewError(group));
    expect(line).toContain("↳ Null Reference — Use ?. chaining");
  });

  it("tolerates a plain-text explanation", () => {
    const line = stripAnsi(formatNewError(makeGroup({ explanation: "just text" })));
    expect(line).toContain("↳ just text");
  });

  it("collapses multi-line messages and truncates very long ones", () => {
    const line = stripAnsi(formatNewError(makeGroup({ message: "a\nb\n" + "x".repeat(500) })));
    expect(line.split("\n")[0]).not.toContain("b\n");
    expect(line).toContain("…");
  });
});

describe("formatRecurrence", () => {
  it("shows the cumulative count", () => {
    const line = stripAnsi(formatRecurrence(makeGroup({ count: 12 })));
    expect(line).toContain("×12");
    expect(line).toContain("TypeError: Cannot read properties of undefined");
  });
});

describe("formatFailedRequest", () => {
  it("returns null for successful requests", () => {
    expect(formatFailedRequest({ method: "GET", url: "/api", statusCode: 200 })).toBeNull();
    expect(formatFailedRequest({ method: "GET", url: "/api", statusCode: 302 })).toBeNull();
  });

  it("formats 4xx/5xx and network failures", () => {
    const notFound = stripAnsi(
      formatFailedRequest({ method: "GET", url: "/api/x", statusCode: 404, duration: 5 })!
    );
    expect(notFound).toContain("⇢ 404");
    expect(notFound).toContain("GET /api/x");
    expect(notFound).toContain("(5ms)");

    const network = stripAnsi(
      formatFailedRequest({ method: "POST", url: "/api/y", statusCode: 0 })!
    );
    expect(network).toContain("⇢ FAILED");
  });
});
