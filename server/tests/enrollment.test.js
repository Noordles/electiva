import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, domainFixture } from './helpers.js';
import { createEnrollmentService } from '../src/enrollment.js';
import { createAdminService } from '../src/admin.js';

test('enroll, replay, FIFO promotion, cancellation replay and re-enrollment history', async t => {
  const { db } = await fixture(t); await domainFixture(db);
  const service = createEnrollmentService(db);
  const a = await service.enroll(1, 1), b = await service.enroll(2, 1), c = await service.enroll(3, 1);
  assert.equal(a.enrollment.status, 'ACTIVE'); assert.equal(b.enrollment.status, 'WAITLISTED');
  assert.equal((await service.enroll(1, 1)).created, false);
  await assert.rejects(service.cancel(4, a.enrollment.id), error => error.status === 404);
  await service.cancel(1, a.enrollment.id); await service.cancel(1, a.enrollment.id);
  assert.equal((await db.all('SELECT status FROM enrollments WHERE id=$id', { id: b.enrollment.id }))[0].status, 'ACTIVE');
  assert.equal((await db.all('SELECT status FROM enrollments WHERE id=$id', { id: c.enrollment.id }))[0].status, 'WAITLISTED');
  const again = await service.enroll(1, 1);
  assert.notEqual(again.enrollment.id, a.enrollment.id); assert.equal(again.enrollment.status, 'WAITLISTED');
  assert.equal(await db.models.Enrollment.count(), 4);
});

test('cancel and promotion roll back together on a real failure', async t => {
  const { db } = await fixture(t); await domainFixture(db);
  const service = createEnrollmentService(db), broken = createEnrollmentService(db, { afterCancellation: () => { throw new Error('injected failure'); } });
  const a = await service.enroll(1, 1); await service.enroll(2, 1);
  await assert.rejects(broken.cancel(1, a.enrollment.id), /injected failure/);
  assert.deepEqual((await db.all('SELECT status FROM enrollments ORDER BY id')).map(row => row.status), ['ACTIVE', 'WAITLISTED']);
});

test('server time boundaries block writes and capacity edits promote the oldest waiters', async t => {
  const { db } = await fixture(t); const time = Date.now(); await domainFixture(db, { now: time });
  let now = time; const service = createEnrollmentService(db, { now: () => now }), admin = createAdminService(db, { now: () => now });
  const a = await service.enroll(1, 1); await service.enroll(2, 1); await service.enroll(3, 1);
  await assert.rejects(admin.editOffering(1, { version: 1, capacity: 0 }), error => error.code === 'capacity_below_occupancy');
  await admin.editOffering(1, { version: 1, capacity: 2 });
  assert.deepEqual((await db.all('SELECT status FROM enrollments ORDER BY id')).map(row => row.status), ['ACTIVE', 'ACTIVE', 'WAITLISTED']);
  await assert.rejects(admin.editOffering(1, { version: 1, capacity: 3 }), error => error.code === 'stale_version');
  await assert.rejects(admin.editOffering(1, { version: 2 }, 'archive'), error => error.code === 'current_memberships');
  now = time + 3600000;
  await assert.rejects(service.enroll(4, 1), error => error.code === 'window_closed');
  await assert.rejects(service.cancel(1, a.enrollment.id), error => error.code === 'window_closed');
  await admin.editOffering(1, { version: 2, capacity: 3 });
  assert.equal((await db.all("SELECT count(*) AS n FROM enrollments WHERE status='ACTIVE'"))[0].n, 2);
  now = time - 3600000; assert.equal((await service.enroll(4, 1)).enrollment.status, 'WAITLISTED');
  assert.equal((await db.all("SELECT count(*) AS n FROM enrollments WHERE status='ACTIVE'"))[0].n, 3);
});

test('admin validation, draft/publish/archive transitions and unique course codes', async t => {
  const { db } = await fixture(t), admin = createAdminService(db);
  const course = await admin.createCourse({ code: 'web-2', title: 'Interfaces', description: 'Accessible interfaces', department: 'Informatics', credits: 5 });
  assert.equal(course.code, 'WEB-2');
  await assert.rejects(admin.createCourse({ code: 'WEB-2', title: 'Duplicate', description: 'Test', department: 'Test', credits: 5 }));
  assert.equal((await admin.editCourse(course.id, { title: 'Changed title' })).title, 'Changed title');
  await assert.rejects(admin.editCourse(999, { credits: 4 }), error => error.status === 404);
  for (const body of [{}, { credits: 0 }, { role: 'admin' }, { code: '<bad>' }]) await assert.rejects(admin.editCourse(course.id, body), error => error.status === 422);
  const body = { courseId: course.id, term: '2026', capacity: 1, opensAt: new Date(0).toISOString(), closesAt: new Date(Date.now() + 3600000).toISOString() };
  await assert.rejects(admin.createOffering({ ...body, courseId: 999 }), error => error.status === 404);
  await assert.rejects(admin.createOffering({ ...body, closesAt: body.opensAt }), error => error.status === 422);
  const offering = await admin.createOffering(body), service = createEnrollmentService(db);
  await assert.rejects(service.enroll(1, offering.id), error => error.code === 'offering_not_available');
  assert.equal((await admin.editOffering(offering.id, { version: 1 }, 'publish')).lifecycle, 'PUBLISHED');
  assert.equal((await admin.editOffering(offering.id, { version: 2 }, 'archive')).lifecycle, 'ARCHIVED');
  await assert.rejects(admin.editOffering(offering.id, { version: 3, capacity: 2 }), error => error.code === 'offering_archived');
  await assert.rejects(service.enroll(1, 999), error => error.status === 404);
  await assert.rejects(service.cancel(1, 999), error => error.status === 404);
});
