# OUC Access - Staging Deployment Script
# This script copies changed files directly to your staging server

# Configuration - UPDATE THESE VALUES
$STAGING_SERVER = "your-staging-server.com"
$STAGING_USER = "your-username"
$STAGING_PATH = "/path/to/ouc-access"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"  # Optional: path to SSH key

# Files that have been modified (add/remove as needed)
$CHANGED_FILES = @(
    "src/components/AccessRequestForm.tsx",
    "src/lib/services/churchMembers.ts",
    "src/app/api/send-email/route.ts",
    "src/app/login/page.tsx", 
    "src/middleware.ts",
    "src/app/api/auth/config.ts",
    "src/app/api/church-members/route.ts"
)

Write-Host "🚀 Deploying OUC Access to Staging Server..." -ForegroundColor Green
Write-Host "Server: $STAGING_SERVER" -ForegroundColor Yellow
Write-Host "Path: $STAGING_PATH" -ForegroundColor Yellow

foreach ($file in $CHANGED_FILES) {
    if (Test-Path $file) {
        Write-Host "📁 Copying: $file" -ForegroundColor Cyan
        
        # Get the directory structure
        $remoteDir = Split-Path "$STAGING_PATH/$file" -Parent
        
        # Create directory on remote server if it doesn't exist
        ssh "$STAGING_USER@$STAGING_SERVER" "mkdir -p '$remoteDir'"
        
        # Copy the file
        scp $file "$STAGING_USER@$STAGING_SERVER:$STAGING_PATH/$file"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully copied: $file" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to copy: $file" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  File not found: $file" -ForegroundColor Yellow
    }
}

# Restart the application on staging server
Write-Host "🔄 Restarting application on staging server..." -ForegroundColor Cyan
ssh "$STAGING_USER@$STAGING_SERVER" "cd $STAGING_PATH && npm run build && pm2 restart ouc-access"

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Check your staging site: http://$STAGING_SERVER" -ForegroundColor Yellow 