import pg from 'pg'

const { Pool } = pg

let _pool: CompatPool | null = null

export const hasDb = (): boolean => !!process.env.DATABASE_URL

function isMysqlUrl(url: string): boolean {
  return url.startsWith('mysql://') || url.startsWith('mysql2://')
}

export class CompatPool {
  private type: 'pg' | 'mysql' = 'pg'
  private pgPool: pg.Pool | null = null
  private mysqlPool: any = null

  constructor(connectionString: string) {
    if (isMysqlUrl(connectionString)) {
      this.type = 'mysql'
      import('mysql2/promise').then(m => {
        this.mysqlPool = m.default.createPool(connectionString)
      }).catch(e => {
        console.error('[db] mysql2 import failed:', e.message)
      })
    } else {
      this.type = 'pg'
      this.pgPool = new Pool({ connectionString, max: 10 })
    }
  }

  async query<T = any>(sql: string, params: unknown[] = []): Promise<[T[] | any, any]> {
    if (this.type === 'mysql') {
      if (!this.mysqlPool) {
        const m = await import('mysql2/promise')
        const connStr = process.env.DATABASE_URL!
        this.mysqlPool = m.default.createPool(connStr)
      }
      return this.mysqlPool.query(sql, params) as Promise<[T[] | any, any]>
    }

    let pgSql = this.translateSQL(sql)
    const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql)

    // Only add RETURNING id when the table has an auto-generated id column
    // (i.e. "id" is NOT listed in the INSERT column list — it's auto-incremented)
    const insertColMatch = pgSql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i)
    const insertCols = insertColMatch ? insertColMatch[1].replace(/[`"]/g, '').split(',').map((c: string) => c.trim().toLowerCase()) : []
    const hasAutoId = !insertCols.includes('id') && !insertCols.includes('key')

    if (isInsert && !/RETURNING/i.test(pgSql) && !/ON CONFLICT\s+DO\s+NOTHING/i.test(pgSql) && hasAutoId) {
      pgSql = pgSql.trimEnd().replace(/;$/, '') + ' RETURNING id'
    }

    const result = await this.pgPool!.query(pgSql, params as any[])

    if (isInsert && !/ON CONFLICT\s+DO\s+NOTHING/i.test(pgSql)) {
      const insertId = result.rows[0]?.id ?? 0
      return [{ insertId, affectedRows: result.rowCount ?? 0 } as any, null]
    }

    return [result.rows as T[], result.fields as any]
  }

  private translateSQL(sql: string): string {
    let s = sql

    if (/^\s*SET\s+FOREIGN_KEY_CHECKS/i.test(s)) return 'SELECT 1'

    let idx = 0
    s = s.replace(/\?/g, () => `$${++idx}`)

    s = s.replace(
      /GROUP_CONCAT\(\s*DISTINCT\s+(\w+(?:\.\w+)?)\s+ORDER\s+BY\s+(\w+(?:\.\w+)?)\s+SEPARATOR\s+'([^']*)'\s*\)/gi,
      (_, col, _orderCol, sep) => `STRING_AGG(DISTINCT ${col}, '${sep}' ORDER BY ${col})`
    )
    s = s.replace(
      /GROUP_CONCAT\(\s*DISTINCT\s+(\w+(?:\.\w+)?)\s+ORDER\s+BY\s+(\w+(?:\.\w+)?)\s*\)/gi,
      (_, col) => `STRING_AGG(DISTINCT ${col}, ',' ORDER BY ${col})`
    )
    s = s.replace(
      /GROUP_CONCAT\(\s*DISTINCT\s+(\w+(?:\.\w+)?)\s*\)/gi,
      (_, col) => `STRING_AGG(DISTINCT ${col}, ',')`
    )

    s = s.replace(
      /FIELD\((\w+(?:\.\w+)?)\s*,([^)]+)\)/gi,
      (_, col, valsPart) => {
        const vals = valsPart.match(/'([^']*)'/g) ?? []
        const cases = vals.map((v: string, i: number) => `WHEN ${col} = ${v} THEN ${i}`).join(' ')
        return `CASE ${cases} ELSE ${vals.length} END`
      }
    )

    if (/INSERT\s+IGNORE\s+INTO/i.test(s)) {
      s = s.replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT INTO')
      if (!/ON\s+CONFLICT/i.test(s)) {
        s = s.trimEnd().replace(/;$/, '') + ' ON CONFLICT DO NOTHING'
      }
    }

    // Rewrite ON DUPLICATE KEY UPDATE → ON CONFLICT (pk) DO UPDATE SET ...
    // Determine conflict column by finding which INSERT column is NOT in the UPDATE clause
    s = s.replace(
      /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*(VALUES\s*\([^)]+\))\s*ON\s+DUPLICATE\s+KEY\s+UPDATE\s+([\s\S]+?)(?=\s*$)/gi,
      (_match, _table, colsPart, valuesPart, updateClause) => {
        const insertCols = colsPart.split(',').map((c: string) => c.trim().replace(/`/g, '').replace(/"/g, ''))
        let uc = updateClause.replace(/`(\w+)`/g, '"$1"')
        uc = uc.replace(/VALUES\("?(\w+)"?\)/gi, 'EXCLUDED."$1"')
        // Updated columns in the UPDATE clause
        const updatedCols = [...uc.matchAll(/"(\w+)"\s*=/g)].map((m: RegExpMatchArray) => m[1])
        // The conflict column is the INSERT column that is NOT being updated (primary/unique key)
        const conflictCol = insertCols.find((c: string) => !updatedCols.includes(c)) ?? insertCols[0] ?? 'id'
        const normalCols = colsPart.replace(/`(\w+)`/g, '"$1"')
        const normalTable = _table
        return `INSERT INTO ${normalTable} (${normalCols}) ${valuesPart} ON CONFLICT ("${conflictCol}") DO UPDATE SET ${uc}`
      }
    )

    s = s.replace(/`(\w+)`/g, '"$1"')

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
