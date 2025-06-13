import { auth } from '../../../../auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    return NextResponse.json(session || {});
  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
