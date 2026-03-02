import { describe, it, expect } from "vitest";
import { computeFingerprint } from "../utils/fingerprint.js";
import { ErrorType, ErrorSource, Severity } from "../types/enums.js";
import type { ErrPulseEvent } from "../types/error-event.js";

function makeEvent(overrides: Partial<ErrPulseEvent> = {}): ErrPulseEvent {
  return {
    eventId: "test-id",
    timestamp: new Date().toISOString(),
    type: ErrorType.UncaughtException,
    message: "Cannot read property 'foo' of undefined",
    source: ErrorSource.Backend,
    severity: Severity.Error,
    ...overrides,
  };
}

describe("computeFingerprint", () => {
  it("returns a 32-character hex string", () => {
    const fp = computeFingerprint(makeEvent());
    expect(fp).toMatch(/^[0-9a-f]{32}$/);
  });

  it("same error produces same fingerprint", () => {
    const event = makeEvent();
    const fp1 = computeFingerprint(event);
    const fp2 = computeFingerprint(event);
    expect(fp1).toBe(fp2);
  });

  it("different messages produce different fingerprints", () => {
    const fp1 = computeFingerprint(makeEvent({ message: "Error A" }));
    const fp2 = computeFingerprint(makeEvent({ message: "Error B" }));
    expect(fp1).not.toBe(fp2);
  });

  it("different event types produce different fingerprints", () => {
    const fp1 = computeFingerprint(makeEvent({ type: ErrorType.UncaughtException }));
    const fp2 = computeFingerprint(makeEvent({ type: ErrorType.UnhandledRejection }));
    expect(fp1).not.toBe(fp2);
  });

  it("uses stack frames for fingerprinting when available", () => {
    const fp1 = computeFingerprint(
      makeEvent({
        stackFrames: [
          {
            filename: "/app/src/index.ts",
            function: "main",
            lineno: 10,
            colno: 5,
            inApp: true,
          },
        ],
      })
    );
    const fp2 = computeFingerprint(
      makeEvent({
        stackFrames: [
          {
            filename: "/app/src/other.ts",
            function: "handler",
            lineno: 20,
            colno: 3,
            inApp: true,
          },
        ],
      })
    );
    expect(fp1).not.toBe(fp2);
  });

  it("normalizes messages before fingerprinting (UUIDs)", () => {
    const fp1 = computeFingerprint(
      makeEvent({
        message: "User 550e8400-e29b-41d4-a716-446655440000 not found",
      })
    );
    const fp2 = computeFingerprint(
      makeEvent({
        message: "User 550e8400-e29b-41d4-a716-999999999999 not found",
      })
    );
    expect(fp1).toBe(fp2);
  });
});
