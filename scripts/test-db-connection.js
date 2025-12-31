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

async function testConnection() {
    console.log('Testing database connection...');
    console.log('Host:', process.env.MYSQL_HOST);
    console.log('User:', process.env.MYSQL_USER);
    console.log('Database:', process.env.MYSQL_DATABASE);

    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });
        console.log('Successfully connected to the database!');
        await connection.end();
    } catch (error) {
        console.error('Failed to connect to the database:', error);
    }
}

testConnection();
