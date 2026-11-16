import { spawn } from "node:child_process";
import { createServer as createViteServer } from "vite";
import { loadConfig } from "../server/src/config.js";

const config = loadConfig();
if (config.port === 0) throw new Error("Use a fixed PORT for the development proxy");
const api = spawn(process.execPath, ["server/src/start.js"], { stdio: "inherit", env: process.env });
let vite;
let closing = false;
async function close(code = 0) {
  if (closing) return;
  closing = true;
  if (vite) await vite.close();
  if (api.exitCode === null) {
    const exited = new Promise(resolve => api.once("exit", resolve));
    api.kill();
    await exited;
  }
  process.exitCode = code;
}
try {
  vite = await createViteServer({ root: "client", configFile: "client/vite.config.js",
    server: { host: "127.0.0.1", port: config.clientPort, strictPort: true } });
  await vite.listen();
  vite.printUrls();
  api.once("exit", code => { if (!closing) void close(code || 1); });
  api.once("error", () => void close(1));
  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
  if (process.argv.includes("--smoke")) {
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${config.port}/health`, { signal: AbortSignal.timeout(500) });
        if (response.ok) { ready = true; break; }
      } catch { /* API starts independently of Vite */ }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error("API did not start during development smoke check");
    const url = `http://127.0.0.1:${vite.httpServer.address().port}`;
    const page = await fetch(url);
    const proxy = await fetch(url + "/api/v1/meta");
    if (!page.ok || !proxy.ok || (await proxy.json()).data.product !== "Electiva") throw new Error("Development page/proxy check failed");
    console.log("Development page, API and proxy verified");
    await close();
  }
} catch (error) { await close(1); throw error; }
