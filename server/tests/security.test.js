import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFixture } from './api-helpers.js';
import { fixture } from './helpers.js';
import { hashPassword } from '../src/auth.js';
import { createDatabase } from '../src/db/database.js';

test('all management reads and writes reject students, hostile origins and identity fields', async t => {
  const { request, login, running, accounts } = await apiFixture(t, { secureCookies: true });
  const student = await login('student1@example.test'), admin = await login('admin@example.test');
  for (const route of ['/admin/courses', '/admin/offerings', '/admin/offerings/1/roster', '/admin/reports/enrollments', '/admin/directory/courses/EXT-DATA']) {
    assert.equal((await request(route)).status, 401);
    assert.equal((await request(route, { session: student })).status, 403);
  }
  for (const [method, route] of [['POST', '/admin/courses'], ['PATCH', '/admin/courses/1'], ['POST', '/admin/offerings'], ['PATCH', '/admin/offerings/1'], ['POST', '/admin/offerings/1/publish'], ['POST', '/admin/offerings/1/archive'], ['POST', '/admin/directory/import']]) assert.equal((await request(route, { session: student, method, body: {} })).status, 403);
  for (const origin of ['', 'null', 'https://evil.test', running.url + '.evil.test']) assert.equal((await request('/offerings/1/enrollments', { session: student, method: 'POST', body: {}, headers: { origin, host: 'evil.test' } })).status, 403);
  for (const body of [[], { userId: 999 }, { role: 'admin' }, JSON.parse('{"__proto__":{"role":"admin"}}')]) assert.equal((await request('/offerings/1/enrollments', { session: student, method: 'POST', body })).status, 422);
  assert.equal((await request('/offerings/1/enrollments', { session: student, method: 'POST', body: null })).status, 400);
  assert.equal((await request('/admin/courses?q=%25', { session: admin })).body.meta.total, 0);
  assert.equal((await request('/admin/courses?q=web&q=data', { session: admin })).status, 400);
  assert.equal((await request('/admin/courses?q=' + 'x'.repeat(201), { session: admin })).status, 400);
  const cookieLogin = await request('/auth/login', { method: 'POST', body: { email: 'student3@example.test', password: accounts.password } });
  assert.equal(cookieLogin.status, 200); assert.match(cookieLogin.response.headers.get('set-cookie'), /; Secure/);
  const notFound = await request('/me/enrollments/999', { session: student }); assert.equal(notFound.status, 404);
  assert.doesNotMatch(JSON.stringify(notFound.body), /sqlite|password|token|stack/i);
});

test('password whitespace is significant and invalid UTC dates are rejected', async t => {
  const { db, request, login } = await apiFixture(t);
  const password = '  Whitespace matters 2026  ';
  await db.run('UPDATE users SET passwordHash=$hash WHERE id=2', { hash: await hashPassword(password) });
  assert.equal((await request('/auth/login', { method: 'POST', body: { email: 'student1@example.test', password: password.trim() } })).status, 401);
  const signedIn = await request('/auth/login', { method: 'POST', body: { email: 'student1@example.test', password } });
  assert.equal(signedIn.status, 200); assert.match(signedIn.response.headers.get('set-cookie'), /HttpOnly/);
  const admin = await login('admin@example.test');
  for (const opensAt of ['2026-02-30T00:00:00Z', '2026-01-01T00:00:00+02:00', 'yesterday']) {
    assert.equal((await request('/admin/offerings', { session: admin, method: 'POST', body: { courseId: 1, term: 'test', capacity: 1, opensAt, closesAt: '2026-12-01T00:00:00Z' } })).status, 422);
  }
});

test('busy retry is bounded and migration checksum mismatch fails safely', async t => {
  const { db, storage } = await fixture(t);
  const transaction = db.sequelize.transaction.bind(db.sequelize); let calls = 0;
  db.sequelize.transaction = async () => { calls += 1; throw Object.assign(new Error('locked'), { original: { code: 'SQLITE_BUSY' } }); };
  await assert.rejects(db.write(() => {}), error => error.status === 503 && error.code === 'temporarily_busy');
  assert.equal(calls, 5);
  const unexpected = new Error('unexpected'); db.sequelize.transaction = async () => { throw unexpected; };
  await assert.rejects(db.write(() => {}), error => error === unexpected);
  db.sequelize.transaction = transaction;
  await db.run("UPDATE schema_migrations SET checksum='mismatch' WHERE version=1");
  await assert.rejects(createDatabase(storage), /Migration 1 has changed/);
  assert.equal(await db.models.Course.count(), 0);
});
