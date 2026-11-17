import express from 'express';
import { pathToFileURL } from 'node:url';
import { startServer } from '../server/src/server.js';

export const directoryCourses = [
  { code: 'EXT-DATA', title: 'Data Storytelling', description: 'Turn a careful analysis into a clear visual explanation, with attention to uncertainty and context.', department: 'Data Science', credits: 5 },
  { code: 'EXT-WEB', title: 'Accessible Web Interfaces', description: 'Build semantic, keyboard-friendly interfaces and test them with realistic user journeys.', department: 'Informatics', credits: 5 },
];
export function directorySimulator({ fault = () => 'none' } = {}) {
  const app = express(); app.disable('x-powered-by');
  app.get('/v1/courses/:code', (req, res) => {
    const mode = fault();
    if (mode === 'timeout') return;
    if (mode === 'error') return res.status(500).json({ error: 'simulated failure' });
    if (mode === 'invalid') return res.json({ schemaVersion: 99, data: {} });
    if (mode === 'oversized') return res.json({ padding: 'x'.repeat(40000) });
    if (mode === 'redirect') return res.redirect('http://127.0.0.1:1/private');
    const data = directoryCourses.find(row => row.code === req.params.code);
    return data ? res.json({ schemaVersion: 1, data }) : res.status(404).json({ error: 'not_found' });
  });
  return app;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.DIRECTORY_PORT ?? 3100);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid DIRECTORY_PORT');
  const running = await startServer(directorySimulator(), { port });
  console.log(`Local course directory simulator: ${running.url}`);
  const stop = () => running.close(); process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
