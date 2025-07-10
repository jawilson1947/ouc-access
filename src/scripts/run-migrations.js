require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  try {
    console.log('Checking environment variables...');
    console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
    console.log('MYSQL_USER:', process.env.MYSQL_USER);
    console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
    console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? 'set' : 'not set');

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true
    });

    try {
      console.log('Running migrations...');
      
      // Read and execute the rename_email_validation_date.sql file
      const migrationPath = path.join(__dirname, '../db/migrations/rename_email_validation_date.sql');
      const migrationSql = await fs.readFile(migrationPath, 'utf8');
      
      await connection.query(migrationSql);
      console.log('Successfully renamed email_validation_date to EmailValidationDate');
      
    } catch (error) {
      console.error('Error running migrations:', error);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    console.error('Please ensure your .env.local file is properly configured with database credentials');
  }
}

runMigrations(); 