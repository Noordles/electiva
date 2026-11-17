import { HttpError } from './errors.js';
import { courseFields, updateFields } from './admin.js';
import { object, text } from './validation.js';

export function createDirectory(db, { baseUrl = 'http://127.0.0.1:3100', timeoutMs = 2000 } = {}) {
  const url = new URL(baseUrl);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Directory must use a fixed local HTTP origin');
  const preview = async code => {
    code = text(code, 'Directory code', 24).toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]*$/.test(code)) throw new HttpError(422, 'invalid_fields', 'Invalid directory code');
    let response;
    try {
      response = await fetch(new URL(`/v1/courses/${encodeURIComponent(code)}`, url), { redirect: 'error', signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
      if (response.status === 404) throw new HttpError(404, 'directory_not_found', 'Directory course not found');
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Invalid directory response');
      const reader = response.body.getReader(); let size = 0; const chunks = [];
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          size += value.length;
          if (size > 32768) throw new Error('Directory response too large');
          chunks.push(value);
        }
      } finally { await reader.cancel().catch(() => {}); }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (body.schemaVersion !== 1) throw new Error('Unsupported directory schema');
      const fields = courseFields(body.data);
      if (fields.code !== code) throw new Error('Mismatched directory code');
      return { schemaVersion: 1, data: fields, source: 'local-course-directory-simulator' };
    } catch (error) {
      if (error instanceof HttpError && error.code === 'directory_not_found') throw error;
      if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new HttpError(504, 'directory_timeout', 'The course directory did not respond in time');
      throw new HttpError(502, 'directory_unavailable', 'The course directory is unavailable or returned invalid data');
    }
  };
  return { preview, async importCourse(body) {
    object(body, ['code']);
    const result = await preview(body.code); // Finish external I/O before acquiring SQLite's writer lock.
    return db.write(async tx => {
      const fields = { ...result.data, externalCode: result.data.code };
      const [existing] = await db.all('SELECT * FROM courses WHERE externalCode=$externalCode', fields, tx);
      if (existing) {
        await updateFields(db, 'courses', existing.id, fields, tx);
        return { course: (await db.all('SELECT * FROM courses WHERE id=$id', { id: existing.id }, tx))[0], created: false };
      }
      await db.run('INSERT INTO courses(code,title,description,department,credits,externalCode) VALUES ($code,$title,$description,$department,$credits,$externalCode)', fields, tx);
      return { course: (await db.all('SELECT * FROM courses WHERE id=last_insert_rowid()', {}, tx))[0], created: true };
    });
  } };
}
