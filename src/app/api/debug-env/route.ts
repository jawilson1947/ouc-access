import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Only show this in non-production or for debugging
    const debugInfo = {
      nextauth_url: process.env.NEXTAUTH_URL || 'NOT_SET',
      nextauth_secret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
      google_client_id: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
      google_client_secret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      node_env: process.env.NODE_ENV || 'NOT_SET',
      base_url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      current_host: process.env.VERCEL_URL || 'localhost'
    };

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug endpoint error',
      details: error.message 
    }, { status: 500 });
  }
} 