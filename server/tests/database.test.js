import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, domainFixture } from './helpers.js';
import { createDatabase } from '../src/db/database.js';

test('migrations survive reopen and every connection enforces foreign keys', async t => {
  const { db, storage } = await fixture(t);
  await domainFixture(db);
  const second = await createDatabase(storage);
  try {
    assert.equal((await second.models.Course.count()), 1);
    assert.equal((await second.all('SELECT * FROM schema_migrations')).length, 2);
    await second.write(async tx => {
      assert.equal((await second.all('PRAGMA foreign_keys', {}, tx))[0].foreign_keys, 1);
      assert.equal((await second.all('PRAGMA busy_timeout', {}, tx))[0].timeout, 0);
      await assert.rejects(second.run("INSERT INTO offerings VALUES (99, 999, 'x', 1, 0, 1, 'DRAFT', 1)", {}, tx));
    });
  } finally { await second.close(); }
});

test('raw SQL cannot oversell, duplicate membership, resurrect history or change identity', async t => {
  const { db } = await fixture(t); await domainFixture(db);
  const insert = (id, user, status) => db.run('INSERT INTO enrollments VALUES ($id, $user, 1, $status, 1, 1, NULL)', { id, user, status });
  await insert(1, 1, 'ACTIVE');
  await assert.rejects(insert(2, 2, 'ACTIVE'));
  await insert(2, 2, 'WAITLISTED');
  await assert.rejects(insert(3, 2, 'WAITLISTED'));
  await assert.rejects(db.run("UPDATE enrollments SET status='ACTIVE' WHERE id=2"));
  await assert.rejects(db.run('UPDATE offerings SET capacity=0 WHERE id=1'));
  await assert.rejects(db.run("UPDATE offerings SET lifecycle='ARCHIVED' WHERE id=1"));
  await assert.rejects(db.run('UPDATE enrollments SET userId=3 WHERE id=1'));
  await db.run("UPDATE enrollments SET status='CANCELLED', cancelledAt=2 WHERE id=1");
  await assert.rejects(db.run("UPDATE enrollments SET status='ACTIVE', cancelledAt=NULL WHERE id=1"));
  await insert(3, 1, 'WAITLISTED');
  assert.equal((await db.models.Enrollment.count()), 3);
  await assert.rejects(db.run("UPDATE users SET role='superuser' WHERE id=1"));
  await assert.rejects(db.run('UPDATE offerings SET capacity=1.5 WHERE id=1'));
});

test('a failed transaction rolls every change back', async t => {
  const { db } = await fixture(t); await domainFixture(db);
  await assert.rejects(db.write(async tx => {
    await db.run("INSERT INTO enrollments VALUES (1, 1, 1, 'ACTIVE', 1, 1, NULL)", {}, tx);
    throw new Error('injected failure');
  }), /injected failure/);
  assert.equal(await db.models.Enrollment.count(), 0);
});

test('raw course-level guards reject duplicate requests across offerings and preserve historical identity', async t => {
  const { db } = await fixture(t); await domainFixture(db);
  await db.run("INSERT INTO offerings SELECT 2,courseId,'other',capacity,opensAt,closesAt,lifecycle,1 FROM offerings WHERE id=1");
  await db.run("INSERT INTO enrollments VALUES (1,1,1,'ACTIVE',1,1,NULL)");
  await assert.rejects(db.run("INSERT INTO enrollments VALUES (2,1,2,'WAITLISTED',1,1,NULL)"));
  await assert.rejects(db.run('UPDATE offerings SET courseId=99 WHERE id=1'));
  assert.equal(await db.models.Enrollment.count(), 1);
});

test('upgrade refuses existing duplicate course requests without deleting student data', async t => {
  const { db, storage } = await fixture(t); await domainFixture(db);
  // Reproduce a pre-v2 file in this isolated fixture, then exercise actual startup.
  await db.run('DROP TRIGGER enrollment_course_insert'); await db.run('DROP TRIGGER enrollment_course_update'); await db.run('DROP TRIGGER offering_course_identity');
  await db.run('DELETE FROM schema_migrations WHERE version=2');
  await db.run("INSERT INTO offerings SELECT 2,courseId,'other',capacity,opensAt,closesAt,lifecycle,1 FROM offerings WHERE id=1");
  await db.run("INSERT INTO enrollments VALUES (1,1,1,'ACTIVE',1,1,NULL),(2,1,2,'ACTIVE',1,1,NULL)");
  await assert.rejects(createDatabase(storage), /Migration 2 blocked.*data was preserved/);
  assert.equal(await db.models.Enrollment.count(), 2);
  assert.equal((await db.all('SELECT * FROM schema_migrations')).length, 1);
});
