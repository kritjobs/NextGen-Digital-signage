@echo off
setlocal
REM ============================================================
REM  Install Caddy HTTPS on 10.70.0.1 (run as ADMINISTRATOR)
REM  NOTE: https://caddyserver.com/api/download?os=windows&arch=amd64
REM  returns caddy.exe DIRECTLY (not a zip) - we save it as caddy.exe
REM  and verify the MZ header. (Fixed 2026-08-15: old version tried
REM  to Expand-Archive and always failed.)
REM ============================================================
cd /d C:\signage\caddy

REM ─── Must be Administrator (เขียน ProgramData + ติดตั้ง service) ───
net session >nul 2>&1
if errorlevel 1 (
  echo.
  echo  ERROR: Must run as ADMINISTRATOR!
  echo  Right-click this file -^> Run as administrator
  echo  (หรือ: Start menu -^> type cmd -^> right-click -^> Run as administrator
  echo         then run:  cd C:\signage\caddy  ^&^&  install-caddy.bat)
  echo.
  pause
  exit /b 1
)

echo === Step 1/6: Download Caddy (if missing/invalid) ===
if exist caddy.exe (
  powershell -NoProfile -Command "$b=[IO.File]::ReadAllBytes((Join-Path $PWD 'caddy.exe'))[0..1]; if($b[0]-eq 0x4D -and $b[1]-eq 0x5A){exit 0}else{exit 1}"
  if not errorlevel 1 (
    echo OK: caddy.exe already present
    goto cfg
  )
  echo Existing caddy.exe is invalid - re-downloading...
)
echo Downloading Caddy for Windows (curl)...
curl -L --fail --connect-timeout 20 -o caddy.exe "https://caddyserver.com/api/download?os=windows&arch=amd64"
if errorlevel 1 (
  echo curl failed - trying PowerShell Invoke-WebRequest...
  powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol='Tls12'; Invoke-WebRequest -Uri 'https://caddyserver.com/api/download?os=windows&arch=amd64' -OutFile 'caddy.exe'"
  if errorlevel 1 (
    echo FAIL: cannot download Caddy. Check internet access on this machine.
    echo Manual option: download caddy.exe (Windows amd64) from
    echo   https://caddyserver.com/download
    echo into C:\signage\caddy\ then re-run this script.
    pause
    exit /b 1
  )
)
REM verify it is a real exe (MZ header)
powershell -NoProfile -Command "$b=[IO.File]::ReadAllBytes((Join-Path $PWD 'caddy.exe'))[0..1]; if($b[0]-eq 0x4D -and $b[1]-eq 0x5A){exit 0}else{exit 1}"
if errorlevel 1 (
  echo FAIL: downloaded file is not a valid exe - check the download
  pause
  exit /b 1
)
for %%f in (caddy.exe) do if %%~zf LSS 1000000 (
  echo FAIL: caddy.exe too small (%%~zf bytes) - download incomplete
  pause
  exit /b 1
)
echo OK: caddy.exe downloaded (valid, %%~zf bytes)

:cfg
echo.
echo === Step 2/6: Write Caddyfile ===
if not exist "%ProgramData%\Caddy" mkdir "%ProgramData%\Caddy"
copy /y Caddyfile "%ProgramData%\Caddy\Caddyfile" >nul
echo OK: Caddyfile -^> %ProgramData%\Caddy\Caddyfile

echo.
echo === Step 3/6: Validate config ===
caddy.exe validate --config "%ProgramData%\Caddy\Caddyfile"
if errorlevel 1 ( echo FAIL: config invalid - fix caddy\Caddyfile & pause & exit /b 1 )

echo.
echo === Step 4/6: Install + start service ===
caddy.exe install
if errorlevel 1 ( echo WARN: service may already exist - continuing )
net start Caddy 2>nul
sc query Caddy | findstr /i RUNNING >nul
if errorlevel 1 ( echo FAIL: Caddy service not running - check: sc query Caddy & pause & exit /b 1 )
echo OK: Caddy service running

echo.
echo === Step 5/6: Export root CA for devices ===
if not exist "caddy-root-ca.crt" (
  copy /y "%ProgramData%\Caddy\pki\authorities\local\root.crt" "caddy-root-ca.crt" >nul 2>&1
)
if exist "caddy-root-ca.crt" (
  echo OK: CA saved at C:\signage\caddy\caddy-root-ca.crt
) else (
  echo NOTE: CA file not found - Caddy creates it on first run.
  echo      Wait a few seconds and re-run this script.
)

echo.
echo === Step 6/6: Self-check HTTPS ===
timeout /t 5 /nobreak >nul
curl -s -o nul -m 10 https://10.70.0.1/api/health
if errorlevel 1 (
  echo WARN: https://10.70.0.1 not answering yet.
  echo       Check: sc query Caddy  /  netstat -ano ^| findstr :443
) else (
  echo OK: https://10.70.0.1 is answering
)

echo.
echo ========================================
echo  DONE.
echo  Next: install CA on screens (see TRUST-CA.md)
echo  And:  .env APP_URL=https://10.70.0.1 + redeploy
echo ========================================
pause
