import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { createApp } from "../app.js";
import { resolveConfig } from "../config.js";
import { closeDatabase } from "../db/index.js";
import path from "path";
import os from "os";
import fs from "fs";

const testDbPath = path.join(os.tmpdir(), `errlens-test-${Date.now()}.db`);

let app: ReturnType<typeof createApp>["app"];
let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  const config = resolveConfig({ dbPath: testDbPath, dashboardEnabled: false });
  const ctx = createApp(config);
  app = ctx.app;

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });
});

afterAll(() => {
  server?.close();
  closeDatabase();
  try {
    fs.unlinkSync(testDbPath);
    fs.unlinkSync(testDbPath + "-wal");
    fs.unlinkSync(testDbPath + "-shm");
  } catch {
    // Cleanup best effort
  }
});

async function postEvent(event: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return { status: res.status, body: await res.json() };
}

describe("POST /api/events", () => {
  it("ingests a valid error event", async () => {
    const { status, body } = await postEvent({
      type: "uncaught_exception",
      message: "Cannot read properties of undefined (reading 'foo')",
      source: "backend",
      severity: "error",
    });

    expect(status).toBe(201);
    expect(body.id).toBeTruthy();
    expect(body.fingerprint).toMatch(/^[0-9a-f]+$/);
    expect(body.isNew).toBe(true);
  });

  it("groups duplicate errors", async () => {
    const event = {
      type: "uncaught_exception",
      message: "Test duplicate grouping error",
      source: "backend",
      severity: "error",
    };

    const first = await postEvent(event);
    expect(first.body.isNew).toBe(true);

    const second = await postEvent(event);
    expect(second.body.isNew).toBe(false);
    expect(second.body.fingerprint).toBe(first.body.fingerprint);
  });

  it("rejects events missing required fields", async () => {
    const res = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "incomplete" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/errors", () => {
  it("returns error groups", async () => {
    const res = await fetch(`${baseUrl}/api/errors`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.errors).toBeInstanceOf(Array);
    expect(body.total).toBeGreaterThan(0);
    expect(body.errors[0]).toHaveProperty("fingerprint");
    expect(body.errors[0]).toHaveProperty("count");
  });

  it("filters by source", async () => {
    // First add a frontend error
    await postEvent({
      type: "uncaught_exception",
      message: "Frontend specific error for filter test",
      source: "frontend",
      severity: "error",
    });

    const res = await fetch(`${baseUrl}/api/errors?source=frontend`);
    const body = await res.json();

    expect(res.status).toBe(200);
    for (const err of body.errors) {
      expect(err.source).toBe("frontend");
    }
  });
});

describe("GET /api/errors/:id", () => {
  it("returns error detail with events", async () => {
    // Get the first error
    const listRes = await fetch(`${baseUrl}/api/errors`);
    const listBody = await listRes.json();
    const errorId = listBody.errors[0].id;

    const res = await fetch(`${baseUrl}/api/errors/${errorId}`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toBeTruthy();
    expect(body.error.id).toBe(errorId);
    expect(body.events).toBeInstanceOf(Array);
  });

  it("returns 404 for unknown id", async () => {
    const res = await fetch(`${baseUrl}/api/errors/nonexistent`);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/errors/:id", () => {
  it("updates error status", async () => {
    const listRes = await fetch(`${baseUrl}/api/errors`);
    const listBody = await listRes.json();
    const errorId = listBody.errors[0].id;

    const res = await fetch(`${baseUrl}/api/errors/${errorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });

    expect(res.status).toBe(200);

    // Verify it changed
    const detailRes = await fetch(`${baseUrl}/api/errors/${errorId}`);
    const detail = await detailRes.json();
    expect(detail.error.status).toBe("resolved");
  });

  it("rejects invalid status", async () => {
    const listRes = await fetch(`${baseUrl}/api/errors`);
    const listBody = await listRes.json();
    const errorId = listBody.errors[0].id;

    const res = await fetch(`${baseUrl}/api/errors/${errorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid_status" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/stats", () => {
  it("returns dashboard stats", async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("healthScore");
    expect(body).toHaveProperty("errorsLast24h");
    expect(body).toHaveProperty("totalRequests");
    expect(body).toHaveProperty("topErrors");
    expect(body).toHaveProperty("errorsByType");
    expect(body).toHaveProperty("errorsBySource");
    expect(body).toHaveProperty("errorsOverTime");
  });
});

describe("GET /api/health", () => {
  it("returns health check", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeTruthy();
  });
});

describe("POST /api/events/batch", () => {
  it("ingests multiple events", async () => {
    const events = [
      {
        type: "uncaught_exception",
        message: "Batch error 1",
        source: "backend",
        severity: "error",
      },
      {
        type: "unhandled_rejection",
        message: "Batch error 2",
        source: "frontend",
        severity: "warning",
      },
    ];

    const res = await fetch(`${baseUrl}/api/events/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(events),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0]).toHaveProperty("fingerprint");
    expect(body[1]).toHaveProperty("fingerprint");
  });
});
