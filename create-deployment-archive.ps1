# OUC Access - Create Deployment Archive
Write-Host "🚀 Creating Deployment Archive for Staging Server" -ForegroundColor Cyan

$criticalFiles = @(
    "src/app/api/church-members/search/route.ts",
    "src/app/api/auth/config.ts", 
    "src/components/AccessRequestForm.tsx",
    "src/middleware.ts",
    "src/app/login/page.tsx",
    "src/app/api/church-members/route.ts",
    "src/app/api/send-email/route.ts"
)

Write-Host "📋 Checking files..." -ForegroundColor Green
$foundFiles = @()
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
        $foundFiles += $file
    } else {
        Write-Host "  ❌ $file (MISSING!)" -ForegroundColor Red
    }
}

if ($foundFiles.Count -gt 0) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $archiveName = "oucaccess-critical-fixes-$timestamp.zip"
    
    Write-Host "`n📦 Creating archive: $archiveName" -ForegroundColor Cyan
    
    try {
        Compress-Archive -Path $foundFiles -DestinationPath $archiveName -Force
        Write-Host "✅ Archive created successfully!" -ForegroundColor Green
        Write-Host "📂 Files included: $($foundFiles.Count)" -ForegroundColor Green
        Write-Host "📁 Archive location: $(Get-Location)\$archiveName" -ForegroundColor Yellow
        
        Write-Host "`n🚀 Next Steps:" -ForegroundColor Magenta
        Write-Host "1. Copy archive to staging server" -ForegroundColor White
        Write-Host "2. Extract in /var/www/oucaccess" -ForegroundColor White  
        Write-Host "3. Run: pm2 restart oucaccess" -ForegroundColor White
        Write-Host "4. Check logs: pm2 logs oucaccess" -ForegroundColor White
        
    } catch {
        Write-Host "❌ Failed to create archive: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ No files found to archive!" -ForegroundColor Red
} 