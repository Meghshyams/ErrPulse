import { describe, it, expect } from "vitest";
import { isCorrelationTarget } from "../instruments/correlation-target.js";

const PAGE = "http://localhost:5173/app";

describe("isCorrelationTarget — defaults (no custom targets)", () => {
  it("allows same-origin absolute URLs", () => {
    expect(isCorrelationTarget("http://localhost:5173/api/users", PAGE)).toBe(true);
  });

  it("allows relative URLs (resolve to same origin)", () => {
    expect(isCorrelationTarget("/api/users", PAGE)).toBe(true);
    expect(isCorrelationTarget("api/users", PAGE)).toBe(true);
  });

  it("allows cross-port localhost (typical dev: 5173 -> 3000)", () => {
    expect(isCorrelationTarget("http://localhost:3000/api/users", PAGE)).toBe(true);
    expect(isCorrelationTarget("http://127.0.0.1:8080/api", PAGE)).toBe(true);
    expect(isCorrelationTarget("http://api.localhost/users", PAGE)).toBe(true);
  });

  it("blocks third-party origins", () => {
    expect(isCorrelationTarget("https://api.stripe.com/v1/charges", PAGE)).toBe(false);
    expect(isCorrelationTarget("https://www.googleapis.com/oauth2/v3/certs", PAGE)).toBe(false);
  });

  it("blocks third-party origins even when the page itself is deployed", () => {
    const deployed = "https://myapp.example.com/";
    expect(isCorrelationTarget("https://api.other.com/x", deployed)).toBe(false);
    expect(isCorrelationTarget("https://myapp.example.com/api", deployed)).toBe(true);
  });

  it("returns false for unparseable URLs", () => {
    expect(isCorrelationTarget("http://", PAGE)).toBe(false);
  });
});

describe("isCorrelationTarget — custom targets", () => {
  it("string targets match as substrings and replace defaults", () => {
    const targets = ["api.myservice.com"];
    expect(isCorrelationTarget("https://api.myservice.com/v1", PAGE, targets)).toBe(true);
    // defaults no longer apply
    expect(isCorrelationTarget("http://localhost:3000/api", PAGE, targets)).toBe(false);
  });

  it("regex targets are tested against the resolved URL", () => {
    const targets = [/^https:\/\/api\.(staging|prod)\.example\.com/];
    expect(isCorrelationTarget("https://api.staging.example.com/x", PAGE, targets)).toBe(true);
    expect(isCorrelationTarget("https://api.dev.example.com/x", PAGE, targets)).toBe(false);
  });

  it("relative URLs are resolved before matching", () => {
    expect(isCorrelationTarget("/api/users", PAGE, ["localhost:5173"])).toBe(true);
  });
});
