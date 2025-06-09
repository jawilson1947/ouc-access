import { executeQuery } from '@/lib/db';
import { CreateChurchMemberInput, UpdateChurchMemberInput } from '@/types/database';

export async function createChurchMember(data: CreateChurchMemberInput): Promise<number> {
  const result = await executeQuery<any>(
    `INSERT INTO ChurchMembers (
      lastname, firstname, phone, email, PictureUrl,
      EmailValidationDate, RequestDate, DeviceID, userid, gmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      data.gmail
    ]
  );
  return result.insertId;
}

export async function updateChurchMember(data: UpdateChurchMemberInput): Promise<boolean> {
  const query = `
    UPDATE ChurchMembers SET
    lastname = ?, firstname = ?, phone = ?, email = ?, PictureUrl = ?,
    EmailValidationDate = ?, RequestDate = ?, DeviceID = ?, userid = ?, gmail = ?
    WHERE EmpID = ?
  `;
  const values = [
    data.lastname,
    data.firstname,
    data.phone,
    data.email,
    data.PictureUrl,
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