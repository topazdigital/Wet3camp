// =============================================================================
// DATABASE POLICY — DO NOT CHANGE
// =============================================================================
// MySQL / MariaDB is the ONLY supported database for wet3.camp.
// The live server uses DATABASE_URL=mysql://... or DB_HOST/DB_USER/DB_PASS/DB_NAME.
// The Replit dev environment falls back to PostgreSQL ONLY because Replit does
// not provide MySQL. This is a dev-only convenience — NEVER make PostgreSQL the
// default, NEVER remove mysql2, NEVER convert SQL to pg syntax.
// Future agents: preserve MySQL. Do NOT migrate to Drizzle/PostgreSQL.
// =============================================================================

import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");
if (!existsSync(UPLOADS_DIR)) { try { mkdirSync(UPLOADS_DIR, { recursive: true }) } catch {} }

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded photos at /api/uploads/ (proxied by Vite in dev, direct in production)
app.use("/api/uploads", express.static(UPLOADS_DIR, { maxAge: '7d' }));

app.use("/api", router);

// Production static file serving — set STATIC_DIR env var to the built React app folder.
// This is a fallback in case the Apache/nginx reverse proxy is not configured.
const STATIC_DIR = process.env["STATIC_DIR"];
if (STATIC_DIR && existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR, { maxAge: "1h", index: false }));
  app.get(/(.*)/, (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, "index.html"));
  });
}

export default app;
