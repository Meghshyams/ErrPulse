import { describe, it, expect } from "vitest";
import { explainError, matchPattern } from "../explanations/matcher.js";

describe("explainError", () => {
  it("explains null reference errors", () => {
    const result = explainError("Cannot read properties of undefined (reading 'foo')");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Null Reference Access");
  });

  it("explains ECONNREFUSED", () => {
    const result = explainError("connect ECONNREFUSED 127.0.0.1:5432");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Connection Refused");
  });

  it("explains module not found", () => {
    const result = explainError("Cannot find module './missing-file'");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Module Not Found");
  });

  it("explains CORS errors", () => {
    const result = explainError(
      "Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin'"
    );
    expect(result).not.toBeNull();
    expect(result!.title).toBe("CORS Error");
  });

  it("explains stack overflow", () => {
    const result = explainError("Maximum call stack size exceeded");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Stack Overflow");
  });

  it("explains port in use", () => {
    const result = explainError("listen EADDRINUSE: address already in use :::3000");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Port Already in Use");
  });

  it("explains hydration errors", () => {
    const result = explainError(
      "Hydration failed because the initial UI does not match what was rendered on the server"
    );
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Hydration Mismatch");
  });

  it("explains JWT errors", () => {
    const result = explainError("jwt expired");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("JWT Error");
  });

  it("explains file not found", () => {
    const result = explainError("ENOENT: no such file or directory, open '/tmp/data.json'");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("File Not Found");
  });

  it("explains duplicate key errors", () => {
    const result = explainError("duplicate key value violates unique constraint");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Duplicate Entry");
  });

  it("returns null for unknown errors", () => {
    const result = explainError("xyzzy plugh nothing happens");
    expect(result).toBeNull();
  });

  it("all explanations have suggestion field", () => {
    const testMessages = [
      "Cannot read properties of undefined",
      "ECONNREFUSED",
      "Maximum call stack size exceeded",
      "ENOENT",
    ];
    for (const msg of testMessages) {
      const result = explainError(msg);
      expect(result).not.toBeNull();
      expect(result!.suggestion).toBeTruthy();
      expect(result!.suggestion.length).toBeGreaterThan(0);
    }
  });
});

describe("matchPattern", () => {
  it("returns full pattern object", () => {
    const result = matchPattern("Cannot read properties of null");
    expect(result).not.toBeNull();
    expect(result!.pattern).toBeInstanceOf(RegExp);
    expect(result!.title).toBeTruthy();
    expect(result!.explanation).toBeTruthy();
    expect(result!.suggestion).toBeTruthy();
  });
});
