import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from '../server/src/config.js';
import { createDatabase } from '../server/src/db/database.js';
import { seedDatabase } from '../server/src/db/seed.js';

const config = loadConfig();
if (process.argv.includes('--seed') && config.mode === 'production') throw new Error('Synthetic seeding is disabled in production');
const db = await createDatabase(config.databasePath);
try {
  if (process.argv.includes('--seed')) {
    const accounts = await seedDatabase(db, { large: process.argv.includes('--large') });
    const destination = path.join(path.dirname(config.databasePath), 'demo-accounts.json');
    await writeFile(destination, JSON.stringify(accounts, null, 2) + '\n', { mode: 0o600 });
    console.log(`Synthetic data ready: ${accounts.students} students, ${accounts.courses} courses. Local demo credentials: ${destination}`);
  } else console.log('Database migrations are up to date');
} finally { await db.close(); }
