import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/config';
import { createPool } from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

const pool = createPool();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');
    const EmpID = searchParams.get('EmpID');

    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
      const params = [];

      if (email) {
        query += ' AND Email = ?';
        params.push(email);
      }
      if (userId) {
        query += ' AND userid = ?';
        params.push(userId);
      }
      if (EmpID) {
        query += ' AND EmpID = ?';
        params.push(EmpID);
      }

      const [rows] = await connection.query(query, params);
      return NextResponse.json({ data: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in GET /api/church-members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const connection = await pool.getConnection();

    try {
      await connection.query('START TRANSACTION');

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO ChurchMembers 
        (lastname, firstname, phone, email, Picture_Url, 
        EmailValidationDate, RequestDate, DeviceID, userid, gmail) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.lastname,
          data.firstname,
          data.phone,
          data.email,
          data.Picture_Url,
          data.EmailValidationDate,
          data.RequestDate,
          data.DeviceID,
          data.userid,
          data.gmail
        ]
      );

      await connection.query('COMMIT');
      return NextResponse.json({ success: true, EmpID: result.insertId });
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in POST /api/church-members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    if (!data.EmpID) {
      return NextResponse.json(
        { error: 'EmpID is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.query('START TRANSACTION');

      await connection.query(
        `UPDATE ChurchMembers SET 
        lastname = ?, firstname = ?, phone = ?, 
        email = ?, Picture_Url = ?, EmailValidationDate = ?, 
        RequestDate = ?, DeviceID = ?, userid = ?, gmail = ? 
        WHERE EmpID = ?`,
        [
          data.lastname,
          data.firstname,
          data.phone,
          data.email,
          data.Picture_Url,
          data.EmailValidationDate,
          data.RequestDate,
          data.DeviceID,
          data.userid,
          data.gmail,
          data.EmpID
        ]
      );

      await connection.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in PUT /api/church-members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const EmpID = searchParams.get('EmpID');

    if (!EmpID) {
      return NextResponse.json(
        { error: 'EmpID is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM ChurchMembers WHERE EmpID = ?', [EmpID]);
      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in DELETE /api/church-members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}