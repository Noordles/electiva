import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
test("future milestone commands fail explicitly rather than reporting false success", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../pending.mjs", import.meta.url)), "db:migrate"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not implemented in M1/);
});
