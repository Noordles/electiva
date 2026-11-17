import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { cpus, platform, release, tmpdir, totalmem } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createDatabase } from '../../server/src/db/database.js';
import { applicationProcess } from '../runtime/process.mjs';
import { capacityFixture } from './fixture.mjs';

export const percentile = (values, fraction) => values.length ? [...values].sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * fraction) - 1)] : null;
export async function capacityScenario({ users, fixtureClock, warmupSeconds = 3, seconds = 12, recoverySeconds = 3, seed = 20261117, think = true }) {
  if (!Number.isInteger(users) || users < 1 || users > 400 || seconds < 1 || seconds > 120) throw new Error('Bounded capacity scenario required');
  const directory = await mkdtemp(path.join(tmpdir(), 'electiva-capacity-')); let db, service;
  try {
    db = await createDatabase(path.join(directory, 'capacity.sqlite'));
    const fixture = await capacityFixture(db, fixtureClock);
    service = await applicationProcess({ storage: path.join(directory, 'capacity.sqlite') });
    const sessions = [];
    for (let first = 0; first < users; first += 20) {
      sessions.push(...await Promise.all(Array.from({ length: Math.min(20, users - first) }, async (_, offset) => {
        const response = await fetch(service.url + '/api/v1/auth/login', { method: 'POST', headers: { origin: service.url, 'content-type': 'application/json' }, body: JSON.stringify({ email: `student${first + offset + 1}@example.test`, password: fixture.accounts.password }) });
        assert.equal(response.status, 200, 'Scenario login failed');
        return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: (await response.json()).data.csrfToken, rng: (seed + first + offset) >>> 0, membership: null };
      })));
    }
    const observations = [], outcomes = {};
    async function phase(duration, measure) {
      const started = performance.now(), end = started + duration * 1000;
      await Promise.all(sessions.map(async session => {
        const random = () => { session.rng = (1664525 * session.rng + 1013904223) >>> 0; return session.rng / 4294967296; };
        // Stagger initial requests; otherwise a login barrier creates an artificial thundering herd.
        if (think) await sleep(random() * 1000);
        while (performance.now() < end) {
          const choice = random(); let operation, route, method = 'GET';
          if (choice < 0.7) { operation = 'catalog'; route = `/offerings?pageSize=20&page=${1 + Math.floor(random() * 5)}&sort=title`; }
          else if (choice < 0.85) { operation = 'history'; route = '/me/enrollments?pageSize=20'; }
          else if (choice < 0.95 || !session.membership) { operation = 'enroll'; route = `/offerings/${1 + Math.floor(random() * 100)}/enrollments`; method = 'POST'; }
          else { operation = 'cancel'; route = `/me/enrollments/${session.membership}/cancel`; method = 'POST'; }
          const before = performance.now(); let status = 'network_error';
          try {
            const response = await fetch(service.url + '/api/v1' + route, { method, signal: AbortSignal.timeout(5000), headers: { cookie: session.cookie, ...(method === 'POST' ? { origin: service.url, 'x-csrf-token': session.csrf, 'content-type': 'application/json' } : {}) }, ...(method === 'POST' ? { body: '{}' } : {}) });
            status = String(response.status); const body = await response.json();
            if (operation === 'enroll' && response.ok) session.membership = body.data.id;
            if (operation === 'cancel' && response.ok) session.membership = null;
          } catch (error) { status = error.name === 'TimeoutError' ? 'timeout' : 'network_error'; }
          if (measure) {
            observations.push({ operation, ms: performance.now() - before, ok: status === '200' || status === '201' });
            outcomes[`${operation}:${status}`] = (outcomes[`${operation}:${status}`] ?? 0) + 1;
          }
          if (think) await sleep(500 + random() * 1000);
        }
      }));
      return { requestedSeconds: duration, drainedSeconds: (performance.now() - started) / 1000 };
    }
    await phase(warmupSeconds, false); await service.rpc('metrics-reset');
    const startedAt = new Date().toISOString(), timing = await phase(seconds, true), resources = await service.rpc('metrics');
    const recoveryStarted = performance.now(); await sleep(recoverySeconds * 1000);
    const recovered = await fetch(service.url + '/api/v1/offerings?pageSize=20', { headers: { cookie: sessions[0].cookie }, signal: AbortSignal.timeout(5000) });
    assert.equal(recovered.status, 200); await recovered.arrayBuffer();
    const recoveryMs = performance.now() - recoveryStarted - recoverySeconds * 1000;
    await service.close(); service = null; // Quiesce all writes before the SQL audit.
    const invariants = {
      overCapacity: await db.all("SELECT o.id FROM offerings o JOIN enrollments e ON e.offeringId=o.id AND e.status='ACTIVE' GROUP BY o.id HAVING count(*)>o.capacity"),
      duplicateCurrent: await db.all("SELECT userId,offeringId FROM enrollments WHERE status IN ('ACTIVE','WAITLISTED') GROUP BY userId,offeringId HAVING count(*)>1"), foreignKeys: await db.all('PRAGMA foreign_key_check'),
    };
    for (const rows of Object.values(invariants)) assert.equal(rows.length, 0);
    const summarize = rows => ({ requests: rows.length, errors: rows.filter(row => !row.ok).length, p50Ms: percentile(rows.map(row => row.ms), 0.5), p95Ms: percentile(rows.map(row => row.ms), 0.95) });
    return { startedAt, completedAt: new Date().toISOString(), users, warmupSeconds, ...timing, recoverySeconds, recoveryMs,
      fixture: fixture.manifest, aggregate: { ...summarize(observations), requestsPerSecond: observations.length / timing.drainedSeconds },
      operations: Object.fromEntries(['catalog', 'history', 'enroll', 'cancel'].map(operation => [operation, summarize(observations.filter(row => row.operation === operation))])), outcomes, resources, invariants,
      model: { seed, thinkMs: think ? [500, 1500] : [0, 0], initialStaggerMs: think ? [0, 1000] : [0, 0], mix: '70/15/10/5 catalog/history/enroll/cancel; cancel falls back to enrollment when no tracked attempt', requestTimeoutMs: 5000, clientServerSeparateProcesses: true, sameMachine: true, loginExcluded: true, requestedWindowAndDrainReported: true },
      environment: { node: process.version, sqlite: (await db.all('SELECT sqlite_version() AS version'))[0].version, platform: platform(), release: release(), cpu: cpus()[0].model, logicalCpus: cpus().length, totalMemoryBytes: totalmem(), powerMode: 'not controlled or independently measured', journal: 'WAL' } };
  } finally {
    if (service) await service.close(); if (db) await db.close();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('electiva-capacity-'));
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), options = Object.fromEntries(Array.from({ length: args.length / 2 }, (_, index) => [args[index * 2]?.replace(/^--/, ''), args[index * 2 + 1]]));
  if (!options.output || args.length % 2 || Object.keys(options).some(key => !['output', 'clock', 'users', 'repetitions', 'seconds', 'think'].includes(key))) throw new Error('Use --output path [--clock epoch] [--users 10,50,100] [--repetitions 3] [--seconds 12] [--think true]');
  const users = (options.users ?? '10,50,100').split(',').map(Number), repetitions = Number(options.repetitions ?? 3), fixtureClock = Number(options.clock ?? Date.now());
  if (!Number.isSafeInteger(repetitions) || repetitions < 1 || repetitions > 3 || users.length > 5) throw new Error('Bounded run required');
  const output = path.resolve(options.output); await mkdir(path.dirname(output), { recursive: true });
  const report = { schemaVersion: 1, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), fixtureClock, protocol: '3s warmup /12s steady /3s recovery by default; short classroom benchmark, not a long-duration SLA. All scenarios reset the same domain fixture. No public target.', runs: [] };
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    for (const count of users) {
      const run = await capacityScenario({ users: count, fixtureClock, seconds: Number(options.seconds ?? 12), think: options.think !== 'false' }); run.repetition = repetition;
      report.runs.push(run); await writeFile(output, JSON.stringify(report, null, 2) + '\n');
      console.log(JSON.stringify({ repetition, users: count, listingP95: run.operations.catalog.p95Ms, rps: run.aggregate.requestsPerSecond, errors: run.aggregate.errors, recoveredMs: run.recoveryMs }));
      if (run.aggregate.errors / run.aggregate.requests >= 0.05 || run.resources.peakRssBytes > 1024 ** 3) { report.stoppedForResourceSafety = true; await writeFile(output, JSON.stringify(report, null, 2) + '\n'); process.exitCode = 0; break; }
    }
    if (report.stoppedForResourceSafety) break;
  }
}
