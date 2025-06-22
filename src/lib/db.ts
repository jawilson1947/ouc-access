import mysql from 'mysql2/promise';

export function createPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function executeQuery<T>(
  query: string,
  params?: any[]
): Promise<T> {
  const pool = createPool();
  const connection = await pool.getConnection();
  try {
    console.log('🔍 Database Query Details:', {
      query: query.trim(),
      params: params || [],
      connection: {
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER
      }
    });
    
    const [rows] = await connection.execute(query, params);
    console.log('✅ Query Result Details:', {
      rowCount: Array.isArray(rows) ? rows.length : 0,
      firstRow: Array.isArray(rows) && rows.length > 0 ? rows[0] : null,
      allRows: rows
    });
    return rows as T;
  } catch (error) {
    console.error('❌ Database Error:', {
      error,
      query: query.trim(),
      params: params || []
    });
    throw new DatabaseError('Database query failed', error);
  } finally {
    connection.release();
    await pool.end();
  }
}
