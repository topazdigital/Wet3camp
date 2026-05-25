import mysql from 'mysql2/promise'

let _pool: mysql.Pool | null = null

export function getPool(): mysql.Pool | null {
  if (_pool) return _pool
  const host     = process.env.DB_HOST
  const user     = process.env.DB_USER
  const password = process.env.DB_PASS ?? ''
  const database = process.env.DB_NAME
  const port     = parseInt(process.env.DB_PORT ?? '3306', 10)
  if (!host || !user || !database) return null
  _pool = mysql.createPool({ host, port, user, password, database, connectionLimit: 10, waitForConnections: true, timezone: '+03:00' })
  return _pool
}

export const hasDb = (): boolean => !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
