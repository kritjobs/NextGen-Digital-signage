# ============================================================
# Sync Dev -> Production (10.70.0.1\c\signage) via SMB
# - Compares SHA-256, copies only changed/new source files
# - Skips .env, uploads, backups, node_modules, dist (Docker builds these)
# Usage: powershell -ExecutionPolicy Bypass -File sync-to-prod.ps1
# ============================================================
$ErrorActionPreference = 'Stop'

$localRoot  = 'C:\NextGen Digital Signature\enterprise-digital-signage-platform'
$remoteRoot = '\\10.70.0.1\c\signage'

# Folders/files that must NOT be synced (prod-owned or Docker-generated)
$excludeDirs  = @('node_modules', 'dist', 'uploads', 'backups', '.git', '.vite', 'android-player\app\build', 'android-player\.gradle')
$excludeFiles = @('.env', '.env.production', '*.log', '*.pid')

function Should-ExcludeDir([string]$rel) {
    foreach ($d in $excludeDirs) {
        if ($rel -eq $d -or $rel.StartsWith($d + '\') -or $rel.StartsWith($d + '/')) { return $true }
    }
    return $false
}

function Should-ExcludeFile([string]$name) {
    foreach ($p in $excludeFiles) {
        if ($name -like $p) { return $true }
    }
    return $false
}

function Get-RelPath([string]$full, [string]$base) {
    return $full.Substring($base.Length).TrimStart('\', '/')
}

Write-Output '=== Checking access to prod ==='
if (-not (Test-Path $remoteRoot)) {
    Write-Output "ERROR: cannot reach $remoteRoot - check network/credentials first"
    exit 1
}
Write-Output "OK: $remoteRoot reachable"

$toCopy = @()
$unchanged = 0

Write-Output ''
Write-Output '=== Comparing files (SHA-256) ==='
$localFiles = Get-ChildItem $localRoot -Recurse -File | Where-Object {
    $rel = Get-RelPath $_.FullName $localRoot
    -not (Should-ExcludeDir $rel) -and -not (Should-ExcludeFile $_.Name)
}

foreach ($f in $localFiles) {
    $rel = Get-RelPath $f.FullName $localRoot
    $remoteFile = Join-Path $remoteRoot $rel
    $localHash = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
    $remoteHash = $null
    if (Test-Path $remoteFile) {
        $remoteHash = (Get-FileHash $remoteFile -Algorithm SHA256).Hash
    }
    if ($remoteHash -ne $localHash) {
        $toCopy += [PSCustomObject]@{ Rel = $rel; Size = $f.Length }
    } else {
        $unchanged++
    }
}

Write-Output ("Total {0} files | unchanged {1} | new/changed {2}" -f ($unchanged + $toCopy.Count), $unchanged, $toCopy.Count)

if ($toCopy.Count -eq 0) {
    Write-Output 'Nothing to copy - code already in sync'
    exit 0
}

Write-Output ''
Write-Output ("=== Files to copy ({0}) ===" -f $toCopy.Count)
$toCopy | Sort-Object Rel | ForEach-Object { Write-Output ("  {0,10:N0} B  {1}" -f $_.Size, $_.Rel) }

Write-Output ''
Write-Output '=== Copying ==='
$copied = 0
$failed = @()
foreach ($item in ($toCopy | Sort-Object Rel)) {
    $src = Join-Path $localRoot $item.Rel
    $dst = Join-Path $remoteRoot $item.Rel
    try {
        $dstDir = Split-Path $dst -Parent
        if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
        Copy-Item $src $dst -Force
        $copied++
    } catch {
        $failed += $item.Rel
    }
}

Write-Output ''
Write-Output '=== Summary ==='
Write-Output ("Copied OK: {0} files" -f $copied)
if ($failed.Count -gt 0) {
    Write-Output 'Failed:'
    $failed | ForEach-Object { Write-Output "  $_" }
    exit 1
}

Write-Output ''
Write-Output '=== Verifying hashes after copy ==='
$mismatch = 0
foreach ($item in $toCopy) {
    $src = Join-Path $localRoot $item.Rel
    $dst = Join-Path $remoteRoot $item.Rel
    $h1 = (Get-FileHash $src -Algorithm SHA256).Hash
    $h2 = (Get-FileHash $dst -Algorithm SHA256).Hash
    if ($h1 -ne $h2) { $mismatch++; Write-Output "  MISMATCH: $($item.Rel)" }
}
if ($mismatch -eq 0) {
    Write-Output 'OK: all files in sync. Ready to run deploy.bat on prod machine.'
} else {
    Write-Output "WARNING: $mismatch file(s) still differ - check again"
    exit 1
}
