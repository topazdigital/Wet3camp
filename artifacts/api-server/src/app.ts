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

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";
import router from "./routes";
import sitemapRouter from "./routes/sitemap.js";
import { ogPreviewMiddleware } from "./middlewares/ogPreview.js";
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
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Security & CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Global caching & Expires headers ─────────────────────────────────────────
// This fixes the Pingdom "Add Expires headers" B-grade issue
app.use((req: Request, res: Response, next: NextFunction) => {
  const url = req.url || ''

  // API responses: short cache (60s for public listing data), no-store for auth
  if (url.startsWith('/api/')) {
    const isPublic = /^\/api\/(escorts|sitemap|health|stats|reviews|blog)/.test(url)
    if (isPublic) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      const expires = new Date(Date.now() + 60 * 1000)
      res.setHeader('Expires', expires.toUTCString())
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Expires', '0')
      res.setHeader('Pragma', 'no-cache')
    }
    res.setHeader('Vary', 'Accept-Encoding, Accept')
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  next()
})

// ── Root-level SEO files (served before /api and before static files) ─────────
// Google Search Console verification
app.get('/google76ed499fbdba9e86.html', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send('google-site-verification: google76ed499fbdba9e86.html')
})
// Dynamic sitemaps at domain root (not /api/*)
app.use(sitemapRouter)

// ── Static uploads ────────────────────────────────────────────────────────────
app.use("/api/uploads", express.static(UPLOADS_DIR, {
  maxAge: '30d',
  setHeaders(res) {
    const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    res.setHeader('Expires', d.toUTCString())
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')
  }
}));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── OG/Social preview middleware (bot detection → inject meta tags) ───────────
// Must come AFTER /api routes so bots hitting /api/* are not intercepted,
// but BEFORE static file serving so profile/page bots get real OG tags.
app.use(ogPreviewMiddleware);

// ── Production static file serving ───────────────────────────────────────────
const STATIC_DIR = process.env["STATIC_DIR"];
if (STATIC_DIR && existsSync(STATIC_DIR)) {
  // Static assets (JS/CSS/images) get long-term caching
  app.use(express.static(STATIC_DIR, {
    maxAge: "1y",
    index: false,
    setHeaders(res, filePath) {
      if (/\.(html)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate')
        res.setHeader('Expires', '0')
      } else if (/\.(js|css|woff2?|ttf|eot|svg|png|jpg|webp|ico)$/.test(filePath)) {
        const d = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        res.setHeader('Expires', d.toUTCString())
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    }
  }));
  app.get(/(.*)/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate')
    res.setHeader('Expires', '0')
    res.sendFile(path.join(STATIC_DIR, "index.html"));
  });
}

export default app;
