import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPool } from './db.js'
import { logger } from './logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Migrations only run on MySQL (production). PostgreSQL dev schema is
// handled by scripts/init-pg-dev.sql which post-merge.sh applies.
export async function runMigrations(): Promise<void> {
  const connStr = process.env['DATABASE_URL'] ?? ''
  if (!connStr.startsWith('mysql://') && !connStr.startsWith('mysql2://')) {
    logger.info('[migrate] PostgreSQL dev detected — skipping SQL migrations (handled by init-pg-dev.sql)')
    return
  }

  const pool = getPool()
  if (!pool) {
    logger.warn('[migrate] No DB pool — skipping migrations')
    return
  }

  // Ensure tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
      \`id\`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`filename\`   VARCHAR(200) NOT NULL,
      \`applied_at\` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_schema_migrations_filename\` (\`filename\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // Find migrations directory (two levels up from dist/lib/ at runtime, or src/lib/ in dev)
  const candidates = [
    path.resolve(__dirname, '../../../../migrations'),
    path.resolve(__dirname, '../../../migrations'),
    path.resolve(__dirname, '../../migrations'),
    path.resolve(__dirname, '../migrations'),
    path.resolve(process.cwd(), 'migrations'),
  ]
  const migrationsDir = candidates.find(d => fs.existsSync(d))
  if (!migrationsDir) {
    logger.warn('[migrate] No migrations/ directory found — skipping')
    return
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const [applied] = await pool.query<{ filename: string }[]>(
      'SELECT `filename` FROM `schema_migrations` WHERE `filename` = ?', [file]
    )
    if ((applied as unknown as { filename: string }[]).length > 0) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

    // Split on statement boundaries (semicolon at end of line)
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const stmt of statements) {
      try {
        await pool.query(stmt)
      } catch (err: any) {
        // Ignore "already exists" errors (idempotent)
        if (err?.code === 'ER_TABLE_EXISTS_ERROR' || err?.message?.includes('already exists')) continue
        logger.error({ err, stmt: stmt.slice(0, 120) }, '[migrate] Statement failed')
        throw err
      }
    }

    await pool.query(
      'INSERT IGNORE INTO `schema_migrations` (`filename`) VALUES (?)', [file]
    )
    logger.info(`[migrate] Applied migration: ${file}`)
  }

  logger.info('[migrate] All migrations up to date')
}
