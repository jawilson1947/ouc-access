import { ChurchMember, CreateChurchMemberInput, UpdateChurchMemberInput } from '@/types/database';
import { executeQuery, DatabaseError } from '../db';

export async function getAllChurchMembers(): Promise<ChurchMember[]> {
  return executeQuery<ChurchMember[]>('SELECT * FROM ChurchMembers ORDER BY lastname, firstname');
}

export async function getChurchMemberById(EmpID: number): Promise<ChurchMember | null> {
  const results = await executeQuery<ChurchMember[]>(
    'SELECT * FROM ChurchMembers WHERE EmpID = ?',
    [EmpID]
  );
  return results[0] || null;
}

export async function searchChurchMembers(params: {
  email?: string;
  phone?: string;
  user_id?: string;
  lastname?: string;
  firstname?: string;
}): Promise<ChurchMember[]> {
  let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
  const queryParams: any[] = [];

  if (params.email) {
    query += ' AND email = ?';
    queryParams.push(params.email);
  }
  if (params.phone) {
    query += ' AND phone = ?';
    queryParams.push(params.phone);
  }
  if (params.user_id) {
    query += ' AND user_id = ?';
    queryParams.push(params.user_id);
  }
  if (params.lastname && params.firstname) {
    query += ' AND lastname LIKE ? AND firstname LIKE ?';
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
      'SELECT * FROM ChurchMembers ORDER BY lastname, firstname LIMIT ? OFFSET ?',
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
    query += ' AND email LIKE ?';
    countQuery += ' AND email LIKE ?';
    queryParams.push(`%${searchParams.email}%`);
    countParams.push(`%${searchParams.email}%`);
  }
  if (searchParams.phone) {
    query += ' AND phone LIKE ?';
    countQuery += ' AND phone LIKE ?';
    queryParams.push(`%${searchParams.phone}%`);
    countParams.push(`%${searchParams.phone}%`);
  }
  if (searchParams.userId) {
    query += ' AND user_id = ?';
    countQuery += ' AND user_id = ?';
    queryParams.push(searchParams.userId);
    countParams.push(searchParams.userId);
  }
  if (searchParams.lastname) {
    query += ' AND lastname LIKE ?';
    countQuery += ' AND lastname LIKE ?';
    queryParams.push(`%${searchParams.lastname}%`);
    countParams.push(`%${searchParams.lastname}%`);
  }
  if (searchParams.firstname) {
    query += ' AND firstname LIKE ?';
    countQuery += ' AND firstname LIKE ?';
    queryParams.push(`%${searchParams.firstname}%`);
    countParams.push(`%${searchParams.firstname}%`);
  }

  query += ' ORDER BY lastname, firstname LIMIT ? OFFSET ?';
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
      lastname, firstname, phone, email, Picture_Url,
      EmailValidationDate, RequestDate, DeviceID, userid, gmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  return result.insertId;
}

export async function updateChurchMember(data: UpdateChurchMemberInput): Promise<boolean> {
  const query = `
    UPDATE ChurchMembers SET
    lastname = ?, firstname = ?, phone = ?, email = ?, Picture_Url = ?,
    EmailValidationDate = ?, RequestDate = ?, DeviceID = ?, userid = ?, gmail = ?
    WHERE EmpID = ?
  `;
  const values = [
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
  ];
  
  const result = await executeQuery<any>(query, values);
  return result.affectedRows > 0;
}

export async function deleteChurchMember(EmpID: number): Promise<boolean> {
  const result = await executeQuery<any>(
    'DELETE FROM ChurchMembers WHERE EmpID = ?',
    [EmpID]
  );
  return result.affectedRows > 0;
}
