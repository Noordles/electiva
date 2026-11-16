import { createServer } from "node:http";

export async function startServer(app, { port = 0, host = "127.0.0.1" } = {}) {
  const server = createServer(app);
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => { server.removeListener("error", reject); resolve(); });
  });
  let closing;
  const close = () => {
    if (!closing) closing = new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeIdleConnections();
      const timeout = setTimeout(() => server.closeAllConnections(), 5_000);
      timeout.unref();
      server.once("close", () => clearTimeout(timeout));
    });
    return closing;
  };
  return { server, url: `http://${host}:${server.address().port}`, close };
}
