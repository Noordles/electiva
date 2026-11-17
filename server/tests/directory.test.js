import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.js';
import { createDirectory } from '../src/directory.js';
import { directorySimulator } from '../../tools/directory-simulator.js';
import { startServer } from '../src/server.js';

test('real HTTP directory preview/import is idempotent and failure leaves no partial course', async t => {
  const { db } = await fixture(t); let mode = 'none';
  const running = await startServer(directorySimulator({ fault: () => mode })); t.after(() => running.close());
  // Successful traffic uses the real two-second contract. Only the deliberate
  // timeout fixture needs a short deadline; concurrent suite startup can exceed100ms.
  const directory = createDirectory(db, { baseUrl: running.url });
  assert.equal((await directory.preview('ext-data')).data.title, 'Data Storytelling');
  const first = await directory.importCourse({ code: 'EXT-DATA' }); assert.equal(first.created, true);
  const repeat = await directory.importCourse({ code: 'EXT-DATA' }); assert.equal(repeat.created, false); assert.equal(first.course.id, repeat.course.id);
  assert.equal(await db.models.Course.count(), 1);
  await assert.rejects(directory.preview('missing'), error => error.status === 404);
  await assert.rejects(directory.preview('../private'), error => error.status === 422);
  await assert.rejects(directory.importCourse({ code: 'EXT-WEB', url: 'https://evil.test' }), error => error.status === 422);
  for (const [fault, status] of [['error', 502], ['invalid', 502], ['oversized', 502], ['redirect', 502], ['timeout', 504]]) {
    mode = fault;
    const subject = fault === 'timeout' ? createDirectory(db, { baseUrl: running.url, timeoutMs: 100 }) : directory;
    await assert.rejects(subject.importCourse({ code: 'EXT-WEB' }), error => error.status === status);
    assert.equal(await db.models.Course.count(), 1);
  }
  for (const baseUrl of ['https://127.0.0.1:3100', 'http://example.test', 'http://127.0.0.1:3100/path', 'http://user:pass@127.0.0.1:3100']) assert.throws(() => createDirectory(db, { baseUrl }));
});
