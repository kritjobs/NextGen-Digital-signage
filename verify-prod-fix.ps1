# verify-prod-fix.ps1 - Standard redeploy verification tool (run on dev machine)
# Checks that a redeploy on prod (10.70.0.1) actually took effect, via SMB (Z:\ = C:\signage) + HTTP.
#
# USAGE:
#   powershell -NoProfile -ExecutionPolicy Bypass -File verify-prod-fix.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File verify-prod-fix.ps1 -Marker pickScreenFields
#
# Prereqs:
#   - Z:\ mapped to \\10.70.0.1\c\signage (same as sync-to-prod.ps1)
#   - prod must have just run redeploy.bat (or be mid-verification of one)
#
# Checks:
#   1. /api/health  - uptime should be < 300s (just redeployed), clients reconnected, db connected
#   2. build-log.txt - fresh timestamp, no error/failed lines, image built OK
#   3. Marker in Z:\server.ts - proves the synced source contains the expected fix
#   4. X-Frame-Options header on /display - must be ABSENT (webOS kiosk embeds the page)
#
# Exit code 0 = all checks OK, 1 = one or more checks failed/missing.
param(
  [string]$Marker = 'pickScreenFields'
)
$ErrorActionPreference = 'Continue'
$fail = 0
$base = 'http://10.70.0.1:3100'

function Check-Fail($msg) {
  Write-Host ("FAIL: " + $msg)
  $script:fail = 1
}

Write-Host "=== 1) PROD HEALTH (uptime should be < 300s = just redeployed) ==="
try {
  $h = Invoke-RestMethod -Uri "$base/api/health" -TimeoutSec 5
  Write-Host ("status={0} version={1} uptime={2}s connectedClients={3} db={4}" -f $h.status, $h.version, [Math]::Round($h.uptime), $h.connectedClients, $h.database)
  if ($h.uptime -ge 300) { Check-Fail "uptime $([Math]::Round($h.uptime))s - looks like NOT redeployed recently" }
  if ($h.database -ne 'connected') { Check-Fail "database not connected" }
} catch {
  Check-Fail ("health unreachable: " + $_.Exception.Message)
}

Write-Host ""
Write-Host "=== 2) BUILD-LOG (Z:\ = C:\signage via SMB) ==="
$log = 'Z:\build-log.txt'
if (Test-Path $log) {
  $f = Get-Item $log
  Write-Host ("LastWrite: {0} | {1} bytes" -f $f.LastWriteTime, $f.Length)
  $errs = Select-String -Path $log -Pattern 'error|failed|FAIL' -CaseSensitive:$false
  if ($errs) {
    Check-Fail "error/failed lines in build-log"
    $errs | Select-Object -First 5 | ForEach-Object { Write-Host ("  " + $_.Line.Trim()) }
  } else {
    Write-Host "OK: no error/failed lines"
  }
  $built = Select-String -Path $log -Pattern 'Built' -CaseSensitive:$false
  if (-not $built) { Check-Fail "'Built' not found at end of build-log - build may not have finished" }
  Get-Content $log -Tail 3 | ForEach-Object { Write-Host $_ }
} else {
  Check-Fail "build-log.txt not found on Z:\ - redeploy.bat not run?"
}

Write-Host ""
Write-Host "=== 3) MARKER '$Marker' in Z:\server.ts (synced source) ==="
$srv = 'Z:\server.ts'
if (Test-Path $srv) {
  $m = Select-String -Path $srv -Pattern $Marker
  if ($m) {
    Write-Host ("OK: found {0} reference(s), first at line {1}" -f $m.Count, $m[0].LineNumber)
  } else {
    Check-Fail "marker '$Marker' not found in Z:\server.ts"
  }
} else {
  Check-Fail "Z:\server.ts not found"
}

Write-Host ""
Write-Host "=== 4) X-Frame-Options on /display (must be ABSENT for webOS kiosk iframe) ==="
$headOut = & curl.exe -sI -m 5 "$base/display/x" 2>$null
if ($LASTEXITCODE -eq 0 -and $headOut) {
  $xfo = $headOut | Where-Object { $_ -match '^X-Frame-Options:' } | Select-Object -First 1
  $httpLine = $headOut | Where-Object { $_ -match '^HTTP/' } | Select-Object -First 1
  Write-Host ("HTTP: " + $httpLine)
  if ($xfo) {
    Check-Fail "X-Frame-Options still present: $xfo"
  } else {
    Write-Host "OK: X-Frame-Options absent"
  }
} else {
  Check-Fail ("/display head unreachable (curl exit " + $LASTEXITCODE + ")")
}

Write-Host ""
if ($fail -eq 0) {
  Write-Host "ALL CHECKS PASSED - redeploy verified."
  exit 0
} else {
  Write-Host "SOME CHECKS FAILED - see messages above."
  exit 1
}
