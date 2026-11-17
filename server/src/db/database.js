import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import sqlite3 from 'sqlite3';
import { Sequelize, DataTypes, QueryTypes, Transaction } from 'sequelize';
import { loadConfig } from '../config.js';
import { HttpError } from '../errors.js';
import { migrations } from './migrations.js';

class LocalDatabase extends sqlite3.Database {
  constructor(...args) { super(...args); this.configure('busyTimeout', 0); }
}

export async function createDatabase(storage) {
  const { databasePath } = loadConfig({ ...process.env, DATABASE_PATH: storage });
  await mkdir(path.dirname(databasePath), { recursive: true });
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: databasePath,
    dialectModule: { ...sqlite3, Database: LocalDatabase }, logging: false,
    retry: { max: 30, match: [/SQLITE_BUSY/], backoffBase: 10, backoffExponent: 1.12, backoffJitter: 10 } });
  // Models describe the application schema; migrations own physical constraints.
  const integer = { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true };
  const define = (name, fields) => sequelize.define(name, fields, { tableName: name, timestamps: false });
  const models = {
    User: define('users', { id: integer, email: DataTypes.TEXT, displayName: DataTypes.TEXT, passwordHash: DataTypes.TEXT, role: DataTypes.TEXT, createdAt: DataTypes.BIGINT }),
    Session: define('sessions', { tokenHash: { type: DataTypes.TEXT, primaryKey: true }, userId: DataTypes.INTEGER, csrfToken: DataTypes.TEXT, expiresAt: DataTypes.BIGINT, createdAt: DataTypes.BIGINT }),
    Course: define('courses', { id: integer, code: DataTypes.TEXT, title: DataTypes.TEXT, description: DataTypes.TEXT, department: DataTypes.TEXT, credits: DataTypes.INTEGER, externalCode: DataTypes.TEXT }),
    Offering: define('offerings', { id: integer, courseId: DataTypes.INTEGER, term: DataTypes.TEXT, capacity: DataTypes.INTEGER, opensAt: DataTypes.BIGINT, closesAt: DataTypes.BIGINT, lifecycle: DataTypes.TEXT, version: DataTypes.INTEGER }),
    Enrollment: define('enrollments', { id: integer, userId: DataTypes.INTEGER, offeringId: DataTypes.INTEGER, status: DataTypes.TEXT, createdAt: DataTypes.BIGINT, updatedAt: DataTypes.BIGINT, cancelledAt: DataTypes.BIGINT }),
  };
  models.Course.hasMany(models.Offering, { foreignKey: 'courseId' });
  models.Offering.belongsTo(models.Course, { foreignKey: 'courseId' });
  models.User.hasMany(models.Enrollment, { foreignKey: 'userId' });
  models.Offering.hasMany(models.Enrollment, { foreignKey: 'offeringId' });
  const bindings = (sql, values) => {
    const names = new Set([...sql.matchAll(/\$([a-zA-Z]\w*)/g)].map(match => match[1]));
    return Object.fromEntries(Object.entries(values).filter(([key]) => names.has(key)));
  };
  const db = {
    sequelize, models,
    all: (sql, bind = {}, transaction) => sequelize.query(sql, { bind: bindings(sql, bind), transaction, type: QueryTypes.SELECT }),
    run: (sql, bind = {}, transaction) => sequelize.query(sql, { bind: bindings(sql, bind), transaction }),
    async write(operation) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try { return await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, operation); }
        catch (error) {
          if (error.original?.code !== 'SQLITE_BUSY') throw error;
          if (attempt === 4) throw new HttpError(503, 'temporarily_busy', 'Please try again shortly');
          await sleep(Math.min(10 * 2 ** attempt, 160));
        }
      }
    },
    async ready() { await db.all('SELECT 1'); return true; },
    close: () => sequelize.close(),
  };
  try {
    await db.run('PRAGMA journal_mode=WAL');
    await db.write(async transaction => {
      await db.run('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, checksum TEXT NOT NULL)', {}, transaction);
      for (const migration of migrations) {
        const checksum = createHash('sha256').update(JSON.stringify(migration.statements)).digest('hex');
        const [existing] = await db.all('SELECT checksum FROM schema_migrations WHERE version = $version', { version: migration.version }, transaction);
        if (existing) {
          if (existing.checksum !== checksum) throw new Error(`Migration ${migration.version} has changed; restore it and add a new migration`);
          continue;
        }
        for (const sql of migration.statements) await db.run(sql, {}, transaction);
        await db.run('INSERT INTO schema_migrations VALUES ($version, $checksum)', { version: migration.version, checksum }, transaction);
      }
    });
    // Migration DDL uses its own connection. Refresh the original connection's
    // schema snapshot before its first prepared INSERT (SQLite 3.52/sqlite3 6).
    await db.all('SELECT name FROM sqlite_master');
    return db;
  } catch (error) { await db.close(); throw error; }
}
