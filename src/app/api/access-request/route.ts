import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `INSERT INTO ChurchMembers (
          Lastname, Firstname, Phone, Email, Picture,
          EmailValidationDate, RequestDate, DeviceID, userid, gmail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.lastname,
          data.firstname,
          data.phone,
          data.email,
          data.picture,
          data.emailValidationDate,
          data.requestDate,
          data.deviceId,
          data.userId,
          data.gmail
        ]
      );

      return NextResponse.json({ success: true, data: result });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in POST /api/access-request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const userId = searchParams.get('userId');
  const lastname = searchParams.get('lastname');
  const firstname = searchParams.get('firstname');

  try {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
      const params: any[] = [];

      if (email) {
        query += ' AND Email = ?';
        params.push(email);
      }
      if (phone) {
        query += ' AND Phone = ?';
        params.push(phone);
      }
      if (userId) {
        query += ' AND userid = ?';
        params.push(userId);
      }
      if (lastname && firstname) {
        query += ' AND Lastname LIKE ? AND Firstname LIKE ?';
        params.push(`%${lastname}%`, `%${firstname}%`);
      }

      const [rows] = await connection.execute(query, params);
      return NextResponse.json({ success: true, data: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in GET /api/access-request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `UPDATE ChurchMembers SET
          Lastname = ?,
          Firstname = ?,
          Phone = ?,
          Email = ?,
          Picture = ?,
          EmailValidationDate = ?,
          DeviceID = ?,
          userid = ?,
          gmail = ?
        WHERE EmpId = ?`,
        [
          data.lastname,
          data.firstname,
          data.phone,
          data.email,
          data.picture,
          data.emailValidationDate,
          data.deviceId,
          data.userId,
          data.gmail,
          data.empId
        ]
      );

      return NextResponse.json({ success: true, data: result });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in PUT /api/access-request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 