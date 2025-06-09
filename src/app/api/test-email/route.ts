import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the email configuration by sending a test message
    const testEmailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lastname: 'Test',
        firstname: 'User',
        email: 'test@example.com',
        phone: '(256) 123-4567',
        action: 'test'
      }),
    });

    const result = await testEmailResponse.json();
    
    if (testEmailResponse.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully!',
        details: result
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Test email failed',
        details: result
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test email endpoint error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Use GET method to test email configuration' 
  }, { status: 405 });
} 