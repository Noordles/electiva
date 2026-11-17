import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('load CLI rejects unsafe bounds and unsupported flags before generating traffic', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'electiva-command-'));
  try {
    for (const args of [['--users', '401'], ['--seconds', '0'], ['--target', 'https://example.test']]) {
      const result = spawnSync(process.execPath, ['tools/load/capacity.mjs', '--output', path.join(directory, 'result.json'), ...args], { encoding: 'utf8', timeout: 20000 });
      assert.equal(result.error, undefined); assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Bounded capacity scenario required|Use --output/);
    }
    assert.deepEqual(await readdir(directory), []);
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('electiva-command-'));
    await rm(directory, { recursive: true, force: true });
  }
});
