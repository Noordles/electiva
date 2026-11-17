import { fileURLToPath } from "node:url";
import { createApplication } from "./application.js";
import { createDatabase } from "./db/database.js";
import { loadConfig } from "./config.js";
import { startServer } from "./server.js";

const config = loadConfig({ ...process.env,
  ...(process.argv.includes("--production") ? { NODE_ENV: "production" } : {}),
});
const staticDirectory = config.mode === "production" ? fileURLToPath(new URL("../../client/dist/", import.meta.url)) : undefined;
const db = await createDatabase(config.databasePath);
const app = createApplication(db, { staticDirectory,
  secureCookies: config.mode === 'production' && process.env.COOKIE_SECURE !== 'false',
  allowedOrigins: [`http://127.0.0.1:${config.clientPort}`],
  directory: { baseUrl: process.env.DIRECTORY_URL ?? 'http://127.0.0.1:3100' },
  logger: { info: entry => console.log(JSON.stringify(entry)) } });
let running;
try { running = await startServer(app, config); } catch (error) { await db.close(); throw error; }
console.log(`Electiva API: ${running.url}`);
const shutdown = async () => { await running.close(); await db.close(); };
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
