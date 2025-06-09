import { executeQuery, DatabaseError } from '@/lib/db';
import { CreateChurchMemberInput, UpdateChurchMemberInput } from '@/types/database';

export async function createChurchMember(data: CreateChurchMemberInput): Promise<number> {
  try {
    console.log('🔄 Creating church member with data:', data);
    
    // Ensure executeQuery is available
    if (typeof executeQuery !== 'function') {
      throw new Error('executeQuery function is not available - database module import failed');
    }
    
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
        data.PictureUrl || null,
        data.EmailValidationDate || null,
        data.RequestDate,
        data.DeviceID || null,
        data.userid || null,
        data.gmail || null
      ]
    );
    
    console.log('✅ Church member created successfully with ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error in createChurchMember:', error);
    throw error;
  }
}

export async function updateChurchMember(data: UpdateChurchMemberInput): Promise<boolean> {
  try {
    console.log('🔄 Updating church member with data:', data);
    
    // Ensure executeQuery is available
    if (typeof executeQuery !== 'function') {
      throw new Error('executeQuery function is not available - database module import failed');
    }
    
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
      data.PictureUrl || null,
      data.EmailValidationDate || null,
      data.RequestDate,
      data.DeviceID || null,
      data.userid || null,
      data.gmail || null,
      data.EmpID
    ];
    
    console.log('🔄 Executing UPDATE query with values:', values);
    const result = await executeQuery<any>(query, values);
    console.log('📊 Update result:', result);
    
    const success = result.affectedRows > 0;
    console.log(`${success ? '✅' : '❌'} Church member update ${success ? 'successful' : 'failed'}`);
    
    return success;
  } catch (error) {
    console.error('❌ Error in updateChurchMember:', error);
    throw error;
  }
} 