import { NextResponse } from 'next/server';
import { DatabaseError, executeQuery } from '@/lib/db';
import { ChurchMember } from '@/types/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

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

    // Check if this is an initial user search (when user logs in)
    const isInitialSearch = searchParams.get('initial') === 'true';
    
    // Check if this is an explicit wildcard search (admin typed '*' in lastname)
    const isWildcardSearch = searchCriteria.lastname === '*';

    // If wildcard search, verify admin privileges
    if (isWildcardSearch) {
      // Check admin status using direct email comparison (same as frontend)
      const userEmail = searchCriteria.email;
      const adminEmail = process.env.ADMIN_EMAIL || 'jawilson1947@gmail.com';
      const isUserAdmin = userEmail === adminEmail;
      
      console.log('🔍 Wildcard search admin check:', {
        userEmail,
        adminEmail,
        isUserAdmin,
        comparison: `"${userEmail}" === "${adminEmail}"`
      });
      
      if (!isUserAdmin) {
        console.log('🚫 Wildcard search denied - user is not admin');
        return NextResponse.json(
          { success: false, error: 'Wildcard searches are only available to administrators' },
          { status: 403 }
        );
      }
      console.log('✅ Wildcard search authorized for admin user');
    }

    console.log('🔍 Search criteria:', searchCriteria);
    console.log('🔍 Is initial search:', isInitialSearch);
    console.log('🔍 Is wildcard search:', isWildcardSearch);

    // Build dynamic query based on search criteria
    let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
    const params: any[] = [];

    if (isWildcardSearch) {
      // WILDCARD SEARCH: Return ALL records without any constraints
      console.log('🔍 Explicit wildcard search - returning ALL records');
      console.log('🔍 Wildcard search bypasses all search criteria');
      // Intentionally empty - no search constraints added for wildcard search
      // This ensures admin sees ALL records when they type '*'
    } else if (isInitialSearch) {
      // INITIAL SEARCH: User just logged in, search by their email only
      if (searchCriteria.email) {
        console.log('🔍 Initial user search for:', searchCriteria.email);
        query += ' AND email = ?';
        params.push(searchCriteria.email);
        query += ' ORDER BY lastname, firstname LIMIT 1';
      }
    } else {
      // NORMAL SEARCH: Apply all relevant search criteria
      if (searchCriteria.email) {
        console.log('🔍 Email search for:', searchCriteria.email);
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

      if (searchCriteria.lastname) {
        console.log('🔍 Last name search for:', searchCriteria.lastname);
        query += ' AND Lastname LIKE ?';
        params.push(`%${searchCriteria.lastname}%`);
      }

      if (searchCriteria.firstname) {
        console.log('🔍 First name search for:', searchCriteria.firstname);
        query += ' AND Firstname LIKE ?';
        params.push(`%${searchCriteria.firstname}%`);
      }
    }

    // Add ordering if not already added for initial search
    if (!query.includes('ORDER BY')) {
      query += ' ORDER BY lastname, firstname';
    }

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
        phone: dbMember.Phone || member.phone,
        email: dbMember.Email || member.email
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