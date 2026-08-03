# Heimdall frontend push script
# Usage: .\push.ps1 "your commit message"
#        .\push.ps1          (uses default message)

param(
  [string]$Message = "Update frontend"
)

Set-Location $PSScriptRoot

# Remove git lock file if it exists
$lock = Join-Path $PSScriptRoot ".git\index.lock"
if (Test-Path $lock) {
  Remove-Item $lock -Force
  Write-Host "Removed index.lock" -ForegroundColor Yellow
}

# Stage all changes (env is in .gitignore so it stays local)
git add -A

# Check if there's anything to commit
$status = git status --porcelain
if (-not $status) {
  Write-Host "Nothing to commit." -ForegroundColor Cyan
  exit 0
}

git commit -m $Message
git push origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "Pushed successfully." -ForegroundColor Green
} else {
  Write-Host "Push failed — check the output above." -ForegroundColor Red
}
