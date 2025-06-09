# Staging Deployment Checklist

## Environment Variables Required on Staging Server

Create/update `.env.local` on staging with:

```bash
# Database Configuration
DB_HOST=your-staging-db-host
DB_USER=your-staging-db-user  
DB_PASSWORD=your-staging-db-password
DB_NAME=your-staging-db-name

# NextAuth Configuration
NEXTAUTH_URL=https://your-staging-domain.com
NEXTAUTH_SECRET=your-staging-secret

# Google OAuth (same as production)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# SendGrid (can use same as production)
SEND_GRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=your-verified-sendgrid-email
EMAIL_TO=admin@yourdomain.com

# Environment
NODE_ENV=production
PORT=3000
```

## Deployment Steps

### Method 1: Git-Based (Recommended)

```bash
# On local machine
git add .
git commit -m "Latest form improvements"
git push origin main

# On staging server
cd /path/to/ouc-access
git pull origin main
npm install  # If new dependencies added
npm run build
pm2 restart ouc-access  # or whatever process manager you use
```

### Method 2: File Copy

```powershell
# Update deploy-to-staging.ps1 with today's changed files:
$CHANGED_FILES = @(
    "src/components/AccessRequestForm.tsx",
    "src/lib/services/churchMembers.ts", 
    "src/app/api/send-email/route.ts"
)

# Then run:
./deploy-to-staging.ps1
```

## Files Changed Today

- `src/components/AccessRequestForm.tsx` - Form size +10%, picture size +10%, mobile app link font size
- `src/lib/services/churchMembers.ts` - Added missing imports for executeQuery
- `src/app/api/send-email/route.ts` - Fixed SendGrid API key variable name

## Post-Deployment Verification

1. ✅ Form loads properly
2. ✅ Database operations work (member search/update)
3. ✅ Photo upload works
4. ✅ Email notifications work
5. ✅ Mobile app download link is readable
6. ✅ Form and picture sizing looks correct

## Common Issues & Solutions

### Upload Directory
Ensure the staging server has the uploads directory:
```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

### Database Connection
Test database connectivity:
```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT 1;"
```

### SendGrid Verification
Ensure your SendGrid "From" email is verified in SendGrid dashboard. 