import { CreateChurchMemberInput, UpdateChurchMemberInput, ChurchMember } from '@/types/database';
import { executeQuery } from '@/lib/db';

// Function to format dates for MySQL
function formatDateForMySQL(date: Date | string | null): string | null {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('⚠️ Invalid date provided:', date);
      return null;
    }
    
    // Format as MySQL DATETIME: YYYY-MM-DD HH:mm:ss
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    console.log('📅 Date formatting:', { input: date, output: formattedDate });
    
    return formattedDate;
  } catch (error) {
    console.error('❌ Date formatting error:', error);
    return null;
  }
}

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
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 1): Promise<T> {
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
        EmailValidationDate, RequestDate, DeviceID, userid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.lastname,
        data.firstname,
        data.phone,
        data.email,
        data.PictureUrl || null,
        formatDateForMySQL(data.EmailValidationDate || null),
        formatDateForMySQL(data.RequestDate || null),
        data.DeviceID || null,
        data.userid || null
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
      EmailValidationDate = ?, RequestDate = ?, DeviceID = ?, userid = ?
      WHERE EmpID = ?
    `;
    const values = [
      data.lastname,
      data.firstname,
      data.phone,
      data.email,
      data.PictureUrl || null,
      formatDateForMySQL(data.EmailValidationDate || null),
      formatDateForMySQL(data.RequestDate || null),
      data.DeviceID || null,
      data.userid || null,
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

export async function searchChurchMembers(query: string) {
  try {
    // Only treat '*' as a wildcard search
    const isWildcardSearch = query === '*';
    console.log('🔍 Search type:', isWildcardSearch ? 'Wildcard' : 'Specific search');
    console.log('🔍 Search query:', query);
    
    let sql = `
      SELECT 
        EmpID,
        lastname,
        firstname,
        phone,
        email,
        PictureUrl,
        EmailValidationDate,
        RequestDate,
        DeviceID,
        userid
      FROM ChurchMembers 
    `;

    let params: any[] = [];

    if (!isWildcardSearch) {
      // Parse the query string for field-specific searches
      // Format: field:value,field:value
      const searchTerms = query.split(',').map(term => term.trim());
      const conditions: string[] = [];
      
      searchTerms.forEach(term => {
        const [field, value] = term.split(':').map(part => part.trim());
        if (field && value) {
          // Use exact match for email field, LIKE for others
          if (field.toLowerCase() === 'email') {
            conditions.push(`${field} = ?`);
            params.push(value);
          } else {
            conditions.push(`${field} LIKE ?`);
            params.push(`%${value}%`);
          }
        }
      });

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    sql += ` ORDER BY lastname, firstname`;
    
    console.log('🔍 Executing SQL query:', sql);
    console.log('🔍 With parameters:', params);
    
    const { executeQuery } = await getDbModule();
    const result = await executeQuery<ChurchMember[]>(sql, params);
    
    console.log('🔍 Raw database result:', JSON.stringify(result, null, 2));
    console.log('🔍 Number of records found:', Array.isArray(result) ? result.length : 0);
    
    return result;
  } catch (error) {
    console.error('Error in searchChurchMembers:', error);
    throw error;
  }
}

export async function deleteChurchMember(EmpID: number): Promise<boolean> {
  return withRetry(async () => {
    console.log('🔄 Deleting church member with EmpID:', EmpID);
    
    const { executeQuery } = await getDbModule();
    
    const result = await executeQuery<any>(
      'DELETE FROM ChurchMembers WHERE EmpID = ?',
      [EmpID]
    );
    
    const success = result.affectedRows > 0;
    console.log(`${success ? '✅' : '❌'} Church member deletion ${success ? 'successful' : 'failed'}`);
    
    return success;
  });
} 
