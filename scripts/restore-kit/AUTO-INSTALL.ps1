# SEAPS one-click restore — run once on a NEW machine (no prompts if manifest is complete).
# Usage: double-click AUTO-INSTALL.bat OR:
#   powershell -ExecutionPolicy Bypass -File AUTO-INSTALL.ps1
$ErrorActionPreference = "Stop"
$KitRoot = $PSScriptRoot
$ManifestPath = Join-Path $KitRoot "manifest.json"
$Payload = Join-Path $KitRoot "payload"
$ProjectSrc = Join-Path $Payload "project"
$SecretsDir = Join-Path $Payload "secrets"
$DbDir = Join-Path $Payload "database"
$InstallRoot = Join-Path $env:USERPROFILE "lox-voice"
$LogFile = Join-Path $KitRoot "restore.log"

function Log([string]$Msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Msg"
  Add-Content -LiteralPath $LogFile -Value $line
  Write-Host $line
}

Log "SEAPS restore started"
if (-not (Test-Path -LiteralPath $ProjectSrc)) {
  throw "Missing payload/project — corrupt kit"
}

function Ensure-Node {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) { return }
  Log "Node.js not found — installing via winget..."
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) { throw "Install Node.js LTS from https://nodejs.org then re-run AUTO-INSTALL.bat" }
  & winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements -e
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node installed but not in PATH — open a new cmd window and run AUTO-INSTALL.bat again"
  }
}

function Ensure-Git {
  if (Get-Command git -ErrorAction SilentlyContinue) { return }
  Log "Git not found — installing via winget..."
  & winget install Git.Git --accept-package-agreements --accept-source-agreements -e
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}

Log "Target install folder: $InstallRoot"
if (Test-Path -LiteralPath $InstallRoot) {
  $bak = "$InstallRoot.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Log "Existing folder -> $bak"
  Rename-Item -LiteralPath $InstallRoot -NewName (Split-Path -Leaf $bak) -Force
}
New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null

Log "Copying project files (includes node_modules if present in kit)..."
Copy-Item -LiteralPath (Join-Path $ProjectSrc "*") -Destination $InstallRoot -Recurse -Force

foreach ($envName in @(".env.production.full", ".env.vercel.production", ".env.local")) {
  $src = Join-Path $SecretsDir $envName
  if (Test-Path -LiteralPath $src) {
    Copy-Item -LiteralPath $src -Destination (Join-Path $InstallRoot ".env.local") -Force
    Log "Applied secrets from $envName -> .env.local"
    break
  }
}

$dump = Join-Path $DbDir "postgres.dump.sql"
if (Test-Path -LiteralPath $dump) {
  $compose = Join-Path $KitRoot "docker-compose.postgres-restore.yml"
  if ((Test-Path -LiteralPath $compose) -and (Get-Command docker -ErrorAction SilentlyContinue)) {
    Log "Restoring Postgres via Docker..."
    Push-Location $KitRoot
    & docker compose -f docker-compose.postgres-restore.yml up -d
    Start-Sleep -Seconds 8
    $localUrl = "postgresql://seaps:seaps@127.0.0.1:5433/seaps?schema=public"
    if (Get-Command psql -ErrorAction SilentlyContinue) {
      & psql $localUrl -f $dump 2>>$LogFile
      Log "DB restore attempted (see log if errors)"
    }
    Pop-Location
    Add-Content -LiteralPath (Join-Path $InstallRoot ".env.local") -Value "`nDATABASE_URL=$localUrl"
  } else {
    Log "Postgres dump present but Docker/psql missing — DATABASE_URL unchanged; install Docker Desktop and re-run or restore manually"
  }
}

Ensure-Node
Ensure-Git
Push-Location -LiteralPath $InstallRoot

$hasModules = Test-Path -LiteralPath (Join-Path $InstallRoot "node_modules\@tailwindcss\turbopack\dist\index.js")
if (-not $hasModules) {
  Log "node_modules incomplete — running npm ci (may take several minutes)..."
  & npm ci
} else {
  Log "node_modules OK — skipping npm ci"
}

if (Test-Path -LiteralPath (Join-Path $InstallRoot "prisma\schema.prisma")) {
  Log "prisma generate..."
  & npx prisma generate 2>>$LogFile
}

Log "npm run build (verify)..."
& npm run build 2>>$LogFile
if ($LASTEXITCODE -ne 0) { Log "WARN: build failed — check restore.log; try npm ci manually" }

Pop-Location

$startBat = Join-Path $InstallRoot "START-DEV.bat"
@(
  "@echo off",
  "cd /d `"$InstallRoot`"",
  "npm run dev",
  "pause"
) | Set-Content -LiteralPath $startBat -Encoding ASCII

Log "DONE. Project: $InstallRoot"
Log "Start dev server: double-click $startBat or: cd $InstallRoot && npm run dev"
Write-Host ""
Write-Host "RESTORE COMPLETE -> $InstallRoot" -ForegroundColor Green
Write-Host "Run: $startBat" -ForegroundColor Green
