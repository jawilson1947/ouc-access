# Get files changed since last staging deployment
param(
    [string]$stagingTag = "staging-deployed",  # Tag marking last staging deployment
    [switch]$createTag = $false  # Create/update the staging tag
)

Write-Host "🏷️  Comparing against staging tag: $stagingTag" -ForegroundColor Green

# Check if staging tag exists
$tagExists = git tag -l $stagingTag

if (-not $tagExists) {
    Write-Host "⚠️  Staging tag '$stagingTag' not found!" -ForegroundColor Yellow
    Write-Host "   Creating tag at current HEAD..." -ForegroundColor Cyan
    git tag $stagingTag
}

# Get changed files since staging tag
$changedFiles = git diff --name-only $stagingTag HEAD

if ($changedFiles) {
    Write-Host "📦 Files to deploy to staging:" -ForegroundColor Yellow
    
    # Separate by file type
    $sourceFiles = $changedFiles | Where-Object { $_ -match '\.(tsx?|js|ts)$' -and (Test-Path $_) }
    $configFiles = $changedFiles | Where-Object { $_ -match '\.(json|env|md)$' -and (Test-Path $_) }
    $otherFiles = $changedFiles | Where-Object { $_ -notmatch '\.(tsx?|js|ts|json|env|md)$' -and (Test-Path $_) }
    
    if ($sourceFiles) {
        Write-Host "`n📝 Source Files:" -ForegroundColor Cyan
        $sourceFiles | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
    }
    
    if ($configFiles) {
        Write-Host "`n⚙️  Config Files:" -ForegroundColor Yellow
        $configFiles | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
    }
    
    if ($otherFiles) {
        Write-Host "`n📄 Other Files:" -ForegroundColor Magenta
        $otherFiles | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
    }
    
    # Save all files to text file
    $allFiles = $changedFiles | Where-Object { Test-Path $_ }
    $allFiles | Out-File -FilePath "staging-deploy-list.txt" -Encoding UTF8
    Write-Host "`n💾 Deploy list saved to: staging-deploy-list.txt" -ForegroundColor Green
    
    # Option to update staging tag after successful deployment
    if ($createTag) {
        git tag -d $stagingTag 2>$null
        git tag $stagingTag
        Write-Host "🏷️  Updated staging tag to current HEAD" -ForegroundColor Green
    }
    
} else {
    Write-Host "✨ No changes since last staging deployment!" -ForegroundColor Green
}

Write-Host "`n📊 Total files to deploy: $($changedFiles.Count)" -ForegroundColor Yellow 