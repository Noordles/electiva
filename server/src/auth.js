import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from './errors.js';
import { object, text, invalid } from './validation.js';

const scrypt = promisify(scryptCallback);
const SESSION_MS = 8 * 60 * 60 * 1000;
const token = () => randomBytes(32).toString('hex');
const digest = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) invalid('Password must contain 12–128 characters');
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${hash.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const parts = String(encoded).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt' || parts.slice(1, 4).join('$') !== '16384$8$1' || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{128}$/.test(parts[5])) return false;
  const actual = await scrypt(password, parts[4], 64, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(actual, Buffer.from(parts[5], 'hex'));
}
let dummyHash;
const publicUser = user => ({ id: user.id, email: user.email, displayName: user.displayName, role: user.role });

export function createAuth(db, { now = Date.now, secureCookies = false, allowedOrigins = ['http://127.0.0.1:5173'], loginLimit = 10 } = {}) {
  const attempts = new Map();
  const cookie = (value, age) => `electiva_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secureCookies ? '; Secure' : ''}`;
  const origin = (req, _res, next) => {
    const direct = `http${req.socket.encrypted ? 's' : ''}://127.0.0.1:${req.socket.localPort}`;
    if (!req.headers.origin || ![direct, ...allowedOrigins].includes(req.headers.origin)) throw new HttpError(403, 'invalid_origin', 'Request origin is not allowed');
    next();
  };
  const session = async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const values = (req.headers.cookie ?? '').split(';').map(part => part.trim()).filter(part => part.startsWith('electiva_session='));
    if (values.length !== 1 || !/^electiva_session=[a-f0-9]{64}$/.test(values[0])) throw new HttpError(401, 'not_authenticated', 'Sign in to continue');
    const tokenHash = digest(values[0].slice('electiva_session='.length));
    const [row] = await db.all('SELECT u.id, u.email, u.displayName, u.role, s.csrfToken, s.tokenHash FROM sessions s JOIN users u ON u.id=s.userId WHERE s.tokenHash=$tokenHash AND s.expiresAt > $now', { tokenHash, now: now() });
    if (!row) throw new HttpError(401, 'not_authenticated', 'Sign in to continue');
    req.user = publicUser(row); req.session = row;
    next();
  };
  const role = expected => (req, _res, next) => {
    if (req.user.role !== expected) throw new HttpError(403, 'forbidden', 'This action is not available for your role');
    next();
  };
  const csrf = (req, _res, next) => {
    const supplied = req.headers['x-csrf-token'];
    if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(req.session.csrfToken))) throw new HttpError(403, 'invalid_csrf', 'Please refresh your session and try again');
    next();
  };
  const mount = app => {
    app.post('/api/v1/auth/login', origin, async (req, res) => {
      object(req.body, ['email', 'password']);
      const email = text(req.body.email, 'Email', 254).toLowerCase();
      // Password whitespace is significant; only display fields are trimmed.
      const password = req.body.password;
      if (typeof password !== 'string' || password.length < 1 || password.length > 128) invalid('Password must contain 1–128 characters');
      const current = now();
      for (const [key, entry] of attempts) if (entry.until <= current) attempts.delete(key);
      const keys = [`ip:${req.socket.remoteAddress}`, `account:${email}`];
      if (attempts.size >= 2000 || keys.some(key => (attempts.get(key)?.count ?? 0) >= loginLimit)) throw new HttpError(429, 'login_limited', 'Too many sign-in attempts. Try again in five minutes');
      for (const key of keys) { const entry = attempts.get(key) ?? { count: 0, until: current + 300000 }; entry.count += 1; attempts.set(key, entry); }
      const [user] = await db.all('SELECT * FROM users WHERE email=$email', { email });
      dummyHash ??= hashPassword('not-a-real-account-password');
      const valid = await verifyPassword(password, user?.passwordHash ?? await dummyHash);
      if (!user || !valid) throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect');
      const rawToken = token(), csrfToken = token(), tokenHash = digest(rawToken);
      await db.write(async tx => {
        await db.run('DELETE FROM sessions WHERE expiresAt <= $now', { now: current }, tx);
        await db.run('INSERT INTO sessions VALUES ($tokenHash, $userId, $csrfToken, $expiresAt, $now)', { tokenHash, userId: user.id, csrfToken, expiresAt: current + SESSION_MS, now: current }, tx);
      });
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Set-Cookie', cookie(rawToken, SESSION_MS / 1000));
      res.json({ data: { user: publicUser(user), csrfToken } });
    });
    app.get('/api/v1/auth/me', session, (req, res) => res.json({ data: req.user }));
    app.get('/api/v1/auth/csrf', session, (req, res) => res.json({ data: { csrfToken: req.session.csrfToken } }));
    app.post('/api/v1/auth/logout', session, origin, csrf, async (req, res) => {
      await db.write(tx => db.run('DELETE FROM sessions WHERE tokenHash=$hash', { hash: req.session.tokenHash }, tx));
      res.setHeader('Set-Cookie', cookie('', 0)); res.status(204).end();
    });
  };
  return { mount, session, role, mutation: [origin, csrf] };
}
