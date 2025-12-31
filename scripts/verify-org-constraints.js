const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function verifyTable() {
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

        // Test Insertion
        const testDept = 'Verification Dept ' + Date.now();
        console.log(`Inserting '${testDept}'...`);
        const [result] = await connection.execute(
            'INSERT INTO organization (department) VALUES (?)',
            [testDept]
        );
        const insertId = result.insertId;
        console.log(`✅ Inserted with ID: ${insertId}`);

        // Test Duplicate Insertion
        console.log(`Attempting duplicate insertion of '${testDept}'...`);
        try {
            await connection.execute(
                'INSERT INTO organization (department) VALUES (?)',
                [testDept]
            );
            console.error('❌ Failed: Duplicate insertion succeeded but should have failed!');
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                console.log('✅ Success: Duplicate insertion failed as expected.');
            } else {
                console.error('❌ Unexpected error during duplicate check:', e);
            }
        }

        // Test Cleanup
        console.log(`Deleting ID ${insertId}...`);
        await connection.execute('DELETE FROM organization WHERE ID = ?', [insertId]);
        console.log('✅ Cleanup successful.');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifyTable();
