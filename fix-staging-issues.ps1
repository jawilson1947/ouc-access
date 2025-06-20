# OUC Access - Staging Server Critical Fixes
# This script helps identify and fix critical issues in the staging server codebase

Write-Host "🔧 OUC Access - Staging Server Critical Issue Fixes" -ForegroundColor Cyan
Write-Host "=" * 60

# Critical Issues to Fix:
Write-Host "`n🚨 CRITICAL ISSUES IDENTIFIED:" -ForegroundColor Red
Write-Host "1. Gmail vs Email Field Mapping - Admin login fails" -ForegroundColor Yellow
Write-Host "2. Inconsistent Search Logic - Sometimes works, sometimes doesn't" -ForegroundColor Yellow  
Write-Host "3. Missing Updated Files on Staging" -ForegroundColor Yellow

Write-Host "`n📋 FILES THAT NEED TO BE UPDATED ON STAGING:" -ForegroundColor Green
$filesToUpdate = @(
    "src/app/api/church-members/search/route.ts",
    "src/app/login/page.tsx",
    "src/components/AccessRequestForm.tsx", 
    "src/middleware.ts",
    "src/app/api/auth/config.ts",
    "src/app/api/church-members/route.ts",
    "src/app/api/send-email/route.ts"
)

foreach ($file in $filesToUpdate) {
    Write-Host "  ✓ $file" -ForegroundColor White
}

Write-Host "`n🔍 KEY FIX APPLIED:" -ForegroundColor Green
Write-Host "Fixed search query from:" -ForegroundColor Yellow
Write-Host "  ❌ SELECT * FROM ChurchMembers WHERE email = ?" -ForegroundColor Red
Write-Host "To:" -ForegroundColor Yellow  
Write-Host "  ✅ SELECT * FROM ChurchMembers WHERE (email = ? OR gmail = ?)" -ForegroundColor Green

Write-Host "`n📝 DEPLOYMENT STEPS FOR STAGING SERVER:" -ForegroundColor Cyan
Write-Host "1. Navigate to your staging server: /var/www/oucaccess"
Write-Host "2. Backup current files (recommended):"
Write-Host "   sudo cp -r /var/www/oucaccess /var/www/oucaccess-backup-$(date +%Y%m%d)"
Write-Host "3. Copy the following files from your local development to staging:"

foreach ($file in $filesToUpdate) {
    Write-Host "   - $file"
}

Write-Host "`n4. Restart the staging server application"
Write-Host "   sudo systemctl restart oucaccess  # (or your service name)"

Write-Host "`n🧪 TESTING CHECKLIST:" -ForegroundColor Magenta
Write-Host "After deploying fixes, test these scenarios:"
Write-Host "✓ Admin login with jawilson1947@gmail.com should find 1 member"
Write-Host "✓ Wildcard search (*) should work for admin"
Write-Host "✓ Regular user login should work normally"
Write-Host "✓ Previous/Next buttons should work in admin mode"

Write-Host "`n🔧 QUICK VALIDATION COMMANDS:" -ForegroundColor Blue
Write-Host "Test the API endpoint directly:"
Write-Host "curl 'http://your-staging-server/api/church-members/search?email=jawilson1947%40gmail.com&initial=true'"

Write-Host "`n📊 EXPECTED RESULTS:" -ForegroundColor Green
Write-Host "Before fix: Found members: 0 ❌"
Write-Host "After fix:  Found members: 1 ✅"

Write-Host "`n" + "=" * 60
Write-Host "🎯 This fix resolves the core admin authentication issue!" -ForegroundColor Green 