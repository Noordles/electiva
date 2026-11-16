import { homedir } from "node:os";
import path from "node:path";

function port(value, fallback, name) {
  if (value === undefined) return fallback;
  if (!/^(0|[1-9][0-9]*)$/.test(value) || Number(value) > 65535) {
    throw new Error(`${name} must be an integer from 0 to 65535`);
  }
  return Number(value);
}

export function loadConfig(env = process.env) {
  const mode = env.NODE_ENV ?? "development";
  if (!["development", "test", "production"].includes(mode)) throw new Error("Invalid NODE_ENV");
  const host = env.HOST ?? "127.0.0.1";
  if (host !== "127.0.0.1") throw new Error("M1 must bind to loopback (127.0.0.1)");
  const localRoot = env.LOCALAPPDATA || path.join(homedir(), ".local", "share");
  const databasePath = env.DATABASE_PATH || path.join(localRoot, "Electiva", "dev.sqlite");
  if (databasePath.startsWith(String.fromCharCode(92, 92)) || databasePath.startsWith("//") || !path.isAbsolute(databasePath) || /(^|[\\/])onedrive(?:[^\\/]*)?([\\/]|$)/i.test(databasePath) || databasePath === ":memory:") {
    throw new Error("DATABASE_PATH must be an absolute local path outside OneDrive");
  }
  if (env.OneDrive) {
    const relative = path.relative(path.resolve(env.OneDrive), path.resolve(databasePath));
    if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
      throw new Error("DATABASE_PATH must be outside OneDrive");
    }
  }
  return Object.freeze({
    mode, host,
    port: port(env.PORT, 3000, "PORT"),
    clientPort: port(env.CLIENT_PORT, 5173, "CLIENT_PORT"),
    databasePath: path.resolve(databasePath),
  });
}
