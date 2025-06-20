# OUC Access - Deploy Critical Fixes to Staging Server
# This script helps copy the updated files to fix Gmail and non-Gmail authentication issues

Write-Host "🚀 OUC Access - Staging Server Deployment" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "`n🎯 DEPLOYMENT TARGET: /var/www/oucaccess" -ForegroundColor Green
Write-Host "🔧 FIXING: Gmail authentication blank form issue" -ForegroundColor Yellow
Write-Host "🔧 FIXING: Non-Gmail authentication errors" -ForegroundColor Yellow

Write-Host "`n📋 CRITICAL FILES TO DEPLOY:" -ForegroundColor Green

$criticalFiles = @(
    "src/app/api/church-members/search/route.ts",
    "src/app/api/auth/config.ts", 
    "src/components/AccessRequestForm.tsx",
    "src/middleware.ts",
    "src/app/login/page.tsx",
    "src/app/api/church-members/route.ts",
    "src/app/api/send-email/route.ts"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (MISSING!)" -ForegroundColor Red
    }
}

Write-Host "`n💡 DEPLOYMENT OPTIONS:" -ForegroundColor Cyan

Write-Host "`nOption 1 - Create Archive:" -ForegroundColor White
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveName = "oucaccess-critical-fixes-$timestamp.zip"

if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Write-Host "📦 Creating deployment archive..." -ForegroundColor Green
    
    $filesToArchive = @()
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            $filesToArchive += $file
        }
    }
    
    if ($filesToArchive.Count -gt 0) {
        try {
            Compress-Archive -Path $filesToArchive -DestinationPath $archiveName -Force
            Write-Host "✅ Archive created: $archiveName" -ForegroundColor Green
            Write-Host "📂 Files included: $($filesToArchive.Count) of $($criticalFiles.Count)" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to create archive: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ No files found to archive!" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Compress-Archive not available." -ForegroundColor Yellow
}

Write-Host "`nOption 2 - Manual SCP Commands:" -ForegroundColor White
Write-Host "Use these commands to copy files individually:" -ForegroundColor Gray
foreach ($file in $criticalFiles) {
    $escapedFile = $file -replace "'", "''"
    Write-Host "scp '$escapedFile' user@staging-server:/var/www/oucaccess/$file" -ForegroundColor Gray
}

Write-Host "`n🎯 AFTER DEPLOYMENT - Run on staging server:" -ForegroundColor Green
Write-Host "cd /var/www/oucaccess" -ForegroundColor Gray
Write-Host "pm2 restart oucaccess" -ForegroundColor Gray
Write-Host "pm2 logs oucaccess --lines 20" -ForegroundColor Gray

Write-Host "`n✅ SUCCESS INDICATORS:" -ForegroundColor Magenta
Write-Host "After deployment, logs should show:" -ForegroundColor White
Write-Host "  • Gmail login: Query contains (email = ? OR gmail = ?)" -ForegroundColor Gray
Write-Host "  • Found members: > 0 (not 0)" -ForegroundColor Gray
Write-Host "  • No executeQuery errors" -ForegroundColor Gray 