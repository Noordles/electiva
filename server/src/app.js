import express from "express";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { existsSync } from "node:fs";
import { HttpError, errorHandler } from "./errors.js";

export function createApp({
  checkReady = async () => false,
  logger = { info() {} },
  staticDirectory,
  configureRoutes = () => {},
  milestone = "M1",
  capabilities = { authentication: false, persistedCatalog: false, enrollment: false },
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("query parser", "simple");
  app.use((request, response, next) => {
    request.requestId = randomUUID();
    response.setHeader("X-Request-Id", request.requestId);
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "same-origin");
    const started = performance.now();
    let logged = false;
    const complete = (outcome) => {
      if (logged) return;
      logged = true;
      response.removeListener("finish", finish);
      response.removeListener("close", close);
      // No body, query, cookies, credentials or raw exception messages in logs.
      try { logger.info({ requestId: request.requestId, method: request.method,
        path: request.path, status: response.statusCode,
        durationMs: Math.round((performance.now() - started) * 100) / 100, outcome }); } catch { /* logging cannot change a completed response */ }
    };
    const finish = () => complete("completed");
    const close = () => complete("aborted");
    response.once("finish", finish);
    response.once("close", close);
    next();
  });
  app.use("/api", (request, _response, next) => {
    if (["POST", "PUT", "PATCH"].includes(request.method) && !request.is("application/json")) {
      throw new HttpError(415, "json_required", "Content-Type must be application/json");
    }
    next();
  }, express.json({ limit: "16kb" }));
  const health = (_request, response) => response.json({ data: { status: "ok", service: "electiva", milestone } });
  const ready = async (_request, response) => {
    let available = false;
    try { available = (await checkReady()) === true; } catch { /* unavailable, without leaking infrastructure details */ }
    response.status(available ? 200 : 503).json({ data: { status: available ? "ready" : "not_ready" } });
  };
  app.get(["/health", "/api/v1/health"], health);
  app.get(["/ready", "/api/v1/ready"], ready);
  app.get("/api/v1/meta", (_request, response) => response.json({ data: {
    product: "Electiva", team: "JIN", milestone, preview: !capabilities.persistedCatalog,
    capabilities,
  } }));
  configureRoutes(app);
  app.use("/api", (_request, _response) => { throw new HttpError(404, "not_found", "API resource not found"); });

  if (staticDirectory) {
    const directory = path.resolve(staticDirectory);
    const index = path.join(directory, "index.html");
    if (!existsSync(index)) throw new Error("Client build missing; run npm run build before production start");
    app.use((_request, response, next) => {
      response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
      next();
    });
    app.use(express.static(directory, { index: false }));
    app.get("/{*path}", (request, response, next) => {
      if (path.extname(request.path) || !request.accepts("html")) return next();
      return response.sendFile(index);
    });
  }
  app.use((_request, _response) => { throw new HttpError(404, "not_found", "Resource not found"); });
  app.use(errorHandler);
  return app;
}
