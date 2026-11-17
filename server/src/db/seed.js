import { randomBytes } from 'node:crypto';
import { hashPassword } from '../auth.js';

const titles = [
  ['Applied Econometrics', 'Economics', 'Use data and careful assumptions to study economic relationships.'],
  ['Cloud Systems', 'Informatics', 'Explore reliable services, deployment and the practical limits of distributed systems.'],
  ['Data Visualization', 'Data Science', 'Explain patterns and uncertainty through clear, purposeful visualizations.'],
  ['Digital Product Strategy', 'Management', 'Connect user needs, product choices and measurable outcomes.'],
  ['Human-Centered Computing', 'Design', 'Design technology around the people who use it.'],
  ['Inclusive Web Design', 'Informatics', 'Build accessible, semantic interfaces that work across devices.'],
];
export async function seedDatabase(db, { large = false, now = Date.now(), password = randomBytes(24).toString('base64url') } = {}) {
  const passwordHash = await hashPassword(password);
  const students = large ? 10000 : 30, courses = large ? 100 : 6;
  await db.write(async tx => {
    for (const table of ['users', 'courses', 'offerings', 'enrollments']) {
      if ((await db.all(`SELECT 1 FROM ${table} LIMIT 1`, {}, tx)).length) throw new Error('Seed requires an empty database; existing data was left untouched');
    }
    await db.run("INSERT INTO users VALUES (1,'admin@example.test','Demo administrator',$passwordHash,'admin',$now)", { passwordHash, now }, tx);
    for (let start = 1; start <= students; start += 250) {
      const bind = { passwordHash, now }, values = [];
      for (let index = start; index <= Math.min(start + 249, students); index += 1) {
        bind[`email${index}`] = `student${index}@example.test`; bind[`name${index}`] = `Demo student ${index}`;
        values.push(`(${index + 1},$email${index},$name${index},$passwordHash,'student',$now)`);
      }
      await db.run(`INSERT INTO users(id,email,displayName,passwordHash,role,createdAt) VALUES ${values.join(',')}`, bind, tx);
    }
    for (let index = 1; index <= courses; index += 1) {
      const [title, department, description] = titles[(index - 1) % titles.length];
      await db.run('INSERT INTO courses VALUES ($id,$code,$title,$description,$department,5,NULL)', { id: index, code: `EL-${String(index).padStart(3, '0')}`, title: index <= 6 ? title : `${title} ${index}`, department, description }, tx);
      await db.run("INSERT INTO offerings VALUES ($id,$id,'2026-2027',$capacity,$opens,$closes,'PUBLISHED',1)", { id: index, capacity: index % 3 === 0 ? 1 : 20, opens: now - 86400000, closes: now + 30 * 86400000 }, tx);
    }
  });
  return { synthetic: true, students, courses, offerings: courses, adminEmail: 'admin@example.test', studentEmail: 'student1@example.test', password, enrollmentClosesAt: new Date(now + 30 * 86400000).toISOString() };
}
