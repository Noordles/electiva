import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fixture } from './helpers.js';
import { seedDatabase } from '../src/db/seed.js';
import { applicationProcess } from '../../tools/runtime/process.mjs';

test('two independent API processes preserve last-seat/FIFO state, including crash rollback and restart', { timeout: 60000 }, async t => {
  const { db, storage, onCleanup } = await fixture(t), accounts = await seedDatabase(db);
  const first = await applicationProcess({ storage }), second = await applicationProcess({ storage });
  onCleanup(() => second.close()); onCleanup(() => first.close());
  const login = async index => {
    const response = await fetch(first.url + '/api/v1/auth/login', { method: 'POST', headers: { origin: first.url, 'content-type': 'application/json' }, body: JSON.stringify({ email: `student${index}@example.test`, password: accounts.password }) });
    assert.equal(response.status, 200); return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: (await response.json()).data.csrfToken };
  };
  const sessions = await Promise.all(Array.from({ length: 20 }, (_, index) => login(index + 1)));
  const mutate = async (origin, session, route) => {
    const response = await fetch(origin + '/api/v1' + route, { method: 'POST', signal: AbortSignal.timeout(15000), headers: { origin, cookie: session.cookie, 'x-csrf-token': session.csrf, 'content-type': 'application/json' }, body: '{}' });
    return { status: response.status, body: await response.json() };
  };
  const outcomes = await Promise.all(sessions.map((session, index) => mutate(index % 2 ? first.url : second.url, session, '/offerings/3/enrollments')));
  assert.ok(outcomes.every(row => row.status === 201));
  assert.equal(outcomes.filter(row => row.body.data.status === 'ACTIVE').length, 1);
  assert.equal(outcomes.filter(row => row.body.data.status === 'WAITLISTED').length, 19);
  const before = await db.all('SELECT * FROM enrollments WHERE offeringId=3 ORDER BY id');
  const active = before.find(row => row.status === 'ACTIVE'), ownerIndex = active.userId - 2;
  const failing = await applicationProcess({ storage, pauseCancellation: true }); onCleanup(() => failing.close());
  const held = failing.waitFor('cancellation-held');
  const cancelledRequest = mutate(failing.url, sessions[ownerIndex], `/me/enrollments/${active.id}/cancel`).catch(() => null);
  await held; await failing.kill(); await cancelledRequest;
  const afterCrash = await db.all('SELECT * FROM enrollments WHERE offeringId=3 ORDER BY id');
  assert.deepEqual(afterCrash, before);
  await first.close(); await second.close();
  const restarted = await applicationProcess({ storage }); onCleanup(() => restarted.close());
  const cancellation = await mutate(restarted.url, sessions[ownerIndex], `/me/enrollments/${active.id}/cancel`); assert.equal(cancellation.status, 200);
  const after = await db.all('SELECT * FROM enrollments WHERE offeringId=3 ORDER BY id');
  assert.equal(after.find(row => row.id === active.id).status, 'CANCELLED');
  assert.equal(after.find(row => row.status === 'ACTIVE').id, before.find(row => row.status === 'WAITLISTED').id);
  assert.equal(after.filter(row => row.status === 'ACTIVE').length, 1);
  assert.equal((await db.all('PRAGMA foreign_key_check')).length, 0);
  assert.equal((await fetch(restarted.url + '/api/v1/me/enrollments', { headers: { cookie: sessions[ownerIndex].cookie } })).status, 200);
  if (process.env.ELECTIVA_PROCESS_EVIDENCE) {
    await mkdir('artifacts/m3', { recursive: true });
    await writeFile('artifacts/m3/process-concurrency.json', JSON.stringify({ completedAt: new Date().toISOString(), distinctStudents: 20, distinctServerPids: [first.pid, second.pid], active: 1, waitlisted: 19, allCreated: true, crashDuringCancellationRolledBack: true, sessionsSurviveRestart: true, fifoAfterRestart: true, persisted: after.map(({ id, userId, status }) => ({ id, userId, status })) }, null, 2) + '\n');
  }
});
