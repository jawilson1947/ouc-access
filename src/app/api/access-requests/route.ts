import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { createPool } from '@/lib/db';

const pool = createPool();

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

      const [result] = await connection.query(
        `INSERT INTO access_requests 
        (emp_id, lastname, firstname, phone, email, picture_url, 
        email_validation_date, request_date, device_id, user_id, gmail) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.empId,
          data.lastname,
          data.firstname,
          data.phone,
          data.email,
          data.pictureUrl,
          data.emailValidationDate,
          data.requestDate,
          data.deviceId,
          data.userId,
          data.gmail
        ]
      );

      await connection.query('COMMIT');
      return NextResponse.json({ success: true, id: result.insertId });
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in POST /api/access-requests:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM access_requests WHERE 1=1';
      const params = [];

      if (email) {
        query += ' AND email = ?';
        params.push(email);
      }
      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      const [rows] = await connection.query(query, params);
      return NextResponse.json({ data: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in GET /api/access-requests:', error);
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
    if (!data.id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.query('START TRANSACTION');

      await connection.query(
        `UPDATE access_requests SET 
        emp_id = ?, lastname = ?, firstname = ?, phone = ?, 
        email = ?, picture_url = ?, email_validation_date = ?, 
        device_id = ?, user_id = ?, gmail = ? 
        WHERE id = ?`,
        [
          data.empId,
          data.lastname,
          data.firstname,
          data.phone,
          data.email,
          data.pictureUrl,
          data.emailValidationDate,
          data.deviceId,
          data.userId,
          data.gmail,
          data.id
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
    console.error('Error in PUT /api/access-requests:', error);
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM access_requests WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in DELETE /api/access-requests:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 