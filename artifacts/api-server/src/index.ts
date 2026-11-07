import app from "./app";
import { logger } from "./lib/logger";
import { getPool } from "./lib/db.js";
import { seedOnlineFromDb } from "./lib/online-store.js";
import { runMigrations } from "./lib/migrate.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function expirePaidProfileTiers() {
  const pool = getPool()
  if (!pool) return
  try {
    const [result] = await pool.query(
      `UPDATE escorts
          SET tier = 'standard', tier_expires_at = NULL, updated_at = NOW()
        WHERE tier IN ('premium', 'vip', 'elite')
          AND tier_expires_at IS NOT NULL
          AND tier_expires_at <= NOW()`,
    )
    const affectedRows = Number((result as any)?.affectedRows ?? (result as any)?.rowCount ?? 0)
    if (affectedRows > 0) logger.info({ affectedRows }, 'Expired paid escort tiers returned to Standard')
  } catch (err) {
    logger.warn({ err }, 'Could not expire paid escort tiers')
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Run DB migrations automatically (MySQL/production only)
  runMigrations()
    .then(() => {
      void expirePaidProfileTiers()
      const expirySweep = setInterval(() => void expirePaidProfileTiers(), 5 * 60 * 1000)
      expirySweep.unref()
    })
    .catch(e => logger.warn({ err: e }, "Migration error (non-fatal)"))

  const pool = getPool();
  if (pool) {
    seedOnlineFromDb(pool).then(() => {
      logger.info("Online escort status seeded from DB");
    });
  }
});
