import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import sqlite3 from "sqlite3";
import { Sequelize, QueryTypes, Transaction } from "sequelize";

// SQLite's public driver API configures every newly opened transaction connection.
class ProbeDatabase extends sqlite3.Database {
  constructor(...args) { super(...args); this.configure("busyTimeout", 0); }
}
const dialectModule = { ...sqlite3, Database: ProbeDatabase };
const connect = (storage, report) => new Sequelize({ dialect: "sqlite", storage, dialectModule,
  logging: false, retry: { max: 30, match: [/SQLITE_BUSY/], backoffBase: 10, backoffExponent: 1.12, backoffJitter: 10, report } });

export async function withBusyRetry(operation, { attempts = 8, delay = sleep, onRetry = () => {} } = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      if (error.original?.code !== "SQLITE_BUSY" || attempt + 1 === attempts) throw error;
      onRetry();
      await delay(Math.min(10 * 2 ** attempt, 200));
    }
  }
  throw new Error("Retry attempts must be positive");
}

export async function runSpike() {
  const directory = await mkdtemp(path.join(tmpdir(), "electiva-m1-"));
  const storage = path.join(directory, "probe.sqlite");
  let acquisitionRetries = 0;
  const report = message => { if (String(message).startsWith("Retrying")) acquisitionRetries += 1; };
  const admin = connect(storage, report);
  const writers = [connect(storage, report), connect(storage, report)];
  let retries = 0;
  const pragmaEvidence = [];
  const injectedFailure = new Error("deliberate rollback probe");
  const capturePragmas = async (db, transaction) => {
    const options = { transaction, type: QueryTypes.SELECT };
    const foreign = await db.query("PRAGMA foreign_keys", options);
    const busy = await db.query("PRAGMA busy_timeout", options);
    assert.equal(foreign[0].foreign_keys, 1);
    assert.equal(busy[0].timeout, 0);
    pragmaEvidence.push({ foreignKeys: foreign[0].foreign_keys, busyTimeoutMs: busy[0].timeout });
  };
  const claim = (db, claimant, fail = false) => withBusyRetry(() => db.transaction(
    { type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      await capturePragmas(db, transaction);
      const options = { transaction, type: QueryTypes.SELECT };
      const [{ capacity }] = await db.query("SELECT capacity FROM probe_resources WHERE id = 1", options);
      const [{ count }] = await db.query("SELECT COUNT(*) AS count FROM probe_claims WHERE resourceId = 1", options);
      if (count >= capacity) return { claimant, outcome: "full" };
      await db.query("INSERT INTO probe_claims (resourceId, claimant) VALUES (1, $claimant)", {
        bind: { claimant }, transaction,
      });
      if (fail) throw injectedFailure;
      return { claimant, outcome: "claimed" };
    }), { onRetry: () => { retries += 1; } });
  try {
    await admin.query("PRAGMA journal_mode=WAL");
    await admin.query("CREATE TABLE probe_resources (id INTEGER PRIMARY KEY, capacity INTEGER NOT NULL CHECK(capacity >= 0))");
    await admin.query("CREATE TABLE probe_claims (id INTEGER PRIMARY KEY, resourceId INTEGER NOT NULL REFERENCES probe_resources(id), claimant TEXT NOT NULL, UNIQUE(resourceId, claimant))");
    await admin.query("CREATE TRIGGER probe_capacity BEFORE INSERT ON probe_claims WHEN (SELECT COUNT(*) FROM probe_claims WHERE resourceId=NEW.resourceId) >= (SELECT capacity FROM probe_resources WHERE id=NEW.resourceId) BEGIN SELECT RAISE(ABORT, 'capacity_exceeded'); END");
    await admin.query("INSERT INTO probe_resources VALUES (1, 1)");
    await assert.rejects(claim(writers[0], "rollback", true), error => error === injectedFailure);
    const [{ count: afterRollback }] = await admin.query("SELECT COUNT(*) AS count FROM probe_claims", { type: QueryTypes.SELECT });
    assert.equal(afterRollback, 0);
    const outcomes = await Promise.all(Array.from({ length: 20 }, (_, index) => claim(writers[index % 2], `probe-${index + 1}`)));
    const persisted = await admin.query("SELECT claimant FROM probe_claims ORDER BY id", { type: QueryTypes.SELECT });
    assert.equal(outcomes.filter(row => row.outcome === "claimed").length, 1);
    assert.equal(outcomes.filter(row => row.outcome === "full").length, 19);
    assert.equal(persisted.length, 1);
    assert.equal(persisted[0].claimant, outcomes.find(row => row.outcome === "claimed").claimant);
    await assert.rejects(admin.query("INSERT INTO probe_claims (resourceId, claimant) VALUES (1, 'bypass')"));
    await assert.rejects(admin.query("INSERT INTO probe_claims (resourceId, claimant) VALUES (99, 'orphan')"));
    const [version] = await admin.query("SELECT sqlite_version() AS version", { type: QueryTypes.SELECT });
    const [journal] = await admin.query("PRAGMA journal_mode", { type: QueryTypes.SELECT });
    assert.equal(journal.journal_mode, "wal");
    return { scope: "M1 transaction/driver experiment, not the authenticated HTTP CON acceptance test",
      node: process.version, sqlite: version.version, sequelize: Sequelize.version,
      storage: "temporary local file outside repository", journal: journal.journal_mode,
      claimantCount: 20, sequelizeWriterInstances: 2,
      claimed: 1, full: 19, persistedCount: persisted.length, rollbackCount: afterRollback,
      foreignKeyBypassRejected: true, capacityBypassRejected: true,
      acquisitionRetryLimit: 30, observedAcquisitionRetries: acquisitionRetries, retryLimit: 8, observedBusyRetries: retries, transactionPragmas: pragmaEvidence,
      outcomes, completedAt: new Date().toISOString() };
  } finally {
    await Promise.allSettled(writers.map(db => db.close()));
    await admin.close();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith("electiva-m1-"));
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runSpike();
  if (process.argv[2] === "--output" && process.argv[3]) {
    const output = path.resolve(process.argv[3]);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(result, null, 2) + "\n");
  }
  console.log(JSON.stringify(result, null, 2));
}
