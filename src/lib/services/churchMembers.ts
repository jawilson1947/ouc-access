import { CreateChurchMemberInput, UpdateChurchMemberInput } from '@/types/database';

// Dynamic import to handle webpack module resolution issues
async function getDbModule() {
  try {
    const dbModule = await import('@/lib/db');
    if (!dbModule.executeQuery || typeof dbModule.executeQuery !== 'function') {
      throw new Error('executeQuery function not found in database module');
    }
    return dbModule;
  } catch (error) {
    console.error('❌ Failed to import database module:', error);
    throw new Error('Database module import failed');
  }
}

// Retry wrapper for database operations
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database operation attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        console.log(`⏱️ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

export async function createChurchMember(data: CreateChurchMemberInput): Promise<number> {
  return withRetry(async () => {
    console.log('🔄 Creating church member with data:', data);
    
    const { executeQuery } = await getDbModule();
    
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
  });
}

export async function updateChurchMember(data: UpdateChurchMemberInput): Promise<boolean> {
  return withRetry(async () => {
    console.log('🔄 Updating church member with data:', data);
    
    const { executeQuery } = await getDbModule();
    
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
  });
} 