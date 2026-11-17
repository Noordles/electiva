import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createDatabase } from '../../server/src/db/database.js';
import { listCatalog, catalogStatements } from '../../server/src/catalog.js';
import { capacityFixture } from './fixture.mjs';
import { percentile } from './capacity.mjs';

const args = process.argv.slice(2), output = args[args.indexOf('--output') + 1];
if (!args.includes('--output') || !output) throw new Error('Use --output path [--clock epoch]');
const clock = args.includes('--clock') ? Number(args[args.indexOf('--clock') + 1]) : Date.now();
const directory = await mkdtemp(path.join(tmpdir(), 'electiva-profile-')); let db;
try {
  db = await createDatabase(path.join(directory, 'profile.sqlite'));
  const { manifest } = await capacityFixture(db, clock);
  const query = { pageSize: '20', sort: 'title', page: '3' }, { rowsSql, bind } = catalogStatements(query, clock);
  const plan = await db.all('EXPLAIN QUERY PLAN ' + rowsSql, bind);
  const expected = await listCatalog(db, query, clock);
  const resultHash = createHash('sha256').update(JSON.stringify(expected)).digest('hex');
  for (let i = 0; i < 5; i += 1) await listCatalog(db, query, clock);
  const repetitions = [];
  for (let repetition = 1; repetition <= 3; repetition += 1) {
    const samplesMs = [];
    for (let i = 0; i < 50; i += 1) {
      const start = performance.now(), result = await listCatalog(db, query, clock); samplesMs.push(performance.now() - start);
      assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'), resultHash);
    }
    repetitions.push({ repetition, samplesMs, p50Ms: percentile(samplesMs, 0.5), p95Ms: percentile(samplesMs, 0.95) });
  }
  const report = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), completedAt: new Date().toISOString(), fixture: manifest, query, rowsSql, plan, resultHash, warmupQueries: 5, repetitions, scope: 'Isolated SQL catalog profile; parameterized two-query endpoint logic, no HTTP/auth/think time. Paired fixture and result hashes must match.' };
  await mkdir(path.dirname(path.resolve(output)), { recursive: true }); await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ output, fixtureHash: manifest.logicalSha256, resultHash, repetitions: repetitions.map(({ repetition, p50Ms, p95Ms }) => ({ repetition, p50Ms, p95Ms })) }));
} finally {
  if (db) await db.close(); assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('electiva-profile-'));
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
