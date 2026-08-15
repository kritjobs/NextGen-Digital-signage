@echo off
setlocal
REM ============================================================
REM  Install Caddy HTTPS on 10.70.0.1 (run as ADMINISTRATOR)
REM  1) Download caddy.exe (curl -> fallback PowerShell)
REM  2) Copy Caddyfile -> %ProgramData%\Caddy
REM  3) Validate config
REM  4) Install + start Windows service "Caddy"
REM  5) Export root CA (caddy-root-ca.crt) for screens/devices
REM  6) Self-check: https://10.70.0.1 responds?
REM ============================================================
cd /d C:\signage\caddy

echo === Step 1/6: Download Caddy (if missing) ===
if exist caddy.exe (
  echo OK: caddy.exe already present
  goto cfg
)
echo Downloading Caddy for Windows (curl)...
curl -L --fail --connect-timeout 20 -o caddy.zip "https://caddyserver.com/api/download?os=windows&arch=amd64"
if errorlevel 1 (
  echo curl failed - trying PowerShell Invoke-WebRequest...
  powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol='Tls12'; Invoke-WebRequest -Uri 'https://caddyserver.com/api/download?os=windows&arch=amd64' -OutFile 'caddy.zip'"
  if errorlevel 1 (
    echo FAIL: cannot download Caddy. Check internet access on this machine.
    echo Manual option: download caddy.zip from https://caddyserver.com/download
    echo and extract caddy.exe into C:\signage\caddy\ then re-run this script.
    pause
    exit /b 1
  )
)
powershell -NoProfile -Command "Expand-Archive -Force caddy.zip -DestinationPath ."
if errorlevel 1 ( echo FAIL: extract failed & pause & exit /b 1 )
del caddy.zip
if not exist caddy.exe ( echo FAIL: caddy.exe not found after extract & pause & exit /b 1 )

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
  echo       Check: sc query Caddy  /  caddy.exe list-modules  /  netstat -ano | findstr :443
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
