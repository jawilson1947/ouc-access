# Create deployment archive with proper directory structure
Write-Host "Creating structured deployment archive..." -ForegroundColor Green

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
    $archiveName = "oucaccess-structured-$timestamp.zip"
    
    Write-Host "Creating structured archive: $archiveName" -ForegroundColor Yellow
    
    # Create the zip file with directory structure preserved
    Compress-Archive -Path $foundFiles -DestinationPath $archiveName -Force
    
    Write-Host "Archive created successfully!" -ForegroundColor Green
    Write-Host "File: $archiveName" -ForegroundColor Cyan
    Write-Host "Size: $((Get-Item $archiveName).Length / 1KB) KB" -ForegroundColor Cyan
    
    Write-Host "`nDeployment Instructions:" -ForegroundColor Yellow
    Write-Host "1. Copy $archiveName to your staging server" -ForegroundColor White
    Write-Host "2. Extract it in /var/www/oucaccess (preserves directory structure)" -ForegroundColor White
    Write-Host "3. Command: unzip -o $archiveName -d /var/www/oucaccess" -ForegroundColor Cyan
    Write-Host "4. Restart your PM2 process: pm2 restart oucaccess" -ForegroundColor White
    
    Write-Host "`nThis will fix:" -ForegroundColor Green
    Write-Host "- Gmail authentication blank form issue" -ForegroundColor White
    Write-Host "- Non-Gmail authentication errors" -ForegroundColor White
    Write-Host "- Admin wildcard search functionality" -ForegroundColor White
    
} else {
    Write-Host "No files found to archive!" -ForegroundColor Red
} 