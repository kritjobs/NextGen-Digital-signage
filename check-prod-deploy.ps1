# Check prod deploy state via SMB (10.70.0.1\c\signage)
$ErrorActionPreference = 'Continue'
$remote = '\\10.70.0.1\c\signage'

if (-not (Test-Path $remote)) {
    Write-Host "FAIL: cannot reach $remote (prod machine off / SMB blocked / not synced?)"
    exit 1
}
Write-Host "OK: $remote reachable"
Write-Host ""

# 1) build-log.txt
$buildLog = Join-Path $remote 'build-log.txt'
if (Test-Path $buildLog) {
    $f = Get-Item $buildLog
    Write-Host ("=== build-log.txt (LastWrite: {0}, {1} bytes) ===" -f $f.LastWriteTime, $f.Length)
    Get-Content $buildLog -Tail 12
    Write-Host ""
    $errs = Select-String -Path $buildLog -Pattern 'error|failed|FAIL' -CaseSensitive:$false
    if ($errs) {
        Write-Host "--- ERROR lines found in build-log ---"
        $errs | ForEach-Object { Write-Host ("  " + $_.Line.Trim()) }
    } else {
        Write-Host "OK: no error/failed lines in build-log"
    }
    Write-Host ""
} else {
    Write-Host "NOTE: build-log.txt NOT found - no build ran yet (redeploy.bat not executed?)"
    Write-Host ""
}

# 2) backups/ folder
$bk = Join-Path $remote 'backups'
if (Test-Path $bk) {
    $files = @(Get-ChildItem $bk -File -ErrorAction SilentlyContinue)
    if ($files.Count -gt 0) {
        Write-Host ("=== backups/ folder ({0} files) ===" -f $files.Count)
        $files | Sort-Object LastWriteTime -Descending | Select-Object -First 10 Name, LastWriteTime, Length | Format-Table -AutoSize
        Write-Host "OK: backup files exist = new code (REQ-007) ran on prod"
    } else {
        Write-Host "NOTE: backups/ folder exists but empty - no backup yet (normal if not 03:00 or no manual run)"
    }
    Write-Host ""
} else {
    Write-Host "NOTE: backups/ folder not found on host"
    Write-Host ""
}

# 3) recent files (24h)
Write-Host "=== recent files under C:\signage (24h) ==="
$recent = Get-ChildItem $remote -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) } | Sort-Object LastWriteTime -Descending | Select-Object -First 10 LastWriteTime, Name
$recent | Format-Table -AutoSize

Write-Host "Done. (container logs: run 'docker compose logs signage-app' on the prod machine)"
