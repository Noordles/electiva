import { HttpError } from './errors.js';

export function requireOpen(offering, now) {
  if (offering.lifecycle !== 'PUBLISHED') throw new HttpError(409, 'offering_not_available', 'This offering is not available');
  if (now < offering.opensAt || now >= offering.closesAt) throw new HttpError(409, 'window_closed', 'The enrollment window is closed');
}
export const enrollmentView = row => ({ ...row, createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString(), cancelledAt: row.cancelledAt === null ? null : new Date(row.cancelledAt).toISOString() });

// Caller holds the IMMEDIATE transaction. No HTTP calls or password hashing here.
export async function promote(db, offering, now, tx) {
  if (offering.lifecycle !== 'PUBLISHED' || now < offering.opensAt || now >= offering.closesAt) return [];
  const [{ count }] = await db.all("SELECT count(*) AS count FROM enrollments WHERE offeringId=$id AND status='ACTIVE'", { id: offering.id }, tx);
  const vacancies = offering.capacity - count;
  if (vacancies <= 0) return [];
  const queue = await db.all("SELECT id FROM enrollments WHERE offeringId=$id AND status='WAITLISTED' ORDER BY id LIMIT $vacancies", { id: offering.id, vacancies }, tx);
  for (const row of queue) await db.run("UPDATE enrollments SET status='ACTIVE', updatedAt=$now WHERE id=$id", { id: row.id, now }, tx);
  return queue.map(row => row.id);
}

export function createEnrollmentService(db, { now = Date.now, afterCancellation = async () => {} } = {}) {
  return {
    enroll(userId, offeringId) {
      return db.write(async tx => {
        const [offering] = await db.all('SELECT * FROM offerings WHERE id=$id', { id: offeringId }, tx);
        if (!offering) throw new HttpError(404, 'not_found', 'Offering not found');
        const current = now(); // Check time after lock acquisition, including retries.
        requireOpen(offering, current);
        const [existing] = await db.all("SELECT * FROM enrollments WHERE userId=$userId AND offeringId=$offeringId AND status IN ('ACTIVE','WAITLISTED')", { userId, offeringId }, tx);
        if (existing) return { enrollment: enrollmentView(existing), created: false };
        await promote(db, offering, current, tx);
        const [{ count }] = await db.all("SELECT count(*) AS count FROM enrollments WHERE offeringId=$offeringId AND status='ACTIVE'", { offeringId }, tx);
        const status = count < offering.capacity ? 'ACTIVE' : 'WAITLISTED';
        await db.run('INSERT INTO enrollments(userId,offeringId,status,createdAt,updatedAt) VALUES ($userId,$offeringId,$status,$now,$now)', { userId, offeringId, status, now: current }, tx);
        const [row] = await db.all('SELECT * FROM enrollments WHERE id=last_insert_rowid()', {}, tx);
        return { enrollment: enrollmentView(row), created: true };
      });
    },
    cancel(userId, enrollmentId) {
      return db.write(async tx => {
        const [row] = await db.all('SELECT * FROM enrollments WHERE id=$id AND userId=$userId', { id: enrollmentId, userId }, tx);
        if (!row) throw new HttpError(404, 'not_found', 'Enrollment not found');
        const [offering] = await db.all('SELECT * FROM offerings WHERE id=$id', { id: row.offeringId }, tx);
        const current = now(); requireOpen(offering, current);
        if (row.status !== 'CANCELLED') {
          await db.run("UPDATE enrollments SET status='CANCELLED', updatedAt=$now, cancelledAt=$now WHERE id=$id", { id: row.id, now: current }, tx);
          await afterCancellation(); // Dependency-injected fault probe, never an HTTP option.
          await promote(db, offering, current, tx);
        }
        return enrollmentView((await db.all('SELECT * FROM enrollments WHERE id=$id', { id: row.id }, tx))[0]);
      });
    },
  };
}
