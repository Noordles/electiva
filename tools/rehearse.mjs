import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

if (!process.env.npm_execpath) throw new Error('Use npm run rehearse');
const directory = await mkdtemp(path.join(tmpdir(), 'electiva-rehearsal-'));
const checkout = path.join(directory, 'checkout'), database = path.join(directory, 'data', 'demo.sqlite');
const env = { ...process.env, DATABASE_PATH: database, NODE_ENV: 'development', COOKIE_SECURE: 'false', PORT: '0' };
const receipt = { startedAt: new Date().toISOString(), commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), scope: 'Fresh local clone and npm ci/migrate/seed/build/production HTTP behavior; npm registry and browser cache are external dependencies, no node_modules copied', commands: [] };
let service;
try {
  execFileSync('git', ['clone', '--no-hardlinks', '--quiet', process.cwd(), checkout], { stdio: 'pipe' });
  for (const args of [['ci'], ['run', 'db:migrate'], ['run', 'db:seed'], ['run', 'build']]) {
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [process.env.npm_execpath, ...args], { cwd: checkout, env, stdio: ['ignore', 'pipe', 'pipe'] }); let output = '';
      child.stdout.on('data', chunk => { output += chunk.toString(); }); child.stderr.on('data', chunk => { output += chunk.toString(); });
      child.once('error', reject); child.once('exit', exitCode => resolve({ command: `npm ${args.join(' ')}`, exitCode, output }));
    });
    receipt.commands.push(result); console.log(`${result.command}: ${result.exitCode === 0 ? 'passed' : 'FAILED'}`); assert.equal(result.exitCode, 0);
  }
  const accounts = JSON.parse(await readFile(path.join(directory, 'data/demo-accounts.json'), 'utf8'));
  const index = await readFile(path.join(checkout, 'client/dist/index.html'), 'utf8');
  const entrypoint = index.match(/src="(\/assets\/[^" ]+\.js)"/);
  assert.ok(entrypoint, 'Built entrypoint missing');
  const bundle = await readFile(path.join(checkout, 'client/dist', entrypoint[1]), 'utf8');
  assert.equal(bundle.includes('react.dev/link/react-devtools'), false, 'Development React was included in the production bundle');
  receipt.productionBundle = { inheritedNodeEnv: env.NODE_ENV, developmentNoticeAbsent: true, entrypoint: entrypoint[1], bytes: Buffer.byteLength(bundle) };
  service = spawn(process.execPath, ['server/src/start.js', '--production'], { cwd: checkout, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const ended = new Promise(resolve => service.once('exit', resolve));
  const url = await new Promise((resolve, reject) => {
    let output = ''; const timeout = setTimeout(() => reject(new Error('Production startup timeout')), 20000);
    service.stdout.on('data', chunk => { output += chunk.toString(); const match = output.match(/Electiva API: (http:\/\/127\.0\.0\.1:\d+)/); if (match) { clearTimeout(timeout); resolve(match[1]); } });
    service.once('exit', code => { clearTimeout(timeout); reject(new Error(`Production exited before ready: ${code}`)); });
  });
  const login = await fetch(url + '/api/v1/auth/login', { method: 'POST', headers: { origin: url, 'content-type': 'application/json' }, body: JSON.stringify({ email: accounts.studentEmail, password: accounts.password }) });
  assert.equal(login.status, 200); const body = await login.json(), cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(url + '/api/v1/offerings', { headers: { cookie } })).status, 200);
  assert.equal((await fetch(url + '/api/v1/offerings/3/enrollments', { method: 'POST', headers: { origin: url, cookie, 'x-csrf-token': body.data.csrfToken, 'content-type': 'application/json' }, body: '{}' })).status, 201);
  assert.equal((await fetch(url + '/courses')).status, 200);
  assert.equal((await fetch(url + '/api/v1/unknown', { headers: { accept: 'text/html' } })).status, 404);
  assert.equal((await fetch(url + '/assets/unknown.js')).status, 404);
  receipt.production = { ready: (await fetch(url + '/ready')).status, login: 200, authenticatedListing: 200, csrfEnrollment: 201, spaRoute: 200, apiMiss: 404, assetMiss: 404 };
  service.kill(); await ended; service = null;
} finally {
  if (service) { const ended = new Promise(resolve => service.once('exit', resolve)); service.kill(); await ended; }
  receipt.completedAt = new Date().toISOString(); await mkdir('artifacts/m3', { recursive: true }); await writeFile('artifacts/m3/clean-rehearsal.json', JSON.stringify(receipt, null, 2) + '\n');
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('electiva-rehearsal-'));
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
