import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, domainFixture } from './helpers.js';
import { listCatalog, catalogQuery, offeringSelect, offeringView } from '../src/catalog.js';

test('catalog filters, stable SQL pagination, dates and advisory seat counts', async t => {
  const { db } = await fixture(t); const now = Date.now(); await domainFixture(db, { now });
  await db.run("INSERT INTO offerings VALUES (2,1,'next-term',3,$opens,$closes,'PUBLISHED',1)", { opens: now + 10000, closes: now + 100000 });
  await db.run("INSERT INTO offerings VALUES (3,1,'next-term',3,0,1,'DRAFT',1)");
  const first = await listCatalog(db, { pageSize: '1' }, now);
  assert.equal(first.meta.total, 2); assert.equal(first.data[0].id, 1);
  assert.equal(first.data[0].availableSeats, 1); assert.equal(first.data[0].enrollmentOpen, true);
  assert.match(first.data[0].closesAt, /Z$/); assert.equal(first.data[0].passwordHash, undefined);
  assert.equal((await listCatalog(db, { pageSize: '1', page: '2' }, now)).data[0].id, 2);
  assert.equal((await listCatalog(db, { q: 'web', department: 'Informatics', term: 'next-term', open: 'false', sort: 'opensAt', order: 'desc' }, now)).data[0].id, 2);
  assert.equal((await listCatalog(db, { open: 'true' }, now)).meta.total, 1);
  for (const q of ['%', '_', "' OR 1=1 --", '\\', 'absent']) assert.equal((await listCatalog(db, { q }, now)).meta.total, 0);
  assert.equal((await listCatalog(db, { page: '99' }, now)).data.length, 0);
  for (const query of [{ sort: 'constructor' }, { sort: 'title;DROP TABLE users' }, { page: '-1' }, { pageSize: '101' }, { page: '1.5' }, { q: ['a', 'b'] }, { open: 'yes' }, { unknown: 'x' }, { order: 'oops' }, { q: 'x'.repeat(201) }]) {
    await assert.rejects(listCatalog(db, query, now), error => error.status === 400);
  }
  assert.equal(await db.models.User.count(), 4);
});

test('page-first counts preserve baseline rows, counts, filtering and stable ordering', async t => {
  const { db } = await fixture(t), now = Date.now(); await domainFixture(db, { now });
  await db.run("INSERT INTO courses VALUES(2,'AAA','Inclusive Web Design','Other metadata','Design',4,NULL)");
  for (let index = 2; index <= 8; index += 1) await db.run("INSERT INTO offerings VALUES($id,$courseId,'next',2,$open,$close,'PUBLISHED',1)", { id: index, courseId: index % 2 + 1, open: now - index * 1000, close: now + 10000 });
  await db.run("INSERT INTO enrollments VALUES(1,1,1,'ACTIVE',$now,$now,NULL),(2,2,1,'WAITLISTED',$now,$now,NULL),(3,3,1,'CANCELLED',$now,$now,$now)", { now });
  for (const sort of ['title', 'code', 'opensAt']) for (const order of ['asc', 'desc']) for (const page of ['1', '2']) {
    const query = { sort, order, page, pageSize: '3', q: 'web' };
    const normalized = catalogQuery(query, now);
    const baseline = await db.all(`${offeringSelect} WHERE ${normalized.where} ORDER BY ${normalized.order} LIMIT $pageSize OFFSET $offset`, normalized.bind);
    assert.deepEqual((await listCatalog(db, query, now)).data, baseline.map(row => offeringView(row, now)));
  }
  const row = (await listCatalog(db, { sort: 'opensAt', order: 'desc' }, now)).data.find(row => row.id === 1);
  assert.equal(row.activeCount, 1); assert.equal(row.waitlistCount, 1); assert.equal(row.cancelledCount, 1);
});
