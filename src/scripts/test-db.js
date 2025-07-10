const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Environment variables:');
  console.log('HOST:', process.env.MYSQL_HOST);
  console.log('USER:', process.env.MYSQL_USER);
  console.log('DATABASE:', process.env.MYSQL_DATABASE);
  console.log('PASSWORD:', process.env.MYSQL_PASSWORD ? 'set' : 'not set');

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    });

    console.log('\nConnection successful!');
    
    // Test database version
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log('MySQL Version:', rows[0].version);

    // Test ChurchMembers table
    try {
      const [tables] = await connection.execute('SHOW TABLES LIKE "ChurchMembers"');
      if (tables.length === 0) {
        console.log('\nChurchMembers table does not exist. Creating it...');
        // Read and execute the init.sql file
        const fs = require('fs');
        const path = require('path');
        const initSql = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');
        await connection.execute(initSql);
        console.log('ChurchMembers table created successfully!');
      } else {
        console.log('\nChurchMembers table exists!');
        const [columns] = await connection.execute('SHOW COLUMNS FROM ChurchMembers');
        console.log('\nTable structure:');
        columns.forEach(col => {
          console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
        });
      }
    } catch (error) {
      console.error('\nError checking/creating table:', error.message);
    }

    await connection.end();
  } catch (error) {
    console.error('\nConnection failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nTIP: Check your username and password');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\nTIP: Make sure MySQL server is running and accessible');
    }
  }
}

testConnection(); 