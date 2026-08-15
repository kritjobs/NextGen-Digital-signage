@echo off
setlocal
REM ============================================================
REM  Install Caddy HTTPS on 10.70.0.1 (run as ADMINISTRATOR)
REM  1) Download caddy.exe (if missing)
REM  2) Copy Caddyfile -> %ProgramData%\Caddy
REM  3) Validate config
REM  4) Install + start Windows service "Caddy"
REM  5) Export root CA (caddy-root-ca.crt) for screens/devices
REM ============================================================
cd /d C:\signage\caddy

echo === Step 1/5: Download Caddy (if missing) ===
if not exist caddy.exe (
  echo Downloading Caddy for Windows...
  curl -L -o caddy.zip "https://caddyserver.com/api/download?os=windows&arch=amd64"
  if errorlevel 1 ( echo FAIL: download failed & pause & exit /b 1 )
  powershell -NoProfile -Command "Expand-Archive -Force caddy.zip -DestinationPath ."
  if errorlevel 1 ( echo FAIL: extract failed & pause & exit /b 1 )
  del caddy.zip
) else (
  echo OK: caddy.exe already present
)

echo.
echo === Step 2/5: Write Caddyfile ===
if not exist "%ProgramData%\Caddy" mkdir "%ProgramData%\Caddy"
copy /y Caddyfile "%ProgramData%\Caddy\Caddyfile" >nul
echo OK: Caddyfile -^> %ProgramData%\Caddy\Caddyfile

echo.
echo === Step 3/5: Validate config ===
caddy.exe validate --config "%ProgramData%\Caddy\Caddyfile"
if errorlevel 1 ( echo FAIL: config invalid - fix caddy\Caddyfile & pause & exit /b 1 )

echo.
echo === Step 4/5: Install + start service ===
caddy.exe install
if errorlevel 1 ( echo WARN: service may already exist - continuing & goto startsvc )
:startsvc
net start Caddy 2>nul
if errorlevel 1 (
  sc query Caddy | findstr /i RUNNING >nul
  if errorlevel 1 ( echo FAIL: service not running - check: sc query Caddy & pause & exit /b 1 )
)
echo OK: Caddy service running

echo.
echo === Step 5/5: Export root CA for devices ===
if not exist "caddy-root-ca.crt" (
  copy /y "%ProgramData%\Caddy\pki\authorities\local\root.crt" "caddy-root-ca.crt" >nul 2>&1
)
if exist "caddy-root-ca.crt" (
  echo OK: CA saved at C:\signage\caddy\caddy-root-ca.crt
) else (
  echo NOTE: CA file not found yet - Caddy generates it on first run.
  echo      Re-run this script after the service has been up a few seconds.
)

echo.
echo ========================================
echo  DONE.
echo  Test:  https://10.70.0.1
echo  Then:  install CA on screens (see caddy\TRUST-CA.md)
echo  And:   update .env APP_URL=https://10.70.0.1 + redeploy
echo         (so pairing/display URLs use https)
echo ========================================
pause
