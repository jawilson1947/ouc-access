# Email Configuration Setup Guide

## Overview
The OUC Access system now supports two email methods:
1. **SendGrid** (Primary method)
2. **SMTP/Nodemailer** (Fallback method)

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

### SendGrid Configuration (Recommended)
```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Email Settings
NOTIFICATION_EMAIL=ouc-it@oucsda.org
FROM_EMAIL=noreply@oucsda.org
```

### SMTP Configuration (Fallback)
```bash
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_account@gmail.com
SMTP_PASS=your_app_password_or_password

# Alternative SMTP providers
# SMTP_HOST=smtp.office365.com  # For Outlook/Office365
# SMTP_HOST=mail.your-domain.com  # For custom domains
```

### Complete Example .env.local
```bash
# Database Configuration (existing)
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# NextAuth Configuration (existing)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Configuration
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
NOTIFICATION_EMAIL=ouc-it@oucsda.org
FROM_EMAIL=noreply@oucsda.org

# SMTP Fallback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_system_email@gmail.com
SMTP_PASS=your_app_password
```

## Setup Instructions

### Option 1: SendGrid (Recommended)

1. **Create SendGrid Account**
   - Go to https://sendgrid.com/
   - Sign up for a free account (100 emails/day)

2. **Generate API Key**
   - Login to SendGrid dashboard
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Choose "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the generated API key

3. **Domain Authentication (Important)**
   - Go to Settings → Sender Authentication
   - Authenticate your domain (oucsda.org)
   - Or set up Single Sender Verification for the FROM_EMAIL address

4. **Update Environment Variables**
   ```bash
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   FROM_EMAIL=noreply@oucsda.org  # Must be verified in SendGrid
   NOTIFICATION_EMAIL=ouc-it@oucsda.org
   ```

### Option 2: Gmail SMTP (Fallback)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Enable 2-Factor Authentication

2. **Generate App Password**
   - Go to Google Account → Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in SMTP_PASS

3. **Update Environment Variables**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=your_16_character_app_password
   ```

### Option 3: Office365/Outlook SMTP

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your_office365_email@yourdomain.com
SMTP_PASS=your_password
```

## Testing the Configuration

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Submit an Access Request**
   - Fill out the form and click Save
   - Check the console logs for email status

3. **Check Console Logs**
   - Success: "Email sent successfully via SendGrid" or "Email sent successfully via SMTP"
   - Failure: Will show configuration issues and error details

## Troubleshooting

### Common Issues

1. **SendGrid "Unauthorized" Error**
   - Verify API key is correct
   - Check that FROM_EMAIL is verified in SendGrid
   - Ensure domain authentication is complete

2. **Gmail SMTP Authentication Failed**
   - Verify 2FA is enabled
   - Use App Password, not regular password
   - Check "Less secure app access" if using regular password

3. **"Email service not properly configured"**
   - Check that environment variables are set correctly
   - Restart the development server after adding variables
   - Verify .env.local file is in the project root

### Debug Information

The system will log configuration issues:
- Missing SENDGRID_API_KEY
- Missing SMTP_USER or SMTP_PASS
- Actual error messages from email providers

### Email Template Preview

The system sends professional HTML emails with:
- 🏛️ OUC branding and colors
- Formatted user information table
- Action indicators (NEW/UPDATED)
- Timestamp and professional footer

## Security Notes

1. **Never commit .env files to Git**
   - Add .env.local to .gitignore
   - Use environment variables in production

2. **Use App Passwords**
   - Never use regular email passwords
   - Generate specific app passwords for this application

3. **Verify Sender Domains**
   - Authenticate your domain with SendGrid
   - Use official oucsda.org email addresses

## Production Deployment

For production servers, set environment variables through:
- Server environment configuration
- Docker environment files
- Cloud platform environment settings (AWS, Azure, etc.)

Never use .env files in production - use proper environment variable management. 