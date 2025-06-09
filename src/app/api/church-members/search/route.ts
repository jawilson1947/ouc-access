import { NextResponse } from 'next/server';
import { DatabaseError, executeQuery } from '@/lib/db';
import { ChurchMember } from '@/types/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const searchCriteria = {
      email: searchParams.get('email') || undefined,
      phone: searchParams.get('phone') || undefined,
      userId: searchParams.get('userId') || undefined,
      lastname: searchParams.get('lastname') || undefined,
      firstname: searchParams.get('firstname') || undefined,
    };

    console.log('🔍 Search criteria:', searchCriteria);

    // Build dynamic query based on search criteria
    let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
    const params: any[] = [];

    if (searchCriteria.email) {
      console.log('🔍 Email search for:', searchCriteria.email);
      // Search both email and gmail fields for email queries
      query += ' AND (email = ? OR gmail = ?)';
      params.push(searchCriteria.email, searchCriteria.email);
    }

    if (searchCriteria.phone) {
      console.log('🔍 Phone search for:', searchCriteria.phone);
      query += ' AND Phone = ?';
      params.push(searchCriteria.phone);
    }

    if (searchCriteria.userId) {
      console.log('🔍 User ID search for:', searchCriteria.userId);
      query += ' AND userid = ?';
      params.push(searchCriteria.userId);
    }

    // Handle lastname and firstname searches with wildcard support
    if (searchCriteria.lastname) {
      if (searchCriteria.lastname === '*') {
        console.log('🔍 Wildcard search - returning all records');
        // Don't add any lastname constraint for wildcard search
      } else {
        console.log('🔍 Last name search for:', searchCriteria.lastname);
        query += ' AND Lastname LIKE ?';
        params.push(`%${searchCriteria.lastname}%`);
      }
    }

    if (searchCriteria.firstname) {
      console.log('🔍 First name search for:', searchCriteria.firstname);
      query += ' AND Firstname LIKE ?';
      params.push(`%${searchCriteria.firstname}%`);
    }

    // Add ordering
    query += ' ORDER BY lastname, firstname';

    console.log('🔍 Final query:', query);
    console.log('🔍 Query params:', params);

    const members = await executeQuery<ChurchMember[]>(query, params);
    
    console.log('✅ Found members:', members.length);
    
    if (members.length > 0) {
      const firstMember = members[0];
      console.log('🔍 Sample member keys:', Object.keys(firstMember));
    }
    
    // Map database field names to expected interface field names
    const mappedMembers = members.map(member => {
      const dbMember = member as any; // Database returns uppercase field names
      return {
        ...member,
        lastname: dbMember.Lastname || member.lastname,
        firstname: dbMember.Firstname || member.firstname,
        phone: dbMember.Phone || member.phone
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      data: mappedMembers,
      total: mappedMembers.length
    });
    
  } catch (error) {
    console.error('Error in GET /api/church-members/search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof DatabaseError ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
} 