$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupScript = Join-Path $PSScriptRoot "backup-questions.ps1"
$validateScript = Join-Path $PSScriptRoot "validate-questions.js"
$exportScript = Join-Path $PSScriptRoot "export-questions-json.js"
$regenCategoriesScript = Join-Path $PSScriptRoot "regenerate-categories-index.js"
$backupDir = Join-Path $projectRoot "app\data\backups"
$jsonPath = Join-Path $projectRoot "public\questions.json"

Set-Location $projectRoot

function Invoke-And-RequireSuccess {
    param(
        [string]$Label,
        [scriptblock]$Command
    )
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "[safe-save] failed at: $Label (exit code: $LASTEXITCODE)"
    }
}

Write-Host "[safe-save] 1/7 validate source questions.ts"
Invoke-And-RequireSuccess "validate source" { node $validateScript --source }

Write-Host "[safe-save] 2/7 backup questions.ts"
& $backupScript

Write-Host "[safe-save] 3/7 export questions.json"
Invoke-And-RequireSuccess "export questions.json" { node $exportScript }

Write-Host "[safe-save] 4/7 regenerate public/questions/_categories.json"
Invoke-And-RequireSuccess "regenerate _categories.json" { node $regenCategoriesScript }

Write-Host "[safe-save] 5/7 validate generated questions.json + categories index"
Invoke-And-RequireSuccess "validate json" { node $validateScript --json }

Write-Host "[safe-save] 6/7 backup questions.json"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$jsonBackupPath = Join-Path $backupDir "questions-json.$timestamp.json"
Copy-Item -Path $jsonPath -Destination $jsonBackupPath -Force
Write-Host "[safe-save] json backup: $jsonBackupPath"

Write-Host "[safe-save] 7/7 optional git commit"
$inGitRepo = $false
try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -eq 0) { $inGitRepo = $true }
} catch {
    $inGitRepo = $false
}

if (-not $inGitRepo) {
    Write-Host "[safe-save] not a git repo, completed without commit"
    exit 0
}

git add app/data/questions.ts public/questions.json public/questions/_categories.json app/data/backups/*.ts app/data/backups/questions-json.*.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "[safe-save] warning: git add failed (exit code: $LASTEXITCODE). Validation and backups are completed."
    exit 0
}

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "[safe-save] no staged changes, completed"
    exit 0
}

$commitTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "questions safe snapshot $commitTimestamp" *> $null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[safe-save] committed: questions safe snapshot $commitTimestamp"
} else {
    Write-Host "[safe-save] commit skipped (possibly no changes)"
}
