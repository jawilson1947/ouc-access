import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Type definitions for request data
interface AccessRequestData {
  lastname: string;
  firstname: string;
  phone: string;
  email: string;
  PictureUrl?: string | null;
  EmailValidationDate?: string | null;
  RequestDate: string;
  DeviceID?: string;
  userid: string;
  id?: number; // For PUT requests
}

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
    const data = await request.json() as AccessRequestData;
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `INSERT INTO ChurchMembers (
          lastname, firstname, phone, email, PictureUrl,
          EmailValidationDate, RequestDate, DeviceID, userid
        ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.lastname,
          data.firstname,
          data.phone,
          data.email,
          data.PictureUrl,
          data.EmailValidationDate,
          data.RequestDate,
          data.DeviceID,
          data.userid
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
    const data = await request.json() as AccessRequestData;
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `UPDATE ChurchMembers SET
          lastname = ?,
          firstname = ?,
          phone = ?,
          email = ?,
          PictureUrl = ?,
          EmailValidationDate = ?,
          RequestDate = ?,
          DeviceID = ?,
          userid = ?
        WHERE id = ?`,
        [
          data.lastname,
          data.firstname,
          data.phone,
          data.email,
          data.PictureUrl,
          data.EmailValidationDate,
          data.RequestDate,
          data.DeviceID,
          data.userid,
          data.id
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
