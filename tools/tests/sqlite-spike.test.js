import assert from "node:assert/strict";
import test from "node:test";
import { runSpike, withBusyRetry } from "../spikes/sqlite-concurrency.js";

test("file SQLite: competing writers, rollback, per-connection settings and DB guards", { timeout: 20_000 }, async () => {
  const result = await runSpike();
  assert.equal(result.claimed, 1); assert.equal(result.full, 19);
  assert.equal(result.rollbackCount, 0); assert.equal(result.persistedCount, 1);
  assert.ok(result.transactionPragmas.length >= 21);
});
test("busy retry retries whole operation and remains bounded", async () => {
  let calls = 0; const waits = [];
  const busy = Object.assign(new Error("busy"), { original: { code: "SQLITE_BUSY" } });
  const result = await withBusyRetry(async () => { if (++calls < 3) throw busy; return "done"; }, { delay: async ms => waits.push(ms) });
  assert.equal(result, "done"); assert.equal(calls, 3); assert.deepEqual(waits, [10, 20]);
  calls = 0;
  await assert.rejects(withBusyRetry(async () => { calls += 1; throw busy; }, { attempts: 2, delay: async () => {} }), error => error === busy);
  assert.equal(calls, 2);
});
test("unexpected/constraint errors retain identity and are not retried", async () => {
  const failure = new Error("unexpected"); let calls = 0;
  await assert.rejects(withBusyRetry(async () => { calls += 1; throw failure; }), e => e === failure);
  assert.equal(calls, 1);
});
