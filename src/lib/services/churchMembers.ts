import { ChurchMember, CreateChurchMemberInput, UpdateChurchMemberInput } from '@/types/database';
import { executeQuery, DatabaseError } from '../db';

export async function getAllChurchMembers(): Promise<ChurchMember[]> {
  return executeQuery<ChurchMember[]>('SELECT * FROM ChurchMembers ORDER BY Lastname, Firstname');
}

export async function getChurchMemberById(empId: number): Promise<ChurchMember | null> {
  const results = await executeQuery<ChurchMember[]>(
    'SELECT * FROM ChurchMembers WHERE EmpId = ?',
    [empId]
  );
  return results[0] || null;
}

export async function searchChurchMembers(params: {
  email?: string;
  phone?: string;
  userId?: string;
  lastname?: string;
  firstname?: string;
}): Promise<ChurchMember[]> {
  let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
  const queryParams: any[] = [];

  if (params.email) {
    query += ' AND Email = ?';
    queryParams.push(params.email);
  }
  if (params.phone) {
    query += ' AND Phone = ?';
    queryParams.push(params.phone);
  }
  if (params.userId) {
    query += ' AND userid = ?';
    queryParams.push(params.userId);
  }
  if (params.lastname && params.firstname) {
    query += ' AND Lastname LIKE ? AND Firstname LIKE ?';
    queryParams.push(`%${params.lastname}%`, `%${params.firstname}%`);
  }

  return executeQuery<ChurchMember[]>(query, queryParams);
}

export async function getPaginatedChurchMembers(
  page: number,
  limit: number
): Promise<{
  members: ChurchMember[];
  total: number;
}> {
  const offset = (page - 1) * limit;
  
  const [members, countResult] = await Promise.all([
    executeQuery<ChurchMember[]>(
      'SELECT * FROM ChurchMembers ORDER BY Lastname, Firstname LIMIT ? OFFSET ?',
      [limit, offset]
    ),
    executeQuery<[{total: number}]>('SELECT COUNT(*) as total FROM ChurchMembers')
  ]);

  return {
    members,
    total: countResult[0].total
  };
}

export async function searchPaginatedChurchMembers(
  searchParams: {
    email?: string;
    phone?: string;
    userId?: string;
    lastname?: string;
    firstname?: string;
  },
  page: number,
  limit: number
): Promise<{
  members: ChurchMember[];
  total: number;
}> {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM ChurchMembers WHERE 1=1';
  const queryParams: any[] = [];
  const countParams: any[] = [];

  if (searchParams.email) {
    query += ' AND Email LIKE ?';
    countQuery += ' AND Email LIKE ?';
    queryParams.push(`%${searchParams.email}%`);
    countParams.push(`%${searchParams.email}%`);
  }
  if (searchParams.phone) {
    query += ' AND Phone LIKE ?';
    countQuery += ' AND Phone LIKE ?';
    queryParams.push(`%${searchParams.phone}%`);
    countParams.push(`%${searchParams.phone}%`);
  }
  if (searchParams.userId) {
    query += ' AND userid = ?';
    countQuery += ' AND userid = ?';
    queryParams.push(searchParams.userId);
    countParams.push(searchParams.userId);
  }
  if (searchParams.lastname) {
    query += ' AND Lastname LIKE ?';
    countQuery += ' AND Lastname LIKE ?';
    queryParams.push(`%${searchParams.lastname}%`);
    countParams.push(`%${searchParams.lastname}%`);
  }
  if (searchParams.firstname) {
    query += ' AND Firstname LIKE ?';
    countQuery += ' AND Firstname LIKE ?';
    queryParams.push(`%${searchParams.firstname}%`);
    countParams.push(`%${searchParams.firstname}%`);
  }

  query += ' ORDER BY Lastname, Firstname LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const [members, countResult] = await Promise.all([
    executeQuery<ChurchMember[]>(query, queryParams),
    executeQuery<[{total: number}]>(countQuery, countParams)
  ]);

  return {
    members,
    total: countResult[0].total
  };
}

export async function createChurchMember(data: CreateChurchMemberInput): Promise<number> {
  const result = await executeQuery<any>(
    `INSERT INTO ChurchMembers (
      Lastname, Firstname, Phone, Email, Picture,
      EmailValidationDate, RequestDate, DeviceID, DeptId, userid, gmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.Lastname,
      data.Firstname,
      data.Phone,
      data.Email,
      data.Picture,
      data.EmailValidationDate,
      data.RequestDate,
      data.DeviceID,
      data.DeptId,
      data.userid,
      data.gmail
    ]
  );
  return result.insertId;
}

export async function updateChurchMember(data: UpdateChurchMemberInput): Promise<boolean> {
  const fields = Object.keys(data).filter(key => key !== 'EmpId');
  const values = fields.map(field => data[field as keyof UpdateChurchMemberInput]);
  
  const query = `
    UPDATE ChurchMembers 
    SET ${fields.map(field => `${field} = ?`).join(', ')}
    WHERE EmpId = ?
  `;
  
  const result = await executeQuery<any>(query, [...values, data.EmpId]);
  return result.affectedRows > 0;
}

export async function deleteChurchMember(empId: number): Promise<boolean> {
  const result = await executeQuery<any>(
    'DELETE FROM ChurchMembers WHERE EmpId = ?',
    [empId]
  );
  return result.affectedRows > 0;
}
