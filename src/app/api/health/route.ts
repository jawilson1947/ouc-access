import { NextResponse } from 'next/server';
import { createPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  const healthCheck = {
    status: 'error',
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      error: null as string | null,
      version: null as string | null,
      tables: null as any
    },
    environment: {
      MYSQL_HOST: process.env.MYSQL_HOST ? 'set' : 'missing',
      MYSQL_USER: process.env.MYSQL_USER ? 'set' : 'missing',
      MYSQL_DATABASE: process.env.MYSQL_DATABASE ? 'set' : 'missing',
      // Don't expose password, just check if it's set
      MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ? 'set' : 'missing'
    }
  };

  try {
    const pool = createPool();
    const connection = await pool.getConnection();
    
    try {
      // Test database connection and get version
      const [rows] = await connection.query('SELECT VERSION() as version') as [RowDataPacket[], any];
      healthCheck.database.connected = true;
      healthCheck.database.version = rows[0].version;
      healthCheck.status = 'healthy';

      // Test ChurchMembers table
      try {
        await connection.query('SELECT 1 FROM ChurchMembers LIMIT 1');
        healthCheck.database.tables = {
          ChurchMembers: 'accessible'
        };
      } catch (error) {
        healthCheck.database.tables = {
          ChurchMembers: 'error: table might not exist'
        };
      }
    } catch (error: any) {
      healthCheck.database.error = error.message;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    healthCheck.database.error = error.message;
  }

  const status = healthCheck.status === 'healthy' ? 200 : 500;
  return NextResponse.json(healthCheck, { status });
} 