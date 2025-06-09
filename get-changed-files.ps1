# Get Changed Files - Identifies files that have been modified
param(
    [string]$since = "HEAD~1",  # Compare against last commit by default
    [string]$outputFormat = "list"  # "list" or "paths"
)

Write-Host "🔍 Finding changed files since: $since" -ForegroundColor Green

# Get list of changed files from git
$changedFiles = git diff --name-only $since HEAD

if ($changedFiles) {
    Write-Host "📝 Found $($changedFiles.Count) changed files:" -ForegroundColor Yellow
    
    if ($outputFormat -eq "list") {
        foreach ($file in $changedFiles) {
            if (Test-Path $file) {
                Write-Host "  ✅ $file" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $file (deleted)" -ForegroundColor Red
            }
        }
    } else {
        # Output just the paths for use in other scripts
        $changedFiles | Where-Object { Test-Path $_ }
    }
    
    # Create a file list for easy copying
    $changedFiles | Where-Object { Test-Path $_ } | Out-File -FilePath "changed-files.txt" -Encoding UTF8
    Write-Host "📄 File list saved to: changed-files.txt" -ForegroundColor Cyan
    
} else {
    Write-Host "✨ No changes found!" -ForegroundColor Green
}

# Show git status for context
Write-Host "`n📊 Current git status:" -ForegroundColor Yellow
git status --short 