import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { searchChurchMembers } from '@/lib/services/churchMembers';
import { ChurchMember } from '@/types/database';

export async function GET(request: Request) {
  try {
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token) {
      console.log('❌ No token found in search route');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Token found for user:', token.email);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      console.log('❌ No query provided');
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Search query:', query);
    console.log('🔍 Is wildcard search:', query === '*');

    const members = await searchChurchMembers(query) as ChurchMember[];
    console.log('🔍 Raw database results:', JSON.stringify(members, null, 2));
    
    // Keep all fields exactly as they are from the database
    const mappedMembers = members.map((member: ChurchMember) => {
      // No transformation needed - return the member as-is
      console.log('📝 Mapped member:', JSON.stringify(member, null, 2));
      return member;
    });

    return NextResponse.json({
      success: true,
      members: mappedMembers
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/church-members/search:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
} 
