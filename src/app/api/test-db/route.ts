import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test module imports
    const dbModule = await import('@/lib/db');
    const servicesModule = await import('@/lib/services/churchMembers');
    
    console.log('🔍 Testing module imports...');
    console.log('DB module exports:', Object.keys(dbModule));
    console.log('Services module exports:', Object.keys(servicesModule));
    console.log('executeQuery type:', typeof dbModule.executeQuery);
    
    return NextResponse.json({
      success: true,
      dbModule: Object.keys(dbModule),
      servicesModule: Object.keys(servicesModule),
      executeQueryAvailable: typeof dbModule.executeQuery === 'function',
      message: 'Module imports working correctly'
    });
  } catch (error: any) {
    console.error('❌ Module import test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 