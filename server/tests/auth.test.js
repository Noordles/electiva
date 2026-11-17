import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.js';
import { createApp } from '../src/app.js';
import { startServer } from '../src/server.js';
import { createAuth, hashPassword, verifyPassword } from '../src/auth.js';

test('salted passwords, private session cookies, CSRF, expiry and logout', async t => {
  const password = 'Correct horse 2026!';
  const hash = await hashPassword(password);
  assert.notEqual(hash, await hashPassword(password));
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
  assert.equal(await verifyPassword(password, 'malformed'), false);
  await assert.rejects(hashPassword('short'));
  const { db } = await fixture(t);
  await db.run("INSERT INTO users VALUES (1, 'noor@example.test', 'Noor', $hash, 'student', 0)", { hash });
  let now = Date.now();
  const auth = createAuth(db, { now: () => now, loginLimit: 20 });
  const running = await startServer(createApp({ configureRoutes: app => {
    auth.mount(app);
    app.get('/api/v1/admin-test', auth.session, auth.role('admin'), (_req, res) => res.json({ data: true }));
  } }));
  t.after(() => running.close());
  const login = (body, origin = running.url) => fetch(running.url + '/api/v1/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(body) });
  assert.equal((await login({ email: 'noor@example.test', password }, 'https://evil.test')).status, 403);
  assert.equal((await login({ email: 'noor@example.test', password: 'wrong' })).status, 401);
  assert.equal((await login({ email: 'missing@example.test', password: 'wrong' })).status, 401);
  assert.equal((await login({ email: 'noor@example.test', password, role: 'admin' })).status, 422);
  const response = await login({ email: ' NOOR@example.test ', password });
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.equal(data.user.role, 'student'); assert.equal(data.user.passwordHash, undefined);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const headers = { cookie, origin: running.url, 'content-type': 'application/json' };
  const stored = (await db.all('SELECT * FROM sessions'))[0];
  assert.equal(cookie.includes(stored.tokenHash), false);
  assert.equal((await fetch(running.url + '/api/v1/admin-test', { headers })).status, 403);
  assert.equal((await fetch(running.url + '/api/v1/auth/me', { headers })).status, 200);
  assert.equal((await fetch(running.url + '/api/v1/auth/csrf', { headers }).then(r => r.json())).data.csrfToken, data.csrfToken);
  const logout = extra => fetch(running.url + '/api/v1/auth/logout', { method: 'POST', headers: { ...headers, ...extra }, body: '{}' });
  assert.equal((await logout({})).status, 403);
  assert.equal((await logout({ 'x-csrf-token': '0'.repeat(64) })).status, 403);
  assert.equal((await logout({ 'x-csrf-token': data.csrfToken })).status, 204);
  assert.equal((await fetch(running.url + '/api/v1/auth/me', { headers })).status, 401);
  const nextSession = await login({ email: 'noor@example.test', password });
  now += 9 * 3600000;
  assert.equal((await fetch(running.url + '/api/v1/auth/me', { headers: { cookie: nextSession.headers.get('set-cookie').split(';')[0] } })).status, 401);
  assert.equal((await db.all('SELECT * FROM sessions WHERE expiresAt > $now', { now })).length, 0);
});

test('login limits are bounded and expire; anonymous and duplicate cookies are rejected', async t => {
  const { db } = await fixture(t); let now = 0;
  const auth = createAuth(db, { now: () => now, loginLimit: 2, secureCookies: true });
  const running = await startServer(createApp({ configureRoutes: auth.mount })); t.after(() => running.close());
  const login = () => fetch(running.url + '/api/v1/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: running.url }, body: JSON.stringify({ email: 'missing@example.test', password: 'wrong' }) });
  assert.equal((await login()).status, 401); assert.equal((await login()).status, 401); assert.equal((await login()).status, 429);
  now += 300001; assert.equal((await login()).status, 401);
  for (const cookie of ['', 'electiva_session=bad', `electiva_session=${'a'.repeat(64)}; electiva_session=${'b'.repeat(64)}`]) {
    assert.equal((await fetch(running.url + '/api/v1/auth/me', { headers: { cookie } })).status, 401);
  }
});
