import { createHash } from 'node:crypto';
import { seedDatabase } from '../../server/src/db/seed.js';

export async function capacityFixture(db, now) {
  const accounts = await seedDatabase(db, { large: true, now });
  await db.write(async tx => {
    for (let offeringId = 1; offeringId <= 100; offeringId += 1) {
      const capacity = offeringId % 3 === 0 ? 1 : 20;
      for (let start = 0; start < 500; start += 100) {
        const bind = { offeringId, createdAt: now - 10000 }, values = [];
        for (let offset = start; offset < start + 100; offset += 1) {
          const userId = ((offeringId - 1) * 500 + offset) % 10000 + 2;
          const status = offset < capacity ? 'ACTIVE' : offset < 100 ? 'WAITLISTED' : 'CANCELLED';
          bind[`user${offset}`] = userId; bind[`status${offset}`] = status;
          values.push(`($user${offset},$offeringId,$status${offset},$createdAt,$createdAt,${status === 'CANCELLED' ? '$createdAt' : 'NULL'})`);
        }
        await db.run(`INSERT INTO enrollments(userId,offeringId,status,createdAt,updatedAt,cancelledAt) VALUES ${values.join(',')}`, bind, tx);
      }
    }
  });
  const hash = createHash('sha256');
  for (const sql of ['SELECT id,email,displayName,role,createdAt FROM users ORDER BY id', 'SELECT * FROM courses ORDER BY id', 'SELECT * FROM offerings ORDER BY id', 'SELECT * FROM enrollments ORDER BY id']) hash.update(JSON.stringify(await db.all(sql)));
  return { accounts, manifest: { students: 10000, courses: 100, offerings: 100, enrollmentAttempts: 50000, clock: new Date(now).toISOString(), logicalSha256: hash.digest('hex'), hashScope: 'ordered domain rows; random password hashes and sessions excluded' } };
}
