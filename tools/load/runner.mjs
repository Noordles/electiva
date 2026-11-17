import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { cpus, platform, release, tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createDatabase } from '../../server/src/db/database.js';
import { seedDatabase } from '../../server/src/db/seed.js';
import { createApplication } from '../../server/src/application.js';
import { startServer } from '../../server/src/server.js';

const percentile = (values, fraction) => values.length ? [...values].sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * fraction) - 1)] : null;
export async function runLoad({ users = 10, seconds = 15, seed = 20261117 } = {}) {
  if (!Number.isInteger(users) || users < 1 || users > 400 || !Number.isFinite(seconds) || seconds < 1 || seconds > 120) throw new Error('Use 1–400 users and 1–120 seconds');
  const directory = await mkdtemp(path.join(tmpdir(), 'electiva-load-'));
  let db, running;
  try {
    db = await createDatabase(path.join(directory, 'load.sqlite'));
    const accounts = await seedDatabase(db, { large: true });
    running = await startServer(createApplication(db, { loginLimit: 1000 }));
    const sessions = await Promise.all(Array.from({ length: users }, async (_, index) => {
      const response = await fetch(running.url + '/api/v1/auth/login', { method: 'POST', headers: { origin: running.url, 'content-type': 'application/json' }, body: JSON.stringify({ email: `student${index + 1}@example.test`, password: accounts.password }) });
      assert.equal(response.status, 200, 'Load authentication failed');
      return { cookie: response.headers.get('set-cookie').split(';')[0], csrfToken: (await response.json()).data.csrfToken };
    }));
    // Warm the real listing path; login and warmup are excluded from measurements.
    await Promise.all(sessions.map(session => fetch(running.url + '/api/v1/offerings?pageSize=20', { headers: { cookie: session.cookie } }).then(response => { assert.equal(response.status, 200); return response.arrayBuffer(); })));
    const cpuStart = process.cpuUsage(), started = performance.now(), end = started + seconds * 1000;
    let peakRssBytes = process.memoryUsage().rss;
    const sampler = setInterval(() => { peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss); }, 100);
    const observations = [], outcomes = {};
    try {
      await Promise.all(sessions.map(async (session, index) => {
        let state = (seed + index) >>> 0, membership;
        const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
        while (performance.now() < end) {
          if (observations.length >= 1000000) throw new Error('Load sample bound reached');
          const choice = random(); let operation, route, method = 'GET';
          if (choice < 0.7) { operation = 'catalog'; route = `/offerings?pageSize=20&page=${1 + Math.floor(random() * 5)}&sort=title`; }
          else if (choice < 0.85) { operation = 'history'; route = '/me/enrollments?pageSize=20'; }
          else if (choice < 0.95 || !membership) { operation = 'enroll'; route = `/offerings/${1 + Math.floor(random() * 100)}/enrollments`; method = 'POST'; }
          else { operation = 'cancel'; route = `/me/enrollments/${membership}/cancel`; method = 'POST'; }
          const before = performance.now(); let status = 'network_error';
          try {
            const response = await fetch(running.url + '/api/v1' + route, { method, signal: AbortSignal.timeout(5000), headers: { cookie: session.cookie, ...(method === 'POST' ? { origin: running.url, 'x-csrf-token': session.csrfToken, 'content-type': 'application/json' } : {}) }, ...(method === 'POST' ? { body: '{}' } : {}) });
            status = String(response.status); const body = await response.json();
            if (operation === 'enroll' && response.ok) membership = body.data.id;
            if (operation === 'cancel' && response.ok) membership = undefined;
          } catch (error) { status = error.name === 'TimeoutError' ? 'timeout' : 'network_error'; }
          const ok = status === '200' || status === '201';
          observations.push({ operation, ms: performance.now() - before, ok });
          outcomes[`${operation}:${status}`] = (outcomes[`${operation}:${status}`] ?? 0) + 1;
        }
      }));
    } finally { clearInterval(sampler); }
    const elapsedSeconds = (performance.now() - started) / 1000, cpu = process.cpuUsage(cpuStart);
    const invariants = {
      overCapacity: await db.all("SELECT o.id FROM offerings o JOIN enrollments e ON e.offeringId=o.id AND e.status='ACTIVE' GROUP BY o.id HAVING count(*)>o.capacity"),
      duplicateCurrent: await db.all("SELECT userId,offeringId FROM enrollments WHERE status IN ('ACTIVE','WAITLISTED') GROUP BY userId,offeringId HAVING count(*)>1"),
      foreignKeys: await db.all('PRAGMA foreign_key_check'),
    };
    for (const rows of Object.values(invariants)) assert.equal(rows.length, 0);
    const summarize = rows => ({ requests: rows.length, p50Ms: percentile(rows.map(row => row.ms), 0.5), p95Ms: percentile(rows.map(row => row.ms), 0.95), errors: rows.filter(row => !row.ok).length });
    return { schemaVersion: 1, completedAt: new Date().toISOString(), commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      scope: 'M2 harness check; in-process client and server, not an isolated capacity claim or controlled before/after comparison',
      environment: { node: process.version, sequelize: db.sequelize.constructor.version, sqlite: (await db.all('SELECT sqlite_version() AS version'))[0].version, platform: platform(), release: release(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, journal: 'WAL', localFile: true },
      scenario: { users, requestedSeconds: seconds, elapsedSeconds, syntheticStudents: 10000, offerings: 100, seed, mix: '70% catalog, 15% own history, 10% enroll, 5% cancel; cancellation falls back to enroll if no tracked attempt', warmup: 'one listing per session; excluded', model: 'closed loop, one outstanding request per user; latency includes client scheduling; completions drained' },
      aggregate: { ...summarize(observations), requestsPerSecond: observations.length / elapsedSeconds },
      operations: Object.fromEntries(['catalog', 'history', 'enroll', 'cancel'].map(operation => [operation, summarize(observations.filter(row => row.operation === operation))])), outcomes,
      resources: { scope: 'combined runner and server process, SQLite native threads included', userCpuMs: cpu.user / 1000, systemCpuMs: cpu.system / 1000, peakRssBytes }, invariants };
  } finally {
    if (running) await running.close(); if (db) await db.close();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('electiva-load-'));
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), allowed = ['--users', '--seconds', '--output'];
  if (args.length % 2 || args.some((value, index) => index % 2 === 0 && !allowed.includes(value))) throw new Error('Use --users N --seconds N --output path');
  const options = Object.fromEntries(Array.from({ length: args.length / 2 }, (_, index) => [args[index * 2].slice(2), args[index * 2 + 1]]));
  const result = await runLoad({ users: Number(options.users ?? 10), seconds: Number(options.seconds ?? 15) });
  const output = path.resolve(options.output ?? 'artifacts/raw/load.json'); await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ output, ...result.aggregate, invariants: result.invariants }));
  if (result.aggregate.errors) process.exitCode = 1;
}
