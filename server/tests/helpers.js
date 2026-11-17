import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { createDatabase } from '../src/db/database.js';

export async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'electiva-test-'));
  const storage = path.join(directory, 'test.sqlite');
  const db = await createDatabase(storage);
  const cleanups = [];
  t.after(async () => {
    for (const cleanup of cleanups.reverse()) await cleanup();
    await db.close();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('electiva-test-'));
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });
  return { db, storage, onCleanup: cleanup => cleanups.push(cleanup) };
}

export async function domainFixture(db, { capacity = 1, count = 4, now = Date.now() } = {}) {
  await db.write(async tx => {
    for (let id = 1; id <= count; id += 1) {
      await db.run("INSERT INTO users VALUES ($id, $email, $name, 'not-a-login-hash', 'student', $now)", { id, email: `student${id}@example.test`, name: `Student ${id}`, now }, tx);
    }
    await db.run("INSERT INTO courses VALUES (1, 'WEB', 'Inclusive Web Design', 'Semantic interfaces', 'Informatics', 5, NULL)", {}, tx);
    await db.run("INSERT INTO offerings VALUES (1, 1, '2026-2027', $capacity, $opens, $closes, 'PUBLISHED', 1)", { capacity, opens: now - 3600000, closes: now + 3600000 }, tx);
  });
}
