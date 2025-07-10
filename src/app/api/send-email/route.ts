
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import fs from 'fs/promises';
import path from 'path';

// Type definition for email data
interface EmailData {
  lastname?: string;
  firstname?: string;
  email?: string;
  phone?: string;
  PictureUrl?: string;
  DeviceID?: string;
  action?: string;
}

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sendEmailWithSendGrid(emailData: EmailData) {
  const { lastname, firstname, email, phone, PictureUrl, DeviceID } = emailData;

  const recipientList = (process.env.NOTIFICATION_EMAILS || 'ouc-it@oucsda.org')
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
  const attachments = [];
  console.log('📬 Recipients to notify:', recipientList);
  if (PictureUrl && PictureUrl.startsWith('images/')) {
    try {
      const imagesDir = path.join(process.cwd(), 'public', 'images');
      const filename = path.basename(PictureUrl);
      const filePath = path.join(imagesDir, filename);

      console.log('📎 Attempting to attach photo:', {
        filename,
        filePath,
        exists: await fs.access(filePath).then(() => true).catch(() => false)
      });

      const fileContent = await fs.readFile(filePath);

      attachments.push({
        content: fileContent.toString('base64'),
        filename: filename,
        type: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
        disposition: 'attachment'
      });

      console.log('✅ Photo attached to email:', filename);
    } catch (error: any) {
      console.error('❌ Failed to attach photo:', {
        error: error.message,
        code: error.code,
        path: error.path
      });
    }
  } else {
    console.log('ℹ️ No photo to attach or invalid PictureUrl:', PictureUrl);
  }

  const emailPayload = {
    to: recipientList,
    from: {
      email: process.env.FROM_EMAIL || 'noreply@ouctv.org',
      name: 'OUC Access Request System'
    },
    subject: `OUC Access Request - New Applicant`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #000033; color: white; padding: 20px; text-align: center;">
          <h2>🏛️ OUC Access Request Notification</h2>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; margin-bottom: 20px;">
              A new record has been <strong style="color: #007bff;">CREATED</strong>
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px 0; font-weight: bold; color: #000033;">👤 Last Name:</td><td style="padding: 12px 0;">${lastname || 'Not provided'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px 0; font-weight: bold; color: #000033;">👤 First Name:</td><td style="padding: 12px 0;">${firstname || 'Not provided'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px 0; font-weight: bold; color: #000033;">📧 Email:</td><td style="padding: 12px 0;">${email || 'Not provided'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px 0; font-weight: bold; color: #000033;">📞 Phone:</td><td style="padding: 12px 0;">${phone || 'Not provided'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px 0; font-weight: bold; color: #000033;">📞 Device ID:</td><td style="padding: 12px 0;">${DeviceID || 'Not provided'}</td></tr>
              <tr><td style="padding: 12px 0; font-weight: bold; color: #000033;">🕐 Timestamp:</td><td style="padding: 12px 0;">${new Date().toLocaleString()}</td></tr>
            </table>
            ${PictureUrl ? `
              <div style="margin: 20px 0; text-align: center;">
                <p style="font-weight: bold; color: #000033; margin-bottom: 10px;">📸 Photo:</p>
                <p style="color: #666; font-size: 14px;">Photo has been attached to this email.</p>
              </div>
            ` : ''}
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
    attachments
  };

  try {
    await sgMail.sendMultiple(emailPayload);
    console.log('✅ Email sent to:', recipientList);
  } catch (error: any) {
    console.error('❌ SendGrid error:', {
      message: error.message,
      response: error.response?.body,
      attachments: attachments.length
    });
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const emailData = await req.json() as EmailData;
    const { lastname, firstname, email, phone, PictureUrl, DeviceID } = emailData;

    console.log('📧 Processing email notification:', {
      lastname,
      firstname,
      email,
      phone,
      DeviceID,
      hasPicture: !!PictureUrl
    });

    if (!lastname && !firstname && !email) {
      return NextResponse.json({ error: 'Missing required email data' }, { status: 400 });
    }

    if (!SENDGRID_API_KEY) {
      console.error('❌ SendGrid API key not configured');
      return NextResponse.json({ 
        success: false, 
        message: 'Email service not configured - notification skipped',
        details: 'SENDGRID_API_KEY or SEND_GRID_API_KEY not found in environment variables'
      }, { status: 200 });
    }

    try {
      await sendEmailWithSendGrid(emailData);
      return NextResponse.json({ 
        success: true, 
        message: 'Email notification sent successfully via SendGrid' 
      });
    } catch (error: any) {
      console.error('❌ SendGrid error:', {
        message: error.message,
        response: error.response?.body,
        code: error.code
      });
      return NextResponse.json({ 
        success: false,
        message: 'Email notification failed but record was saved successfully',
        details: error.response?.body?.errors?.[0]?.message || error.message || 'Unknown SendGrid error'
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('❌ General email error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Failed to process email request',
      details: error.message 
    }, { status: 500 });
  }
}
