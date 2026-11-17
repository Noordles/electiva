// Isolated local test/load service. Control travels only over the parent IPC pipe.
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { createDatabase } from '../../server/src/db/database.js';
import { createApplication } from '../../server/src/application.js';
import { startServer } from '../../server/src/server.js';

let db, running, timer, cpuStart, peakRssBytes, acquisitionRetries = 0, transactionRetries = 0;
const loop = monitorEventLoopDelay({ resolution: 20 });
const stop = async () => { clearInterval(timer); loop.disable(); if (running) await running.close(); if (db) await db.close(); };
process.on('message', async ({ id, command, options }) => {
  try {
    let result;
    if (command === 'start') {
      if (db) throw new Error('Already started');
      db = await createDatabase(options.storage, { onAcquisitionRetry: () => { acquisitionRetries += 1; }, onTransactionRetry: () => { transactionRetries += 1; } });
      running = await startServer(createApplication(db, { loginLimit: 1000, ...(options.pauseCancellation ? { afterCancellation: () => new Promise(() => process.send({ event: 'cancellation-held' })) } : {}) }));
      result = { url: running.url, pid: process.pid };
    } else if (command === 'metrics-reset') {
      cpuStart = process.cpuUsage(); peakRssBytes = process.memoryUsage().rss; acquisitionRetries = 0; transactionRetries = 0;
      loop.reset(); loop.enable(); clearInterval(timer); timer = setInterval(() => { peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss); }, 100);
      result = true;
    } else if (command === 'metrics') {
      const cpu = process.cpuUsage(cpuStart);
      result = { userCpuMs: cpu.user / 1000, systemCpuMs: cpu.system / 1000, peakRssBytes, acquisitionRetries, transactionRetries,
        eventLoopP95Ms: loop.percentile(95) / 1e6, eventLoopMaxMs: loop.max / 1e6 };
    } else if (command === 'stop') { await stop(); result = true; }
    else throw new Error('Unknown control command');
    process.send({ id, result }, () => { if (command === 'stop') process.disconnect(); });
  } catch (error) { process.send({ id, error: error.message }); }
});
process.once('disconnect', () => { void stop(); });
