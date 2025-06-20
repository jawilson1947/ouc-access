# OUC Access - Verify Staging Server Search Fix
# This script helps verify that the staging server has the correct search logic

Write-Host "🔧 OUC Access - Staging Server Search Logic Verification" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "`n🚨 CRITICAL ISSUE IDENTIFIED:" -ForegroundColor Red
Write-Host "Admin Gmail login works, but form is blank because:" -ForegroundColor Yellow
Write-Host "  • Authentication: ✅ Working (isAdmin: true)" -ForegroundColor Green
Write-Host "  • Initial Search: ❌ BROKEN - Only checks 'email' field" -ForegroundColor Red
Write-Host "  • Gmail address stored in 'gmail' field, not 'email' field" -ForegroundColor Yellow

Write-Host "`n📋 MISSING FILE ON STAGING SERVER:" -ForegroundColor Red
Write-Host "  src/app/api/church-members/search/route.ts" -ForegroundColor Yellow
Write-Host "  ↳ This file contains the Gmail field fix but wasn't deployed" -ForegroundColor White

Write-Host "`n🔍 CURRENT BEHAVIOR (BROKEN):" -ForegroundColor Red
Write-Host "  🔍 Initial user search for: jawilson1947@gmail.com" -ForegroundColor White
Write-Host "  🔍 Final query: SELECT * FROM ChurchMembers WHERE 1=1 AND email = ?" -ForegroundColor White
Write-Host "  ✅ Found members: 0  # <-- This is why form is blank!" -ForegroundColor Red

Write-Host "`n✅ EXPECTED BEHAVIOR (FIXED):" -ForegroundColor Green
Write-Host "  🔍 Initial user search for: jawilson1947@gmail.com" -ForegroundColor White
Write-Host "  🔍 Final query: SELECT * FROM ChurchMembers WHERE 1=1 AND (email = ? OR gmail = ?)" -ForegroundColor White
Write-Host "  ✅ Found members: 1  # <-- Form will populate!" -ForegroundColor Green

Write-Host "`n🚀 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Copy updated search route to staging server:" -ForegroundColor White
Write-Host "   scp src/app/api/church-members/search/route.ts user@staging:/var/www/oucaccess/src/app/api/church-members/search/" -ForegroundColor Gray
Write-Host "2. Restart the staging server application" -ForegroundColor White
Write-Host "3. Test Gmail login - form should now populate" -ForegroundColor White

Write-Host "`n📂 FILES THAT NEED TO BE DEPLOYED:" -ForegroundColor Green
Get-Content "todays-changes.txt" | ForEach-Object {
    if ($_ -eq "src/app/api/church-members/search/route.ts") {
        Write-Host "  ✅ $_" -ForegroundColor Green
    } else {
        Write-Host "  📄 $_" -ForegroundColor White
    }
}

Write-Host "`n🔧 TO VERIFY THE FIX WORKED:" -ForegroundColor Cyan
Write-Host "  1. Login with jawilson1947@gmail.com" -ForegroundColor White
Write-Host "  2. Check PM2 logs for: 'Final query: SELECT * FROM ChurchMembers WHERE 1=1 AND (email = ? OR gmail = ?)'" -ForegroundColor White
Write-Host "  3. Look for: 'Found members: 1' instead of 'Found members: 0'" -ForegroundColor White
Write-Host "  4. Form should now populate with admin user data" -ForegroundColor White

Write-Host "`n🎯 ROOT CAUSE:" -ForegroundColor Yellow
Write-Host "  Admin uses Gmail for login: jawilson1947@gmail.com" -ForegroundColor White
Write-Host "  But database record has:" -ForegroundColor White
Write-Host "    email: 'jwilson@oucsda.org'" -ForegroundColor White
Write-Host "    gmail: 'jawilson1947@gmail.com'" -ForegroundColor White
Write-Host "  Initial search must check BOTH fields!" -ForegroundColor White

Write-Host "`n" -NoNewline 