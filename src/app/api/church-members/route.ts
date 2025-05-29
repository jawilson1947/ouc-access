import { NextResponse } from 'next/server';
import { 
  getAllChurchMembers, 
  getChurchMemberById,
  getPaginatedChurchMembers,
  createChurchMember,
  updateChurchMember,
  deleteChurchMember
} from '@/lib/services/churchMembers';
import { DatabaseError } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('empId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (empId) {
      const member = await getChurchMemberById(parseInt(empId));
      if (!member) {
        return NextResponse.json(
          { success: false, error: 'Member not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: member });
    }

    const result = await getPaginatedChurchMembers(page, limit);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in GET /api/church-members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof DatabaseError ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const empId = await createChurchMember(data);
    return NextResponse.json({ success: true, data: { empId } });
  } catch (error) {
    console.error('Error in POST /api/church-members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof DatabaseError ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const success = await updateChurchMember(data);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/church-members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof DatabaseError ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('empId');
    
    if (!empId) {
      return NextResponse.json(
        { success: false, error: 'EmpId is required' },
        { status: 400 }
      );
    }

    const success = await deleteChurchMember(parseInt(empId));
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/church-members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof DatabaseError ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}