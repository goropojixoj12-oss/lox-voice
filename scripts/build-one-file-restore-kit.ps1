# BUILD the single restore kit on your CURRENT (working) Windows PC.
# Output: C:\Users\Administrator\SEAPS-Backups\SEAPS-ONE-CLICK-RESTORE.tar.gz
# On NEW PC: tar -xzf ... && AUTO-INSTALL.bat
param(
  [string] $ProjectPath = "C:\Users\Administrator\lox-voice",
  [string] $OutDir = "C:\Users\Administrator\SEAPS-Backups"
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$staging = Join-Path $OutDir "kit-staging-$stamp"
$kitName = "SEAPS-ONE-CLICK-RESTORE-$stamp"
$kitFolder = Join-Path $OutDir $kitName
$finalTar = Join-Path $OutDir "$kitName.tar.gz"

New-Item -ItemType Directory -Force -Path $staging, $OutDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $staging "payload\project") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $staging "payload\secrets") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $staging "payload\database") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $staging "payload\blob") | Out-Null

Write-Host "==> Copy FULL project (node_modules, .git, .next — everything)" -ForegroundColor Cyan
robocopy $ProjectPath (Join-Path $staging "payload\project") /MIR /XD "$staging" /NFL /NDL /NJH /NJS /nc /ns /np
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }

Write-Host "==> Vercel secrets (vercel login required)" -ForegroundColor Cyan
Push-Location $ProjectPath
$secrets = Join-Path $staging "payload\secrets"
try {
  vercel link --yes --project lox-voice 2>$null
  vercel env pull (Join-Path $secrets ".env.vercel.production") --environment=production --yes 2>$null
  Copy-Item (Join-Path $secrets ".env.vercel.production") (Join-Path $secrets ".env.production.full") -Force -ErrorAction SilentlyContinue
} catch {
  Write-Host "  vercel env pull failed — copy .env.local into payload\secrets\.env.production.full manually" -ForegroundColor Yellow
}
foreach ($f in @(".env.local", ".env")) {
  $p = Join-Path $ProjectPath $f
  if (Test-Path $p) { Copy-Item $p (Join-Path $secrets $f) -Force }
}

Write-Host "==> Postgres dump" -ForegroundColor Cyan
$dumpOut = Join-Path $staging "payload\database\postgres.dump.sql"
$envFile = Join-Path $secrets ".env.vercel.production"
if ((Test-Path $envFile) -and (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim()
    }
  }
  $url = $env:DATABASE_URL
  if (-not $url) { $url = $env:POSTGRES_URL }
  if ($url) {
    & pg_dump $url --no-owner --no-acl -F p -f $dumpOut
    Write-Host "  postgres dump OK"
  }
}
if (-not (Test-Path $dumpOut) -or (Get-Item $dumpOut).Length -lt 10) {
  "# no dump — install pg_dump + vercel env pull then rebuild kit" | Set-Content $dumpOut
}

Write-Host "==> Vercel Blob (listing media + store files)" -ForegroundColor Cyan
$blobOut = Join-Path $staging "payload\blob"
New-Item -ItemType Directory -Force -Path $blobOut | Out-Null
$prebuilt = Join-Path $ProjectPath "backups\export-drop\vercel-blob-files"
if (Test-Path $prebuilt) {
  Copy-Item -Path (Join-Path $prebuilt "*") -Destination $blobOut -Recurse -Force
}
Push-Location $ProjectPath
Get-Content (Join-Path $secrets ".env.vercel.production") -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim() }
}
node scripts/export-vercel-blob-download.mjs $blobOut 2>$null
Pop-Location

Write-Host "==> Restore installer scripts" -ForegroundColor Cyan
$restoreKit = Join-Path $ProjectPath "scripts\restore-kit"
Copy-Item (Join-Path $restoreKit "*") $staging -Force

$head = ""
Push-Location $ProjectPath
$head = git rev-parse HEAD 2>$null
Pop-Location

@{
  createdAt = (Get-Date).ToString("o")
  commit      = $head
  kind        = "SEAPS_ONE_CLICK_RESTORE"
  installTo   = "%USERPROFILE%\lox-voice"
} | ConvertTo-Json | Set-Content (Join-Path $staging "manifest.json") -Encoding UTF8

Write-Host "==> Pack single tar.gz" -ForegroundColor Cyan
if (Test-Path $kitFolder) { Remove-Item $kitFolder -Recurse -Force }
Move-Item $staging $kitFolder
Push-Location $OutDir
& tar -czf $finalTar $kitName
Pop-Location

Write-Host ""
Write-Host "BUILT: $finalTar" -ForegroundColor Green
Write-Host "Size:  $((Get-Item $finalTar).Length) bytes"
Write-Host ""
Write-Host "NEW MACHINE — ONE STEP:" -ForegroundColor Yellow
Write-Host "  tar -xzf $kitName.tar.gz"
Write-Host "  cd $kitName"
Write-Host "  AUTO-INSTALL.bat"
