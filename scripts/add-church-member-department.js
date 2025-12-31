const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function addDepartmentColumn() {
    console.log('Connecting to database...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        console.log('Connected!');

        const sql = `
            ALTER TABLE ChurchMembers
            ADD COLUMN department VARCHAR(128) NULL
        `;

        console.log('Executing query:', sql);
        await connection.execute(sql);
        console.log('✅ Column `department` added to `ChurchMembers` table successfully.');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Column `department` already exists, skipping.');
        } else {
            console.error('❌ Failed to add column:', error);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addDepartmentColumn();
