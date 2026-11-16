import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { tmpdir } from "node:os";
import { loadConfig } from "../src/config.js";

test("config defaults to loopback and local database outside synced source", () => {
  const config = loadConfig({ LOCALAPPDATA: tmpdir() });
  assert.equal(config.host, "127.0.0.1"); assert.equal(config.port, 3000);
  assert.equal(config.clientPort, 5173); assert.ok(path.isAbsolute(config.databasePath));
  assert.ok(Object.isFrozen(config)); assert.doesNotMatch(config.databasePath, /OneDrive/);
});
test("config validates exact numeric ports, mode and bind host", () => {
  for (const value of ["", "-1", "01", "abc", "1.2", "65536", " 3000"]) {
    assert.throws(() => loadConfig({ PORT: value }), /PORT/);
  }
  assert.equal(loadConfig({ PORT: "0", CLIENT_PORT: "5180" }).port, 0);
  assert.throws(() => loadConfig({ NODE_ENV: "invalid" }), /NODE_ENV/);
  assert.throws(() => loadConfig({ HOST: "0.0.0.0" }), /loopback/);
});
test("runtime storage cannot be relative, in-memory or under OneDrive", () => {
  for (const databasePath of [":memory:", "relative.sqlite", path.join(tmpdir(), "OneDrive", "db.sqlite"), path.join(tmpdir(), "OneDrive - ASE", "db.sqlite")]) {
    assert.throws(() => loadConfig({ DATABASE_PATH: databasePath }), /DATABASE_PATH/);
  }
});
