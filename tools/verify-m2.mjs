import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';

if (!process.env.npm_execpath) throw new Error('Run through npm run verify:m2');
const directory = 'artifacts/m2'; await mkdir(directory, { recursive: true });
const sourceFiles = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file); else sourceFiles.push(file);
  }
}
for (const directory of ['server/src', 'server/tests', 'client/src', 'client/tests', 'tools', '.github']) await collect(directory);
sourceFiles.push('package.json', 'package-lock.json', 'client/index.html', 'client/vite.config.js');
const sources = [];
for (const file of sourceFiles.sort()) sources.push({ file: file.replaceAll('\\', '/'), sha256: createHash('sha256').update(await readFile(file)).digest('hex') });
const receipt = { startedAt: new Date().toISOString(), commitBeforeRun: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceTreeSha256: createHash('sha256').update(JSON.stringify(sources)).digest('hex'), sources, node: process.version,
  scope: 'Local M2 verification. Source hashes identify exact tested files even if commitBeforeRun has uncommitted changes.', checks: [] };
const commands = [
  ['tests', ['test']], ['coverage', ['run', 'test:coverage']], ['build', ['run', 'build']],
  ['browser', ['run', 'test:e2e']], ['concurrency', ['run', 'test:concurrency']],
  ['load-smoke', ['run', 'load:smoke']], ['audit', ['audit', '--json']],
];
for (const [name, args] of commands) {
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, [process.env.npm_execpath, ...args], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); }); child.stderr.on('data', chunk => { output += chunk.toString(); });
  const exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  await writeFile(`${directory}/${name}.txt`, output);
  receipt.checks.push({ name, command: `npm ${args.join(' ')}`, startedAt, completedAt: new Date().toISOString(), exitCode, output: `${directory}/${name}.txt` });
  console.log(`${name}: ${exitCode === 0 ? 'passed' : 'FAILED'} (exit ${exitCode})`);
  if (exitCode !== 0) { process.exitCode = 1; break; }
}
if (receipt.checks.find(row => row.name === 'coverage')?.exitCode === 0) await copyFile('coverage/coverage-summary.json', `${directory}/coverage-summary.json`);
receipt.completedAt = new Date().toISOString();
await writeFile(`${directory}/verification.json`, JSON.stringify(receipt, null, 2) + '\n');
