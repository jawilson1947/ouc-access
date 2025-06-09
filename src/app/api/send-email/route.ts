import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sendEmailWithSendGrid(emailData: any) {
  const { lastname, firstname, email, phone, action } = emailData;
  
  const msg = {
    to: process.env.NOTIFICATION_EMAIL || 'ouc-it@oucsda.org',
    from: {
      email: process.env.FROM_EMAIL || 'noreply@ouctv.org',
      name: 'OUC Access System'
    },
    subject: `OUC Access Request - ${action === 'update' ? 'Updated' : 'New'} Record`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #000033; color: white; padding: 20px; text-align: center;">
          <h2>🏛️ OUC Access Request Notification</h2>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; margin-bottom: 20px;">
              A record has been <strong style="color: ${action === 'update' ? '#28a745' : '#007bff'};">
                ${action === 'update' ? 'UPDATED' : 'CREATED'}
              </strong>
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #000033;">👤 Last Name:</td>
                <td style="padding: 12px 0;">${lastname || 'Not provided'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #000033;">👤 First Name:</td>
                <td style="padding: 12px 0;">${firstname || 'Not provided'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #000033;">📧 Email:</td>
                <td style="padding: 12px 0;">${email || 'Not provided'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #000033;">📞 Phone:</td>
                <td style="padding: 12px 0;">${phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: bold; color: #000033;">🕐 Timestamp:</td>
                <td style="padding: 12px 0;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
              <p style="margin: 0; color: #1976d2;">
                <strong>Action Required:</strong> Please review this access request in the OUC Access Control System.
              </p>
            </div>
          </div>
        </div>
        
        <div style="background: #000033; color: white; padding: 15px; text-align: center; font-size: 12px;">
          © 2025 Oakwood University Church - Automated notification from OUC Access Control System
        </div>
      </div>
    `,
  };

  await sgMail.send(msg);
}

export async function POST(req: Request) {
  try {
    const emailData = await req.json();
    const { lastname, firstname, email, phone, action } = emailData;

    // Environment check (silent)
    console.log('📧 Attempting to send email notification...');

    // Validate required data
    if (!lastname && !firstname && !email) {
      return NextResponse.json({ error: 'Missing required email data' }, { status: 400 });
    }

    // Check if SendGrid is configured
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return NextResponse.json({ 
        success: false, 
        message: 'Email service not configured - notification skipped',
        details: 'SENDGRID_API_KEY or SEND_GRID_API_KEY not found in environment variables'
      }, { status: 200 }); // Return 200 instead of 500 to not break the main flow
    }

    try {
      console.log('Sending email via SendGrid...');
      await sendEmailWithSendGrid(emailData);
      console.log('Email sent successfully via SendGrid');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email notification sent successfully via SendGrid' 
      });
    } catch (error: any) {
      console.error('SendGrid error:', error.response?.body || error.message || error);
      
      // Return success but with warning so main functionality continues
      return NextResponse.json({ 
        success: false,
        message: 'Email notification failed but record was saved successfully',
        details: error.response?.body?.errors?.[0]?.message || error.message || 'Unknown SendGrid error'
      }, { status: 200 }); // Return 200 instead of 500 to not break the main flow
    }
  } catch (error: any) {
    console.error('General email error:', error.message || error);
    return NextResponse.json({ 
      error: 'Failed to process email request',
      details: error.message 
    }, { status: 500 });
  }
} 