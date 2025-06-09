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

    // Direct database query for email search
    if (searchCriteria.email) {
      console.log('🔍 Direct email search for:', searchCriteria.email);
      
      const members = await executeQuery<ChurchMember[]>(
        'SELECT * FROM ChurchMembers WHERE email = ? ORDER BY lastname, firstname',
        [searchCriteria.email]
      );
      
      console.log('✅ Found members:', members.length);
      console.log('📋 Database result:', JSON.stringify(members, null, 2));
      
      if (members.length > 0) {
        const firstMember = members[0];
        console.log('🔍 Member object keys:', Object.keys(firstMember));
        console.log('🔍 Member field values:');
        Object.entries(firstMember).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
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
      
      console.log('🔄 Mapped members:', JSON.stringify(mappedMembers, null, 2));
      
      return NextResponse.json({ 
        success: true, 
        data: mappedMembers,
        total: mappedMembers.length
      });
    }

    // If no email search, return empty results
    return NextResponse.json({ 
      success: true, 
      data: [],
      total: 0
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