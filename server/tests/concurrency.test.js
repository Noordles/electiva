import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { apiFixture } from './api-helpers.js';
import { fixture, domainFixture } from './helpers.js';
import { createDatabase } from '../src/db/database.js';
import { createApplication } from '../src/application.js';
import { startServer } from '../src/server.js';
import { createEnrollmentService } from '../src/enrollment.js';
import { createAdminService } from '../src/admin.js';

test('CON: 20 authenticated HTTP sessions compete for the last seat through two app instances', async t => {
  const { db, storage, running, login, onCleanup } = await apiFixture(t);
  const secondDb = await createDatabase(storage), second = await startServer(createApplication(secondDb));
  onCleanup(async () => { await second.close(); await secondDb.close(); });
  const sessions = await Promise.all(Array.from({ length: 20 }, (_, index) => login(`student${index + 1}@example.test`)));
  const startedAt = new Date().toISOString();
  const results = await Promise.all(sessions.map(async (session, index) => {
    const origin = index % 2 ? second.url : running.url;
    const response = await fetch(origin + '/api/v1/offerings/3/enrollments', { method: 'POST', headers: { origin, cookie: session.cookie, 'x-csrf-token': session.csrfToken, 'content-type': 'application/json' }, body: '{}' });
    return { httpStatus: response.status, ...(await response.json()).data };
  }));
  assert.ok(results.every(row => row.httpStatus === 201), JSON.stringify(results));
  assert.equal(results.filter(row => row.status === 'ACTIVE').length, 1);
  assert.equal(results.filter(row => row.status === 'WAITLISTED').length, 19);
  const persisted = await db.all('SELECT id,userId,offeringId,status FROM enrollments WHERE offeringId=3 ORDER BY id');
  assert.equal(persisted.length, 20); assert.equal(new Set(persisted.map(row => row.userId)).size, 20);
  assert.equal(persisted.filter(row => row.status === 'ACTIVE').length, 1);
  assert.equal((await db.all('PRAGMA foreign_key_check')).length, 0);
  for (const row of results) assert.equal(persisted.find(saved => saved.id === row.id)?.status, row.status);
  if (process.env.ELECTIVA_CON_EVIDENCE) {
    const output = path.resolve(process.env.ELECTIVA_CON_EVIDENCE); await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify({ scope: 'Real HTTP, two app/database instances in one Node process; not yet multi-process recovery or SCL load evidence', startedAt, completedAt: new Date().toISOString(), node: process.version, concurrentRequests: 20, distinctAuthenticatedStudents: 20, serverInstances: 2, capacity: 1, active: 1, waitlisted: 19, allCreated: true, foreignKeyCheck: [], persisted }, null, 2) + '\n');
  }
});

test('CON: duplicate HTTP clicks create one attempt and return the same record', async t => {
  const { db, request, login } = await apiFixture(t); const session = await login('student1@example.test');
  const responses = await Promise.all(Array.from({ length: 20 }, () => request('/offerings/3/enrollments', { session, method: 'POST', body: {} })));
  assert.equal(responses.filter(row => row.status === 201).length, 1);
  assert.equal(responses.filter(row => row.status === 200).length, 19);
  assert.equal(new Set(responses.map(row => row.body.data.id)).size, 1);
  assert.equal(await db.models.Enrollment.count(), 1);
});

test('simultaneous cancellations and capacity changes preserve occupancy and FIFO', async t => {
  const { db } = await fixture(t); await domainFixture(db, { capacity: 2, count: 8 });
  const service = createEnrollmentService(db), admin = createAdminService(db);
  const rows = [];
  for (let user = 1; user <= 6; user += 1) rows.push(await service.enroll(user, 1));
  await Promise.all([service.cancel(1, rows[0].enrollment.id), service.cancel(2, rows[1].enrollment.id), admin.editOffering(1, { version: 1, capacity: 3 })]);
  assert.deepEqual((await db.all("SELECT userId FROM enrollments WHERE status='ACTIVE' ORDER BY id")).map(row => row.userId), [3, 4, 5]);
  const edits = await Promise.allSettled([admin.editOffering(1, { version: 2, capacity: 4 }), admin.editOffering(1, { version: 2, capacity: 5 })]);
  assert.equal(edits.filter(row => row.status === 'fulfilled').length, 1);
  assert.equal(edits.find(row => row.status === 'rejected').reason.code, 'stale_version');
  const [{ capacity }] = await db.all('SELECT capacity FROM offerings WHERE id=1');
  assert.ok((await db.all("SELECT id FROM enrollments WHERE status='ACTIVE'")).length <= capacity);
});

test('a request waiting for the writer lock checks the window after acquiring it', async t => {
  const { db } = await fixture(t); const initial = Date.now(); await domainFixture(db, { now: initial });
  let now = initial, release, acquired;
  const locked = new Promise(resolve => { acquired = resolve; }), gate = new Promise(resolve => { release = resolve; });
  const blocker = db.write(async () => { acquired(); await gate; }); await locked;
  const pending = createEnrollmentService(db, { now: () => now }).enroll(1, 1);
  await new Promise(resolve => setImmediate(resolve)); now = initial + 3600000; release(); await blocker;
  await assert.rejects(pending, error => error.code === 'window_closed');
  assert.equal(await db.models.Enrollment.count(), 0);
});
