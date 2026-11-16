import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { startServer } from "./server.js";

const config = loadConfig({ ...process.env,
  ...(process.argv.includes("--production") ? { NODE_ENV: "production" } : {}),
});
const staticDirectory = config.mode === "production" ? fileURLToPath(new URL("../../client/dist/", import.meta.url)) : undefined;
const app = createApp({ staticDirectory, logger: { info: entry => console.log(JSON.stringify(entry)) } });
const running = await startServer(app, config);
console.log(`Electiva API: ${running.url}`);
const shutdown = async () => { await running.close(); };
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
