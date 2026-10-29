# SEAPS — ONE archive (node_modules, .git, .next, Vercel env + Blob export-drop) + cleanup.
param(
  [string] $WinnerPath = "C:\Users\Administrator\lox-voice",
  [string] $DuplicatePath = "C:\Users\Administrator\Documents\Default Project\khmer_backup\lox-voice",
  [string] $HomeProfile = "C:\Users\Administrator",
  [string] $BackupRoot = "C:\Users\Administrator\SEAPS-Backups",
  [switch] $BackupOnly,
  [switch] $DoCleanup,
  [switch] $ConfirmCleanup
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$workDir = Join-Path $BackupRoot "work-$stamp"
$finalArchive = Join-Path $BackupRoot "SEAPS-ABSOLUTE-ONE-$stamp.tar.gz"

New-Item -ItemType Directory -Force -Path $workDir, $BackupRoot | Out-Null

Write-Host "==> Vercel production env (requires: npm i -g vercel && vercel login)" -ForegroundColor Cyan
Push-Location -LiteralPath $WinnerPath
$envDrop = Join-Path $workDir "export-drop"
New-Item -ItemType Directory -Force -Path $envDrop | Out-Null
try {
  vercel link --yes --project lox-voice 2>$null
  vercel env pull (Join-Path $envDrop ".env.vercel.production") --environment=production --yes 2>$null
} catch {
  Write-Host "  (vercel env pull skipped — run manually if file missing)" -ForegroundColor Yellow
}
foreach ($name in @(".env", ".env.local", ".env.production", ".env.production.local")) {
  $p = Join-Path $WinnerPath $name
  if (Test-Path -LiteralPath $p) { Copy-Item -LiteralPath $p -Destination (Join-Path $envDrop $name) -Force }
}
Pop-Location

Write-Host "==> Vercel Blob (export-drop)" -ForegroundColor Cyan
$blobSrc = Join-Path $WinnerPath "backups\export-drop\vercel-blob-files"
if (Test-Path $blobSrc) {
  Copy-Item -Path $blobSrc -Destination (Join-Path $envDrop "vercel-blob-files") -Recurse -Force
}

Write-Host "==> Git bundle (all refs)" -ForegroundColor Cyan
$bundle = Join-Path $workDir "seaps-git-$stamp.bundle"
Push-Location -LiteralPath $WinnerPath
git bundle create $bundle --all
Pop-Location

Write-Host "==> FULL project tar INCLUDING node_modules and .git (large)" -ForegroundColor Cyan
$fullTar = Join-Path $BackupRoot "SEAPS-FULL-TREE-$stamp.tar.gz"
Push-Location -LiteralPath $WinnerPath
& tar -czf $fullTar .
Pop-Location

Write-Host "==> Kit + outer ONE archive" -ForegroundColor Cyan
$kitTar = Join-Path $BackupRoot "SEAPS-KIT-$stamp.tar.gz"
Push-Location -LiteralPath $workDir
& tar -czf $kitTar .
Pop-Location

Push-Location -LiteralPath $BackupRoot
& tar -czf $finalArchive "SEAPS-FULL-TREE-$stamp.tar.gz" "SEAPS-KIT-$stamp.tar.gz"
Pop-Location

Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "BACKUP READY:" -ForegroundColor Green
Write-Host "  $finalArchive"
Write-Host "  Size: $((Get-Item -LiteralPath $finalArchive).Length) bytes"

if ($BackupOnly -or -not $DoCleanup) { exit 0 }
if (-not $ConfirmCleanup) { throw "Add -ConfirmCleanup to remove duplicates" }

foreach ($j in @("package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml")) {
  $p = Join-Path $HomeProfile $j
  if (Test-Path -LiteralPath $p) { Rename-Item -LiteralPath $p -NewName "$j.bak-$stamp" -Force }
}
if (Test-Path -LiteralPath $DuplicatePath) {
  $arch = Join-Path (Split-Path -Parent $DuplicatePath) "lox-voice-ARCHIVED-$stamp"
  Rename-Item -LiteralPath $DuplicatePath -NewName (Split-Path -Leaf $arch) -Force
}
