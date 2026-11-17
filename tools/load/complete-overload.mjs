import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { cpus, platform, release } from 'node:os';
import assert from 'node:assert/strict';
import { capacityScenario } from './capacity.mjs';

// Resume the explicitly documented pause without replacing earlier measurements.
const file = 'artifacts/capacity/optimized-saturation.json';
const report = JSON.parse(await readFile(file, 'utf8'));
assert.equal(report.stoppedForResourceSafety, undefined, 'Do not resume a resource safety stop');
assert.ok([6, 7, 8, 9].includes(report.runs.length), 'Unexpected checkpoint layout');
const expected = [100, 200, 400];
for (let index = 0; index < report.runs.length; index += 1) {
  const run = report.runs[index];
  assert.equal(run.users, expected[index % 3]); assert.equal(run.repetition, Math.floor(index / 3) + 1);
  assert.deepEqual(run.model.thinkMs, [0, 0]); assert.equal(run.requestedSeconds, 12);
  assert.equal(run.environment.node, process.version); assert.equal(run.environment.platform, platform());
  assert.equal(run.environment.release, release()); assert.equal(run.environment.cpu, cpus()[0].model);
}
const diff = execFileSync('git', ['diff', report.commit, '--', 'server/src', 'tools/runtime', 'tools/load/fixture.mjs'], { encoding: 'utf8' });
assert.equal(diff, '', 'The measured application/runtime/fixture changed; use a new experiment');
if (!report.resume) {
  await copyFile(file, 'artifacts/capacity/optimized-saturation-interrupted.json');
  report.resume = { startedAt: new Date().toISOString(), checkpointRuns: report.runs.length,
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    note: 'Student-authorized continuation after pause; earlier six runs preserved. Application/runtime/fixture diff verified empty; only CLI finite-value validation and this resume control were added.' };
}
for (let index = report.runs.length; index < 9; index += 1) {
  const run = await capacityScenario({ users: expected[index % 3], fixtureClock: report.fixtureClock, seconds: 12, think: false });
  assert.equal(run.fixture.logicalSha256, report.runs[0].fixture.logicalSha256);
  run.repetition = 3; run.measurementCommit = report.resume.commit; report.runs.push(run);
  await writeFile(file, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ repetition: 3, users: run.users, listingP95: run.operations.catalog.p95Ms, requests: run.aggregate.requests, errors: run.aggregate.errors }));
  if (run.aggregate.errors / run.aggregate.requests >= 0.05 || run.resources.peakRssBytes > 1024 ** 3) { report.stoppedForResourceSafety = true; break; }
}
report.resume.completedAt = new Date().toISOString();
await writeFile(file, JSON.stringify(report, null, 2) + '\n');
