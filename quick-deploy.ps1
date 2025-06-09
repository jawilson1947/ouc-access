# Quick Deploy - Copy specific files to staging
param(
    [string]$server = "your-server.com",
    [string]$user = "your-username", 
    [string]$path = "/path/to/ouc-access"
)

# Just the files we modified today
$files = @(
    "src/components/AccessRequestForm.tsx",
    "src/app/login/page.tsx",
    "src/middleware.ts"
)

Write-Host "📦 Quick deploying files to $server..." -ForegroundColor Green

foreach ($file in $files) {
    Write-Host "Copying $file..." -ForegroundColor Cyan
    scp $file "$user@${server}:$path/$file"
}

Write-Host "✅ Deploy complete!" -ForegroundColor Green 