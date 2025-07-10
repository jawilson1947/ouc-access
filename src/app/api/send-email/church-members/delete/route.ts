import { NextResponse } from 'next/server';
import { deleteChurchMember } from '@/lib/services/churchMembers';
import { DatabaseError } from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const EmpID = searchParams.get('EmpID');
    
    if (!EmpID) {
      return NextResponse.json(
        { success: false, error: 'EmpID is required for deletion' },
        { status: 400 }
      );
    }
    
    console.log('🗑️ Deleting church member with EmpID:', EmpID);
    const success = await deleteChurchMember(Number(EmpID));
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Church member deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete church member' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error deleting church member:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof DatabaseError ? error.message : 'Failed to delete church member'
      },
      { status: 500 }
    );
  }
} 