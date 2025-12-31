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

async function alterTable() {
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

        const sql = `ALTER TABLE ChurchMembers MODIFY COLUMN PictureUrl MEDIUMTEXT;`;

        console.log('Executing query:', sql);
        await connection.execute(sql);
        console.log('✅ Table \`ChurchMembers\` altered successfully: PictureUrl is now MEDIUMTEXT.');

    } catch (error) {
        console.error('❌ Failed to alter table:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

alterTable();
