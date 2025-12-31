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

async function addUniqueIndex() {
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
            ALTER TABLE organization
            ADD UNIQUE INDEX idx_department_unique (department)
        `;

        console.log('Executing query:', sql);
        await connection.execute(sql);
        console.log('✅ Unique index added to `department` column successfully.');

    } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
            console.log('⚠️ Index already exists, skipping.');
        } else {
            console.error('❌ Failed to add unique index:', error);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addUniqueIndex();
