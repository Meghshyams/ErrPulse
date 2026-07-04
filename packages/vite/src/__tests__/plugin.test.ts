import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import errpulse, { serializeOptions } from "../index.js";

function fakeConfigResolved(plugin: ReturnType<typeof errpulse>, root: string) {
  (plugin.configResolved as (config: { root: string }) => void)({ root });
}

function loadVirtual(plugin: ReturnType<typeof errpulse>): string {
  const resolved = (plugin.resolveId as (id: string) => string | undefined)("virtual:errpulse");
  expect(resolved).toBeDefined();
  return (plugin.load as (id: string) => string)(resolved!);
}

describe("serializeOptions", () => {
  it("serializes strings, booleans, and arrays as JSON", () => {
    expect(serializeOptions({ endpoint: "http://x", captureXHR: false, list: ["a"] })).toBe(
      '{ "endpoint": "http://x", "captureXHR": false, "list": ["a"] }'
    );
  });

  it("emits RegExp values as regex literals", () => {
    const out = serializeOptions({ correlationPropagationTargets: ["api.x.com", /^https:\/\/y/] });
    expect(out).toContain('"api.x.com"');
    expect(out).toContain("/^https:\\/\\/y/");
    expect(out).not.toContain('"/^https');
  });

  it("skips undefined values", () => {
    expect(serializeOptions({ a: undefined, b: 1 })).toBe('{ "b": 1 }');
  });
});

describe("errpulse vite plugin", () => {
  it("is dev-only", () => {
    expect(errpulse().apply).toBe("serve");
  });

  it("generates an init module importing @errpulse/browser", () => {
    const plugin = errpulse({ endpoint: "http://localhost:4000" });
    const root = mkdtempSync(join(tmpdir(), "errpulse-vite-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "my-cool-app" }));
    fakeConfigResolved(plugin, root);

    const code = loadVirtual(plugin);
    expect(code).toContain("init(");
    expect(code).toContain('"endpoint": "http://localhost:4000"');
    // projectId defaults to the app's package.json name
    expect(code).toContain('"projectId": "my-cool-app"');
    // imports the browser SDK by absolute resolved path
    expect(code).toMatch(/import \{ init \} from ".*browser.*"/);
  });

  it("falls back to the directory name when package.json has no name", () => {
    const plugin = errpulse();
    const root = mkdtempSync(join(tmpdir(), "errpulse-vite-"));
    fakeConfigResolved(plugin, root);
    const code = loadVirtual(plugin);
    expect(code).toMatch(/"projectId": "errpulse-vite-/);
  });

  it("injects a head-prepend module script into index.html", () => {
    const plugin = errpulse();
    const tags = (plugin.transformIndexHtml as () => Array<Record<string, unknown>>)();
    expect(tags).toHaveLength(1);
    expect(tags[0].tag).toBe("script");
    expect(tags[0].injectTo).toBe("head-prepend");
    expect((tags[0].attrs as Record<string, string>).src).toBe("/@id/__x00__virtual:errpulse");
  });
});
