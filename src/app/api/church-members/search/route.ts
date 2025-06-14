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
    const query = searchParams.get('query') || '';
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const members = await searchChurchMembers(query) as ChurchMember[];
    console.log('🔍 Raw database results:', JSON.stringify(members, null, 2));
    
    // Only modify the PictureUrl path, keep all other fields exactly as they are
    const mappedMembers = members.map((member: ChurchMember) => {
      const mapped = {
        ...member,
        PictureUrl: member.PictureUrl ? `/public/uploads/${member.PictureUrl.replace(/^\/?uploads\//, '')}` : null
      };
      console.log('📝 Mapped member:', JSON.stringify(mapped, null, 2));
      return mapped;
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
