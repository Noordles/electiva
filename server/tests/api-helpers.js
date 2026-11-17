import assert from 'node:assert/strict';
import { fixture } from './helpers.js';
import { seedDatabase } from '../src/db/seed.js';
import { createApplication } from '../src/application.js';
import { startServer } from '../src/server.js';

export async function apiFixture(t, options = {}) {
  const { db, storage, onCleanup } = await fixture(t);
  const accounts = await seedDatabase(db);
  const running = await startServer(createApplication(db, { ...options, loginLimit: 100 }));
  onCleanup(() => running.close());
  const request = async (route, { session, method = 'GET', body, headers = {} } = {}) => {
    const response = await fetch(running.url + '/api/v1' + route, { method,
      headers: { ...(session ? { cookie: session.cookie, 'x-csrf-token': session.csrfToken } : {}), ...(method !== 'GET' ? { 'content-type': 'application/json', origin: running.url } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const result = response.status === 204 ? null : await response.json();
    return { status: response.status, body: result, response };
  };
  const login = async email => {
    const result = await request('/auth/login', { method: 'POST', body: { email, password: accounts.password } });
    assert.equal(result.status, 200);
    return { ...result.body.data, cookie: result.response.headers.get('set-cookie').split(';')[0] };
  };
  return { db, storage, running, request, login, onCleanup, accounts };
}
