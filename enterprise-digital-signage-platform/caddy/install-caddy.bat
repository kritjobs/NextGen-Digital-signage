@echo off
setlocal
REM ============================================================
REM  Install Caddy HTTPS on 10.70.0.1 (run as ADMINISTRATOR)
REM  NOTE: `caddy install` ถูกลบจาก Caddy เวอร์ชันใหม่ -> ใช้
REM  sc create ติดตั้ง Windows service แทน (fallback: caddy start)
REM  ใช้ Caddyfile local (C:\signage\caddy\Caddyfile) ไม่พึ่ง ProgramData
REM ============================================================
cd /d C:\signage\caddy

REM ─── Must be Administrator (ติดตั้ง service ต้อง admin) ───
net session >nul 2>&1
if errorlevel 1 (
  echo.
  echo  ERROR: Must run as ADMINISTRATOR!
  echo  ============================================
  echo  Start menu -^> type "cmd" -^> right-click
  echo  "Command Prompt" -^> "Run as administrator"
  echo  Then run:
  echo      cd C:\signage\caddy ^&^& install-caddy.bat
  echo  ============================================
  echo.
  pause
  exit /b 1
)

set CADDYFILE=C:\signage\caddy\Caddyfile

echo === Step 1/6: Download Caddy (if missing/invalid) ===
if exist caddy.exe (
  powershell -NoProfile -Command "$b=[IO.File]::ReadAllBytes((Join-Path $PWD 'caddy.exe'))[0..1]; if($b[0]-eq 0x4D -and $b[1]-eq 0x5A){exit 0}else{exit 1}"
  if not errorlevel 1 (
    echo OK: caddy.exe already present
    goto validate
  )
  echo Existing caddy.exe invalid - re-downloading...
)
echo Downloading Caddy for Windows (curl)...
curl -L --fail --connect-timeout 20 -o caddy.exe "https://caddyserver.com/api/download?os=windows&arch=amd64"
if errorlevel 1 (
  echo curl failed - trying PowerShell...
  powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol='Tls12'; Invoke-WebRequest -Uri 'https://caddyserver.com/api/download?os=windows&arch=amd64' -OutFile 'caddy.exe'"
  if errorlevel 1 (
    echo FAIL: cannot download Caddy - check internet. Manual: get caddy.exe
    echo from https://caddyserver.com/download into C:\signage\caddy\
    pause
    exit /b 1
  )
)
powershell -NoProfile -Command "$b=[IO.File]::ReadAllBytes((Join-Path $PWD 'caddy.exe'))[0..1]; if($b[0]-eq 0x4D -and $b[1]-eq 0x5A){exit 0}else{exit 1}"
if errorlevel 1 (
  echo FAIL: downloaded file is not a valid exe
  pause
  exit /b 1
)
for %%f in (caddy.exe) do if %%~zf LSS 1000000 (
  echo FAIL: caddy.exe too small ^(%%~zf bytes^) - download incomplete
  pause
  exit /b 1
)
echo OK: caddy.exe downloaded and valid

:validate
echo.
echo === Step 2/6: Validate Caddyfile ===
caddy.exe validate --config "%CADDYFILE%"
if errorlevel 1 (
  echo FAIL: config invalid - fix caddy\Caddyfile
  pause
  exit /b 1
)
echo OK: config valid

echo.
echo === Step 3/6: Create service (sc create) ===
sc query Caddy >nul 2>&1
if errorlevel 1 (
  sc create Caddy binPath= "\"C:\signage\caddy\caddy.exe\" run --config \"C:\signage\caddy\Caddyfile\"" start= auto DisplayName= "Caddy Web Server"
  if errorlevel 1 (
    echo WARN: sc create failed - falling back to background process
    goto runbg
  )
  echo OK: service Caddy created
) else (
  echo OK: service Caddy already exists
)

echo.
echo === Step 4/6: Start service ===
net start Caddy 2>nul
sc query Caddy | findstr /i RUNNING >nul
if errorlevel 1 (
  echo service not running - trying background process
  goto runbg
)
echo OK: Caddy service running
goto exportca

:runbg
echo Starting Caddy as background process (caddy start)...
caddy.exe start --config "%CADDYFILE%"
if errorlevel 1 (
  echo FAIL: cannot start Caddy - run manually to see the error:
  echo      cd C:\signage\caddy ^&^& caddy.exe run --config C:\signage\caddy\Caddyfile
  pause
  exit /b 1
)
echo OK: Caddy running in background ^(note: จะไม่ auto-start เมื่อ reboot - ถ้าอยากได้ service ให้แก้ sc create^)

:exportca
echo.
echo === Step 5/6: Export root CA for devices ===
if not exist "caddy-root-ca.crt" (
  copy /y "%ProgramData%\Caddy\pki\authorities\local\root.crt" "caddy-root-ca.crt" >nul 2>&1
)
if not exist "caddy-root-ca.crt" (
  copy /y "%APPDATA%\Caddy\pki\authorities\local\root.crt" "caddy-root-ca.crt" >nul 2>&1
)
if exist "caddy-root-ca.crt" (
  echo OK: CA saved at C:\signage\caddy\caddy-root-ca.crt
) else (
  echo NOTE: CA not found yet - Caddy creates it on first run. Wait and re-run.
)

echo.
echo === Step 6/6: Self-check HTTPS ===
timeout /t 5 /nobreak >nul
curl -s -o nul -m 10 https://10.70.0.1/api/health
if errorlevel 1 (
  echo WARN: https not answering yet - check: sc query Caddy ^|^| caddy.exe run --config ...
) else (
  echo OK: https://10.70.0.1 is answering
)

echo.
echo ========================================
echo  DONE. Next: install CA on screens
echo  (TRUST-CA.md) + .env APP_URL=https
echo ========================================
pause
