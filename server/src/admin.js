import { HttpError } from './errors.js';
import { object, text, integer, date, invalid } from './validation.js';
import { promote } from './enrollment.js';

export function courseFields(body, partial = false) {
  object(body, ['code', 'title', 'description', 'department', 'credits']);
  const fields = {};
  for (const [key, max] of [['code', 24], ['title', 160], ['description', 4000], ['department', 100]]) {
    if (!partial || body[key] !== undefined) fields[key] = text(body[key], key, max);
  }
  if (fields.code !== undefined) {
    fields.code = fields.code.toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]*$/.test(fields.code)) invalid('Code must use letters, numbers or hyphens');
  }
  if (!partial || body.credits !== undefined) fields.credits = integer(body.credits, 'Credits', 1, 60);
  if (!Object.keys(fields).length) invalid('Provide a field to update');
  return fields;
}
export function offeringFields(body, partial = false) {
  object(body, partial ? ['term', 'capacity', 'opensAt', 'closesAt', 'version'] : ['courseId', 'term', 'capacity', 'opensAt', 'closesAt']);
  const fields = {};
  if (!partial) fields.courseId = integer(body.courseId, 'Course ID', 1);
  if (!partial || body.term !== undefined) fields.term = text(body.term, 'Term', 40);
  if (!partial || body.capacity !== undefined) fields.capacity = integer(body.capacity, 'Capacity', 0, 10000);
  for (const key of ['opensAt', 'closesAt']) if (!partial || body[key] !== undefined) fields[key] = date(body[key], key);
  return fields;
}
// Only keys produced by the validators reach SQL; values always use bindings.
export async function updateFields(db, table, id, fields, tx) {
  await db.run(`UPDATE ${table} SET ${Object.keys(fields).map(key => `${key}=$${key}`).join(',')} WHERE id=$id`, { ...fields, id }, tx);
}
export function createAdminService(db, { now = Date.now } = {}) {
  return {
    async createCourse(body) {
      const fields = courseFields(body);
      return db.write(async tx => {
        await db.run('INSERT INTO courses(code,title,description,department,credits) VALUES ($code,$title,$description,$department,$credits)', fields, tx);
        return (await db.all('SELECT * FROM courses WHERE id=last_insert_rowid()', {}, tx))[0];
      });
    },
    async editCourse(id, body) {
      const fields = courseFields(body, true);
      return db.write(async tx => {
        if (!(await db.all('SELECT id FROM courses WHERE id=$id', { id }, tx)).length) throw new HttpError(404, 'not_found', 'Course not found');
        await updateFields(db, 'courses', id, fields, tx);
        return (await db.all('SELECT * FROM courses WHERE id=$id', { id }, tx))[0];
      });
    },
    async createOffering(body) {
      const fields = offeringFields(body);
      if (fields.closesAt <= fields.opensAt) invalid('Enrollment must close after it opens');
      return db.write(async tx => {
        if (!(await db.all('SELECT id FROM courses WHERE id=$id', { id: fields.courseId }, tx)).length) throw new HttpError(404, 'not_found', 'Course not found');
        await db.run('INSERT INTO offerings(courseId,term,capacity,opensAt,closesAt) VALUES ($courseId,$term,$capacity,$opensAt,$closesAt)', fields, tx);
        return (await db.all('SELECT * FROM offerings WHERE id=last_insert_rowid()', {}, tx))[0];
      });
    },
    async editOffering(id, body, action) {
      const fields = action ? {} : offeringFields(body, true);
      if (action) object(body, ['version']);
      const version = integer(body.version, 'Version', 1);
      return db.write(async tx => {
        const [existing] = await db.all('SELECT * FROM offerings WHERE id=$id', { id }, tx);
        if (!existing) throw new HttpError(404, 'not_found', 'Offering not found');
        if (existing.version !== version) throw new HttpError(409, 'stale_version', 'This offering changed. Reload before saving');
        if (existing.lifecycle === 'ARCHIVED') throw new HttpError(409, 'offering_archived', 'Archived offerings cannot be edited');
        const updated = { ...existing, ...fields, version: version + 1 };
        if (updated.closesAt <= updated.opensAt) invalid('Enrollment must close after it opens');
        if (action === 'publish') updated.lifecycle = 'PUBLISHED';
        if (action === 'archive') {
          if ((await db.all("SELECT id FROM enrollments WHERE offeringId=$id AND status IN ('ACTIVE','WAITLISTED') LIMIT 1", { id }, tx)).length) throw new HttpError(409, 'current_memberships', 'Cancel current memberships before archiving');
          updated.lifecycle = 'ARCHIVED';
        }
        const [{ count }] = await db.all("SELECT count(*) AS count FROM enrollments WHERE offeringId=$id AND status='ACTIVE'", { id }, tx);
        if (updated.capacity < count) throw new HttpError(409, 'capacity_below_occupancy', 'Capacity cannot be below occupied seats');
        await updateFields(db, 'offerings', id, { ...fields, lifecycle: updated.lifecycle, version: updated.version }, tx);
        await promote(db, updated, now(), tx);
        return (await db.all('SELECT * FROM offerings WHERE id=$id', { id }, tx))[0];
      });
    },
  };
}
