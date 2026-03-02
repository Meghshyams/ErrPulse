import { describe, it, expect } from "vitest";
import { sanitizeHeaders, sanitizeObject } from "../utils/sanitize.js";

describe("sanitizeHeaders", () => {
  it("redacts sensitive headers", () => {
    const result = sanitizeHeaders({
      "content-type": "application/json",
      authorization: "Bearer secret-token",
      cookie: "session=abc123",
      "x-api-key": "my-key",
    });

    expect(result["content-type"]).toBe("application/json");
    expect(result["authorization"]).toBe("[Redacted]");
    expect(result["cookie"]).toBe("[Redacted]");
    expect(result["x-api-key"]).toBe("[Redacted]");
  });

  it("preserves non-sensitive headers", () => {
    const result = sanitizeHeaders({
      "content-type": "text/html",
      accept: "*/*",
      "user-agent": "Mozilla/5.0",
    });

    expect(result["content-type"]).toBe("text/html");
    expect(result["accept"]).toBe("*/*");
    expect(result["user-agent"]).toBe("Mozilla/5.0");
  });
});

describe("sanitizeObject", () => {
  it("redacts sensitive fields in objects", () => {
    const result = sanitizeObject({
      username: "john",
      password: "secret123",
      data: { token: "abc", name: "test" },
    });

    expect(result).toEqual({
      username: "john",
      password: "[Redacted]",
      data: { token: "[Redacted]", name: "test" },
    });
  });

  it("handles arrays", () => {
    const result = sanitizeObject([
      { name: "a", apiKey: "secret" },
      { name: "b", apiKey: "secret2" },
    ]);

    expect(result).toEqual([
      { name: "a", apiKey: "[Redacted]" },
      { name: "b", apiKey: "[Redacted]" },
    ]);
  });

  it("handles null and undefined", () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });

  it("handles primitive values", () => {
    expect(sanitizeObject("hello")).toBe("hello");
    expect(sanitizeObject(42)).toBe(42);
    expect(sanitizeObject(true)).toBe(true);
  });
});
