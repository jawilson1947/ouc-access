# Create deployment archive for staging server
Write-Host "Creating deployment archive..." -ForegroundColor Green

$files = @(
    "src/app/api/church-members/search/route.ts",
    "src/app/api/auth/config.ts", 
    "src/components/AccessRequestForm.tsx",
    "src/middleware.ts",
    "src/app/login/page.tsx",
    "src/app/api/church-members/route.ts",
    "src/app/api/send-email/route.ts"
)

$foundFiles = @()
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Found: $file" -ForegroundColor Green
        $foundFiles += $file
    } else {
        Write-Host "Missing: $file" -ForegroundColor Red
    }
}

if ($foundFiles.Count -gt 0) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $archiveName = "oucaccess-fixes-$timestamp.zip"
    
    Write-Host "Creating archive: $archiveName"
    Compress-Archive -Path $foundFiles -DestinationPath $archiveName -Force
    
    Write-Host "SUCCESS: Archive created with $($foundFiles.Count) files" -ForegroundColor Green
    Write-Host "Location: $((Get-Location).Path)\$archiveName" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Next steps for staging deployment:" -ForegroundColor Cyan
    Write-Host "1. Copy $archiveName to your staging server"
    Write-Host "2. Extract files in /var/www/oucaccess directory"  
    Write-Host "3. Run: pm2 restart oucaccess"
    Write-Host "4. Check logs: pm2 logs oucaccess"
} else {
    Write-Host "ERROR: No files found to archive!" -ForegroundColor Red
} 