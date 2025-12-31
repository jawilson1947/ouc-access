const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local like test-db-connection.js does
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function removeUserIdColumn() {
    let connection;
    try {
        console.log('🔌 Connecting to database...');
        // Use the same config as test-db-connection.js
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            ssl: {
                rejectUnauthorized: false // Relax SSL for this script as per working examples if any, or just omit if test-db doesn't use it.
                // Actually test-db-connection.js didn't use ssl block at all. Let's try without first.
            }
        });

        console.log('🔍 Checking if "userid" column exists...');
        const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ChurchMembers' AND COLUMN_NAME = 'userid'
    `, [process.env.MYSQL_DATABASE]);

        if (columns.length === 0) {
            console.log('ℹ️ "userid" column does not exist. No action needed.');
        } else {
            console.log('🗑️ "userid" column found. Dropping it...');
            await connection.execute('ALTER TABLE ChurchMembers DROP COLUMN userid');
            console.log('✅ "userid" column dropped successfully.');
        }

    } catch (error) {
        console.error('❌ Error removing userid column:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

removeUserIdColumn();
