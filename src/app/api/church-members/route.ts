import { NextResponse } from 'next/server';
import { createChurchMember, updateChurchMember } from '@/lib/services/churchMembers';
import { DatabaseError } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('📝 Creating new church member:', data);
    
    const EmpID = await createChurchMember(data);
    
    return NextResponse.json({
      success: true,
      EmpID,
      message: 'Church member created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating church member:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof DatabaseError ? error.message : 'Failed to create church member'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log('📝 Updating church member:', data);
    
    if (!data.EmpID) {
      return NextResponse.json(
        { success: false, error: 'EmpID is required for updates' },
        { status: 400 }
      );
    }
    
    const success = await updateChurchMember(data);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Church member updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update church member' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error updating church member:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof DatabaseError ? error.message : 'Failed to update church member'
      },
      { status: 500 }
    );
  }
} 