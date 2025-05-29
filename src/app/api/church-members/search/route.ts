import { NextResponse } from 'next/server';
import { searchPaginatedChurchMembers } from '@/lib/services/churchMembers';
import { DatabaseError } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const searchCriteria = {
      email: searchParams.get('email') || undefined,
      phone: searchParams.get('phone') || undefined,
      userId: searchParams.get('userId') || undefined,
      lastname: searchParams.get('lastname') || undefined,
      firstname: searchParams.get('firstname') || undefined,
    };

    const result = await searchPaginatedChurchMembers(searchCriteria, page, limit);
    
    return NextResponse.json({ 
      success: true, 
      data: result 
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