import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export async function getDbPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'wet3_camp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

export async function executeQuery(sql: string, values?: any[]) {
  const pool = await getDbPool();
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

export async function executeQueryWithConnection(
  sql: string,
  values?: any[],
  connection?: mysql.PoolConnection
) {
  if (!connection) {
    return executeQuery(sql, values);
  }
  const [results] = await connection.execute(sql, values);
  return results;
}

export async function beginTransaction() {
  const pool = await getDbPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

export async function commitTransaction(connection: mysql.PoolConnection) {
  await connection.commit();
  connection.release();
}

export async function rollbackTransaction(connection: mysql.PoolConnection) {
  await connection.rollback();
  connection.release();
}
