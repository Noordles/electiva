import { HttpError } from './errors.js';
import { paging, paged } from './validation.js';

export const offeringSelect = `SELECT o.*, c.code, c.title, c.description, c.department, c.credits,
  (SELECT count(*) FROM enrollments e WHERE e.offeringId=o.id AND e.status='ACTIVE') AS activeCount,
  (SELECT count(*) FROM enrollments e WHERE e.offeringId=o.id AND e.status='WAITLISTED') AS waitlistCount,
  (SELECT count(*) FROM enrollments e WHERE e.offeringId=o.id AND e.status='CANCELLED') AS cancelledCount
  FROM offerings o JOIN courses c ON c.id=o.courseId`;
export const offeringView = (row, now) => ({ ...row, opensAt: new Date(row.opensAt).toISOString(), closesAt: new Date(row.closesAt).toISOString(),
  availableSeats: row.capacity - row.activeCount, enrollmentOpen: row.lifecycle === 'PUBLISHED' && now >= row.opensAt && now < row.closesAt });

export function catalogQuery(query, now) {
  const page = paging(query, ['q', 'term', 'department', 'open', 'sort', 'order']);
  const sorts = { title: 'c.title COLLATE NOCASE', code: 'c.code COLLATE NOCASE', opensAt: 'o.opensAt' };
  const sort = query.sort ?? 'title', order = query.order ?? 'asc';
  if (!Object.hasOwn(sorts, sort) || !['asc', 'desc'].includes(order) || (query.open !== undefined && !['true', 'false'].includes(query.open))) throw new HttpError(400, 'invalid_query', 'Invalid filter or order');
  const clauses = ["o.lifecycle='PUBLISHED'"], bind = { ...page };
  for (const [key, column] of [['q', null], ['term', 'o.term'], ['department', 'c.department']]) {
    if (query[key] === undefined) continue;
    const value = query[key].trim();
    if (value.length > 200) throw new HttpError(400, 'invalid_query', 'Filter is too long');
    if (!value) continue;
    if (key === 'q') {
      bind.q = `%${value.replace(/[\\%_]/g, '\\$&')}%`;
      clauses.push("(c.title LIKE $q ESCAPE '\\' OR c.code LIKE $q ESCAPE '\\')");
    } else { bind[key] = value; clauses.push(`${column}=$${key}`); }
  }
  if (query.open !== undefined) { bind.now = now; clauses.push(`${query.open === 'false' ? 'NOT ' : ''}(o.opensAt <= $now AND o.closesAt > $now)`); }
  return { page, bind, where: clauses.join(' AND '), order: `${sorts[sort]} ${order.toUpperCase()}, o.id ASC` };
}

export async function listCatalog(db, query, now) {
  const { page, bind, where, order } = catalogQuery(query, now);
  const [{ total }] = await db.all(`SELECT count(*) AS total FROM offerings o JOIN courses c ON c.id=o.courseId WHERE ${where}`, bind);
  const rows = await db.all(`${offeringSelect} WHERE ${where} ORDER BY ${order} LIMIT $pageSize OFFSET $offset`, bind);
  return paged(rows.map(row => offeringView(row, now)), total, page);
}
