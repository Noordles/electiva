import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export async function applicationProcess(options) {
  const child = fork(fileURLToPath(new URL('./worker.mjs', import.meta.url)), [], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  let nextId = 1, logs = '', closed = false;
  child.stderr.on('data', chunk => { logs = (logs + chunk.toString()).slice(-10000); });
  const pending = new Map(), events = new Map();
  child.on('message', message => {
    if (message.event) { events.get(message.event)?.(); return; }
    const entry = pending.get(message.id); if (!entry) return;
    clearTimeout(entry.timer); pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error)); else entry.resolve(message.result);
  });
  const ended = new Promise(resolve => child.once('exit', (code, signal) => {
    closed = true;
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error(`Worker exited (${code ?? signal}): ${logs}`)); }
    pending.clear(); resolve();
  }));
  const rpc = (command, options) => new Promise((resolve, reject) => {
    if (closed) return reject(new Error('Worker is closed'));
    const id = nextId++;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Worker command timed out: ${command}`)); }, 20000);
    pending.set(id, { resolve, reject, timer }); child.send({ id, command, options });
  });
  const kill = async () => { if (!closed) child.kill('SIGKILL'); await ended; };
  try {
    const started = await rpc('start', options);
    return { ...started, rpc, waitFor: event => new Promise(resolve => events.set(event, resolve)), kill,
      async close() { if (!closed) { try { await rpc('stop'); await ended; } catch (error) { await kill(); throw error; } } }, logs: () => logs };
  } catch (error) { await kill(); throw error; }
}
