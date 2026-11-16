import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "../src/app.js";
import { HttpError } from "../src/errors.js";
import { startServer } from "../src/server.js";

async function withApi(options, run) {
  const running = await startServer(createApp(options));
  try { await run(running.url); } finally { await running.close(); }
}
const json = body => ({ method: "POST", headers: { "content-type": "application/json" }, body });

test("health and metadata describe M1 honestly without invented capabilities", async () => {
  await withApi({}, async base => {
    for (const route of ["/health", "/api/v1/health"]) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200); assert.equal(response.headers.get("x-powered-by"), null);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.match(response.headers.get("x-request-id"), /^[a-f0-9-]{36}$/);
      assert.equal((await response.json()).data.status, "ok");
    }
    const meta = (await (await fetch(base + "/api/v1/meta")).json()).data;
    assert.equal(meta.preview, true);
    assert.deepEqual(meta.capabilities, { authentication: false, persistedCatalog: false, enrollment: false });
    for (const route of ["/ready", "/api/v1/ready"]) {
      const response = await fetch(base + route); assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { data: { status: "not_ready" } });
    }
  });
});
test("readiness checks dependency state and never reveals connection failures", async () => {
  for (const [checkReady, expected] of [[async () => true, 200], [async () => false, 503], [async () => { throw new Error("private sqlite path"); }, 503]]) {
    await withApi({ checkReady }, async base => {
      const response = await fetch(base + "/ready"); assert.equal(response.status, expected);
      assert.doesNotMatch(await response.text(), /sqlite|private|path/);
    });
  }
});
test("JSON/media/size validation returns stable safe errors with request identity", async () => {
  const options = { configureRoutes: app => app.post("/api/v1/echo", (req, res) => res.json({ data: req.body })) };
  await withApi(options, async base => {
    for (const [init, status, code] of [[json("{"), 400, "invalid_json"], [json(JSON.stringify({ text: "x".repeat(17000) })), 413, "body_too_large"], [{ method: "POST", body: "text" }, 415, "json_required"]]) {
      const response = await fetch(base + "/api/v1/echo", init);
      assert.equal(response.status, status);
      const body = await response.json(); assert.equal(body.error.code, code);
      assert.equal(body.error.requestId, response.headers.get("x-request-id"));
    }
    const response = await fetch(base + "/api/v1/echo", json('{"valid":true}'));
    assert.deepEqual(await response.json(), { data: { valid: true } });
  });
});
test("unknown APIs remain JSON404 and unexpected/domain errors are classified", async () => {
  await withApi({ configureRoutes: app => {
    app.get("/api/v1/fail", async () => { throw new Error("password=private stack"); });
    app.get("/api/v1/domain", () => { throw new HttpError(409, "window_closed", "Enrollment window is closed"); });
  } }, async base => {
    for (const route of ["/api/v1/missing", "/api/missing"]) {
      const response = await fetch(base + route, { headers: { accept: "text/html" } });
      assert.equal(response.status, 404); assert.match(response.headers.get("content-type"), /application\/json/);
    }
    const failed = await fetch(base + "/api/v1/fail"); assert.equal(failed.status, 500);
    assert.doesNotMatch(await failed.text(), /password|private|stack/);
    const conflict = await fetch(base + "/api/v1/domain"); assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).error.code, "window_closed");
  });
});
test("one completion log excludes body, query, authorization and cookies", async () => {
  const logs = [];
  await withApi({ logger: { info: entry => logs.push(entry) } }, async base => {
    await (await fetch(base + "/health?password=private", { headers: { authorization: "Bearer private", cookie: "session=private" } })).text();
  });
  assert.equal(logs.length, 1); assert.equal(logs[0].path, "/health");
  assert.equal(logs[0].outcome, "completed"); assert.ok(logs[0].durationMs >= 0);
  assert.doesNotMatch(JSON.stringify(logs), /password|private|Bearer|session=/);
});
test("production serves SPA deep links, while assets and API misses stay404", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "electiva-static-"));
  try {
    await writeFile(path.join(directory, "index.html"), "<!doctype html><title>Electiva fixture</title>");
    await withApi({ staticDirectory: directory }, async base => {
      const page = await fetch(base + "/courses"); assert.equal(page.status, 200);
      assert.match(await page.text(), /Electiva fixture/);
      assert.match(page.headers.get("content-security-policy"), /frame-ancestors 'none'/);
      assert.equal((await fetch(base + "/assets/missing.js")).status, 404);
      assert.equal((await fetch(base + "/courses", { headers: { accept: "application/json" } })).status, 404);
      const api = await fetch(base + "/api/v1/missing"); assert.equal(api.status, 404);
      assert.equal((await api.json()).error.code, "not_found");
    });
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    await rm(directory, { recursive: true, force: true, maxRetries: 3 });
  }
});
test("missing production build fails clearly, and server closes idempotently", async () => {
  assert.throws(() => createApp({ staticDirectory: path.join(tmpdir(), "electiva-missing-build") }), /Client build missing/);
  const running = await startServer(createApp());
  await running.close(); await running.close();
  await assert.rejects(fetch(running.url + "/health"));
});
