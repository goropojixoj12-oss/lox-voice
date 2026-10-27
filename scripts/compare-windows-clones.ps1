# Compare two local lox-voice folders on Windows and write a Markdown report.
# Usage (PowerShell):
#   .\scripts\compare-windows-clones.ps1 `
#     -PathA "C:\Users\Administrator\lox-voice" `
#     -PathB "C:\Users\Administrator\Documents\Default Project\khmer_backup\lox-voice" `
#     -OutFile ".\docs\local-clones-comparison-report.md"

param(
  [Parameter(Mandatory = $true)]
  [string] $PathA,
  [Parameter(Mandatory = $true)]
  [string] $PathB,
  [string] $OutFile = "docs\local-clones-comparison-report.md"
)

$ErrorActionPreference = "SilentlyContinue"

function Get-CloneFacts {
  param([string] $Root)

  $facts = [ordered]@{
    Path           = $Root
    Exists         = Test-Path -LiteralPath $Root
    IsGitRepo      = $false
    Remotes        = @()
    Branch         = $null
    HeadSha        = $null
    HeadSubject    = $null
    DirtyFiles     = 0
    LockBytes      = $null
    PackageJsonSha = $null
    HasValidateScript = $false
    HasRestoreScript  = $false
    HasBuildVerify    = $false
    NpmCiExitCode  = $null
  }

  if (-not $facts.Exists) { return $facts }

  $gitDir = Join-Path $Root ".git"
  $facts.IsGitRepo = Test-Path -LiteralPath $gitDir

  if ($facts.IsGitRepo) {
    Push-Location -LiteralPath $Root
    $facts.Remotes = @(git remote -v 2>$null)
    $facts.Branch = git branch --show-current 2>$null
    $facts.HeadSha = git rev-parse HEAD 2>$null
    $facts.HeadSubject = git log -1 --format=%s 2>$null
    $status = git status --porcelain 2>$null
    if ($status) { $facts.DirtyFiles = @($status).Count }
    Pop-Location
  }

  $lockPath = Join-Path $Root "package-lock.json"
  if (Test-Path -LiteralPath $lockPath) {
    $facts.LockBytes = (Get-Item -LiteralPath $lockPath).Length
  }

  $pkgPath = Join-Path $Root "package.json"
  if (Test-Path -LiteralPath $pkgPath) {
    $facts.PackageJsonSha = (Get-FileHash -LiteralPath $pkgPath -Algorithm SHA256).Hash
  }

  $facts.HasValidateScript = Test-Path -LiteralPath (Join-Path $Root "scripts\validate-package-lock.mjs")
  $facts.HasRestoreScript  = Test-Path -LiteralPath (Join-Path $Root "scripts\restore-package-lock.mjs")
  $facts.HasBuildVerify    = Test-Path -LiteralPath (Join-Path $Root "public\seaps-build-verify.json")

  if ($facts.LockBytes -ge 10000 -and (Test-Path -LiteralPath (Join-Path $Root "node_modules"))) {
    Push-Location -LiteralPath $Root
    npm ci 2>&1 | Out-Null
    $facts.NpmCiExitCode = $LASTEXITCODE
    Pop-Location
  }

  return $facts
}

function Score-Clone {
  param($Facts)

  $score = 0
  $reasons = @()

  if (-not $Facts.Exists) { return @{ Score = -1000; Reasons = @("folder missing") } }

  $remoteText = ($Facts.Remotes -join "`n")
  if ($remoteText -match "goropojixoj12-oss/lox-voice") {
    $score += 40
    $reasons += "remote points to production repo goropojixoj12-oss/lox-voice"
  } else {
    $reasons += "remote is NOT goropojixoj12-oss/lox-voice (fix or discard)"
  }

  if ($Facts.LockBytes -ge 250000) {
    $score += 35
    $reasons += "package-lock.json looks full ($($Facts.LockBytes) bytes)"
  } elseif ($Facts.LockBytes -ge 10000) {
    $score += 15
    $reasons += "package-lock.json medium size ($($Facts.LockBytes) bytes) — verify npm ci"
  } elseif ($null -ne $Facts.LockBytes) {
    $score -= 30
    $reasons += "package-lock.json TOO SMALL ($($Facts.LockBytes) bytes) — stub/m garbage"
  } else {
    $score -= 20
    $reasons += "no package-lock.json"
  }

  if ($Facts.NpmCiExitCode -eq 0) {
    $score += 30
    $reasons += "npm ci succeeded"
  } elseif ($null -ne $Facts.NpmCiExitCode) {
    $score -= 25
    $reasons += "npm ci FAILED (exit $($Facts.NpmCiExitCode))"
  }

  if ($Facts.HasValidateScript) {
    $score += 5
    $reasons += "has scripts/validate-package-lock.mjs (pulled recent main)"
  } else {
    $reasons += "missing validate script — likely stale git pull"
  }

  if ($Facts.DirtyFiles -eq 0) {
    $score += 5
    $reasons += "clean working tree"
  } else {
    $reasons += "uncommitted changes: $($Facts.DirtyFiles) files (not auto-bad)"
  }

  return @{ Score = $score; Reasons = $reasons }
}

$a = Get-CloneFacts -Root $PathA
$b = Get-CloneFacts -Root $PathB
$sa = Score-Clone -Facts $a
$sb = Score-Clone -Facts $b

$winner = if ($sa.Score -ge $sb.Score) { "A" } else { "B" }
$winnerPath = if ($winner -eq "A") { $PathA } else { $PathB }
$loserPath  = if ($winner -eq "A") { $PathB } else { $PathA }

$lines = @()
$lines += "# Local clones comparison report"
$lines += ""
$lines += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') (local machine)"
$lines += ""
$lines += "Production Git remote must be: \`https://github.com/goropojixoj12-oss/lox-voice.git\`"
$lines += ""
$lines += "## Verdict"
$lines += ""
$lines += "**Keep (primary):** \`$winnerPath\`"
$lines += "**Archive/rename (do not use for push):** \`$loserPath\`"
$lines += ""
$lines += "| Clone | Score |"
$lines += "|-------|-------|"
$lines += "| A: \`$PathA\` | $($sa.Score) |"
$lines += "| B: \`$PathB\` | $($sb.Score) |"
$lines += ""
$lines += "## Clone A"
$lines += ""
$lines += "```json"
$lines += ($a | ConvertTo-Json -Depth 4)
$lines += "```"
$lines += ""
$lines += "### Scoring A"
foreach ($r in $sa.Reasons) { $lines += "- $r" }
$lines += ""
$lines += "## Clone B"
$lines += ""
$lines += "```json"
$lines += ($b | ConvertTo-Json -Depth 4)
$lines += "```"
$lines += ""
$lines += "### Scoring B"
foreach ($r in $sb.Reasons) { $lines += "- $r" }
$lines += ""
$lines += "## Next steps (winner only)"
$lines += ""
$lines += "1. \`cd\` to winner path."
$lines += "2. \`git pull origin main\`"
$lines += "3. If lock small: \`del package-lock.json\` then \`npm install\` then \`npm ci\`"
$lines += "4. \`npm run build\`"
$lines += "5. \`git add package-lock.json\` → commit → \`git push origin main\` (fixes Vercel Install)"
$lines += "6. Rename loser folder to \`lox-voice-ARCHIVE-<date>\`"
$lines += ""

$outDir = Split-Path -Parent $OutFile
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$lines -join "`n" | Set-Content -LiteralPath $OutFile -Encoding UTF8
Write-Host "Wrote report: $OutFile"
Write-Host "Recommended primary clone: $winnerPath"
