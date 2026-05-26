import pg from 'pg'

const { Pool } = pg

let _pool: CompatPool | null = null

export const hasDb = (): boolean => !!process.env.DATABASE_URL

// A pool wrapper that makes pg behave like mysql2's Pool interface:
// pool.query(sql, params) returns:
//   - For SELECT/UPDATE/DELETE: [rows, fields]  (rows is an array)
//   - For INSERT: [{ insertId, affectedRows }, null]
// Handles MySQL → PostgreSQL SQL dialect translation transparently.
export class CompatPool {
  private pg: pg.Pool

  constructor(connectionString: string) {
    this.pg = new Pool({ connectionString, max: 10 })
  }

  async query<T = any>(sql: string, params: unknown[] = []): Promise<[T[] | any, any]> {
    let pgSql = this.translateSQL(sql)

    const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql)

    // For INSERTs (not ON CONFLICT DO NOTHING), add RETURNING id
    if (isInsert && !/RETURNING/i.test(pgSql) && !/ON CONFLICT\s+DO\s+NOTHING/i.test(pgSql)) {
      pgSql = pgSql.trimEnd().replace(/;$/, '') + ' RETURNING id'
    }

    const result = await this.pg.query(pgSql, params as any[])

    if (isInsert && !/ON CONFLICT\s+DO\s+NOTHING/i.test(pgSql)) {
      const insertId = result.rows[0]?.id ?? 0
      return [{ insertId, affectedRows: result.rowCount ?? 0 } as any, null]
    }

    return [result.rows as T[], result.fields as any]
  }

  private translateSQL(sql: string): string {
    let s = sql

    // Skip MySQL-only statements
    if (/^\s*SET\s+FOREIGN_KEY_CHECKS/i.test(s)) return 'SELECT 1'

    // Replace ? placeholders with $1, $2, ...
    let idx = 0
    s = s.replace(/\?/g, () => `$${++idx}`)

    // GROUP_CONCAT → STRING_AGG
    s = s.replace(
      /GROUP_CONCAT\(\s*DISTINCT\s+(\w+(?:\.\w+)?)\s+ORDER\s+BY\s+(\w+(?:\.\w+)?)\s+SEPARATOR\s+'([^']*)'\s*\)/gi,
      (_, col, orderCol, sep) => `STRING_AGG(DISTINCT ${col}, '${sep}' ORDER BY ${col})`
    )
    s = s.replace(
      /GROUP_CONCAT\(\s*DISTINCT\s+(\w+(?:\.\w+)?)\s+ORDER\s+BY\s+(\w+(?:\.\w+)?)\s*\)/gi,
      (_, col) => `STRING_AGG(DISTINCT ${col}, ',' ORDER BY ${col})`
    )
    s = s.replace(
      /GROUP_CONCAT\(\s*DISTINCT\s+(\w+(?:\.\w+)?)\s*\)/gi,
      (_, col) => `STRING_AGG(DISTINCT ${col}, ',')`
    )

    // FIELD(col, 'v1','v2',...) → CASE WHEN col='v1' THEN 0 WHEN ... END
    s = s.replace(
      /FIELD\((\w+(?:\.\w+)?)\s*,([^)]+)\)/gi,
      (_, col, valsPart) => {
        const vals = valsPart.match(/'([^']*)'/g) ?? []
        const cases = vals.map((v: string, i: number) => `WHEN ${col} = ${v} THEN ${i}`).join(' ')
        return `CASE ${cases} ELSE ${vals.length} END`
      }
    )

    // INSERT IGNORE INTO → INSERT INTO ... ON CONFLICT DO NOTHING
    if (/INSERT\s+IGNORE\s+INTO/i.test(s)) {
      s = s.replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT INTO')
      if (!/ON\s+CONFLICT/i.test(s)) {
        s = s.trimEnd().replace(/;$/, '') + ' ON CONFLICT DO NOTHING'
      }
    }

    // ON DUPLICATE KEY UPDATE `key` = VALUES(`key`), `value` = VALUES(`value`), updated_at = NOW()
    s = s.replace(
      /ON\s+DUPLICATE\s+KEY\s+UPDATE\s+`?key`?\s*=\s*VALUES\(`?key`?\)\s*,\s*`?value`?\s*=\s*VALUES\(`?value`?\)\s*,\s*updated_at\s*=\s*NOW\(\)/gi,
      'ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", updated_at = NOW()'
    )

    // Backtick identifiers → double-quoted
    s = s.replace(/`(\w+)`/g, '"$1"')

    // COALESCE(MAX(...),0)+1 subquery alias fix — already valid in PG
    // NOW() is valid in both MySQL and PostgreSQL

    return s
  }
}

export function getPool(): CompatPool | null {
  if (_pool) return _pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
  _pool = new CompatPool(connectionString)
  return _pool
}
