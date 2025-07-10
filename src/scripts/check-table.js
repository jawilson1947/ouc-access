require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkTable() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true
    });

    try {
      console.log('Checking ChurchMembers table structure...');
      const [columns] = await connection.query('SHOW COLUMNS FROM ChurchMembers');
      console.log('\nTable structure:');
      columns.forEach(col => {
        console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTable(); 