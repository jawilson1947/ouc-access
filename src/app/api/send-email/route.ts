import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { lastname, firstname, email, phone, action } = await req.json();

    const msg = {
      to: 'ouc-it@oucsda.org',
      from: 'oucaccess@ouc.org',
      subject: `OUC Access Request - ${action === 'update' ? 'Updated' : 'New'} Record`,
      html: `
        <h3>OUC Access Request Notification</h3>
        <p>A record has been <strong>${action === 'update' ? 'updated' : 'created'}</strong>.</p>
        
        <h4>Details:</h4>
        <ul>
          <li><strong>Last Name:</strong> ${lastname}</li>
          <li><strong>First Name:</strong> ${firstname}</li>
          <li><strong>Email Address:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
        </ul>
      `,
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 