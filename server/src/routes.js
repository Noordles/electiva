import { HttpError } from './errors.js';
import { createAuth } from './auth.js';
import { createEnrollmentService, enrollmentView } from './enrollment.js';
import { createAdminService } from './admin.js';
import { listCatalog, offeringSelect, offeringView } from './catalog.js';
import { id, object, paging, paged } from './validation.js';
import { createDirectory } from './directory.js';

const dates = row => ({ ...row, opensAt: new Date(row.opensAt).toISOString(), closesAt: new Date(row.closesAt).toISOString() });
export function businessRoutes(db, options = {}) {
  const now = options.now ?? Date.now;
  const auth = createAuth(db, options), enrollment = createEnrollmentService(db, options), admin = createAdminService(db, options);
  const directory = createDirectory(db, options.directory);
  return app => {
    auth.mount(app);
    const student = [auth.session, auth.role('student')], administrator = [auth.session, auth.role('admin')];
    app.get('/api/v1/offerings', auth.session, async (req, res) => res.json(await listCatalog(db, req.query, now())));
    app.get('/api/v1/offerings/facets', auth.session, async (_req, res) => {
      const departments = await db.all("SELECT DISTINCT c.department FROM courses c JOIN offerings o ON o.courseId=c.id WHERE o.lifecycle='PUBLISHED' ORDER BY c.department LIMIT 200");
      res.json({ data: { departments: departments.map(row => row.department) } });
    });
    app.get('/api/v1/offerings/:id', auth.session, async (req, res) => {
      const [row] = await db.all(`${offeringSelect} WHERE o.id=$id AND o.lifecycle='PUBLISHED'`, { id: id(req.params.id) });
      if (!row) throw new HttpError(404, 'not_found', 'Offering not found');
      res.json({ data: offeringView(row, now()) });
    });
    app.post('/api/v1/offerings/:id/enrollments', ...student, ...auth.mutation, async (req, res) => {
      object(req.body, []);
      const result = await enrollment.enroll(req.user.id, id(req.params.id));
      if (result.created) res.setHeader('Location', `/api/v1/me/enrollments/${result.enrollment.id}`);
      res.status(result.created ? 201 : 200).json({ data: result.enrollment });
    });
    app.get('/api/v1/me/enrollments', ...student, async (req, res) => {
      const page = paging(req.query);
      const bind = { userId: req.user.id, ...page };
      const [{ total }] = await db.all('SELECT count(*) AS total FROM enrollments WHERE userId=$userId', bind);
      const rows = await db.all('SELECT e.*, c.title, c.code FROM enrollments e JOIN offerings o ON o.id=e.offeringId JOIN courses c ON c.id=o.courseId WHERE e.userId=$userId ORDER BY e.id DESC LIMIT $pageSize OFFSET $offset', bind);
      res.json(paged(rows.map(enrollmentView), total, page));
    });
    app.get('/api/v1/me/enrollments/:id', ...student, async (req, res) => {
      const [row] = await db.all('SELECT * FROM enrollments WHERE id=$id AND userId=$userId', { id: id(req.params.id), userId: req.user.id });
      if (!row) throw new HttpError(404, 'not_found', 'Enrollment not found');
      res.json({ data: enrollmentView(row) });
    });
    app.post('/api/v1/me/enrollments/:id/cancel', ...student, ...auth.mutation, async (req, res) => {
      object(req.body, []); res.json({ data: await enrollment.cancel(req.user.id, id(req.params.id)) });
    });
    app.get('/api/v1/admin/courses', ...administrator, async (req, res) => {
      const page = paging(req.query), [{ total }] = await db.all('SELECT count(*) AS total FROM courses');
      res.json(paged(await db.all('SELECT * FROM courses ORDER BY code,id LIMIT $pageSize OFFSET $offset', page), total, page));
    });
    app.post('/api/v1/admin/courses', ...administrator, ...auth.mutation, async (req, res) => res.status(201).json({ data: await admin.createCourse(req.body) }));
    app.patch('/api/v1/admin/courses/:id', ...administrator, ...auth.mutation, async (req, res) => res.json({ data: await admin.editCourse(id(req.params.id), req.body) }));
    app.get('/api/v1/admin/offerings', ...administrator, async (req, res) => {
      const page = paging(req.query), [{ total }] = await db.all('SELECT count(*) AS total FROM offerings');
      res.json(paged((await db.all(`${offeringSelect} ORDER BY o.id DESC LIMIT $pageSize OFFSET $offset`, page)).map(row => offeringView(row, now())), total, page));
    });
    app.post('/api/v1/admin/offerings', ...administrator, ...auth.mutation, async (req, res) => res.status(201).json({ data: dates(await admin.createOffering(req.body)) }));
    app.patch('/api/v1/admin/offerings/:id', ...administrator, ...auth.mutation, async (req, res) => res.json({ data: dates(await admin.editOffering(id(req.params.id), req.body)) }));
    for (const action of ['publish', 'archive']) app.post(`/api/v1/admin/offerings/:id/${action}`, ...administrator, ...auth.mutation, async (req, res) => res.json({ data: dates(await admin.editOffering(id(req.params.id), req.body, action)) }));
    app.get('/api/v1/admin/offerings/:id/roster', ...administrator, async (req, res) => {
      const offeringId = id(req.params.id), page = paging(req.query, ['status']);
      if (req.query.status !== undefined && !['ACTIVE', 'WAITLISTED', 'CANCELLED'].includes(req.query.status)) throw new HttpError(400, 'invalid_query', 'Invalid roster status');
      if (!(await db.all('SELECT id FROM offerings WHERE id=$id', { id: offeringId })).length) throw new HttpError(404, 'not_found', 'Offering not found');
      const where = `e.offeringId=$offeringId${req.query.status ? ' AND e.status=$status' : ''}`, bind = { offeringId, status: req.query.status ?? '', ...page };
      const [{ total }] = await db.all(`SELECT count(*) AS total FROM enrollments e WHERE ${where}`, bind);
      const rows = await db.all(`SELECT e.*, u.displayName, u.email FROM enrollments e JOIN users u ON u.id=e.userId WHERE ${where} ORDER BY e.id LIMIT $pageSize OFFSET $offset`, bind);
      res.json(paged(rows.map(enrollmentView), total, page));
    });
    app.get('/api/v1/admin/reports/enrollments', ...administrator, async (req, res) => {
      const page = paging(req.query, ['term']);
      if ((req.query.term?.length ?? 0) > 40) throw new HttpError(400, 'invalid_query', 'Invalid term');
      const bind = { ...page, term: req.query.term ?? '' }, where = req.query.term ? ' WHERE o.term=$term' : '';
      const [{ total }] = await db.all(`SELECT count(*) AS total FROM offerings o${where}`, bind);
      const rows = await db.all(`${offeringSelect}${where} ORDER BY o.id LIMIT $pageSize OFFSET $offset`, bind);
      // Aggregate only: never expose students or credentials through reports.
      res.json(paged(rows.map(({ id, code, title, term, capacity, activeCount, waitlistCount }) => ({ id, code, title, term, capacity, activeCount, waitlistCount })), total, page));
    });
    app.get('/api/v1/admin/directory/courses/:code', ...administrator, async (req, res) => res.json({ data: await directory.preview(req.params.code) }));
    app.post('/api/v1/admin/directory/import', ...administrator, ...auth.mutation, async (req, res) => {
      const result = await directory.importCourse(req.body); res.status(result.created ? 201 : 200).json({ data: result.course });
    });
  };
}
