import { NextResponse } from 'next/server';

export async function GET() {
  if (!process.env.ADMIN_EMAIL) {
    return NextResponse.json(
      { error: 'Admin email not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    adminEmail: process.env.ADMIN_EMAIL
  });
} 