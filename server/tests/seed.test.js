import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.js';
import { seedDatabase } from '../src/db/seed.js';

test('large synthetic seed contains 10,000 students and refuses to overwrite data', async t => {
  const { db } = await fixture(t);
  const seeded = await seedDatabase(db, { large: true });
  assert.equal(seeded.students, 10000); assert.ok(seeded.password.length >= 12);
  assert.equal(await db.models.User.count({ where: { role: 'student' } }), 10000);
  assert.equal(await db.models.Course.count(), 100); assert.equal(await db.models.Offering.count(), 100);
  assert.equal((await db.all('PRAGMA foreign_key_check')).length, 0);
  await assert.rejects(seedDatabase(db), /empty database/);
  assert.equal(await db.models.User.count(), 10001);
});
