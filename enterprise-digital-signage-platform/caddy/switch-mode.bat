@echo off
REM ═══════════════════════════════════════════════════════════
REM  switch-mode.bat — สลับโหมด HTTP/HTTPS (ไม่ต้องแก้โค้ด/redeploy)
REM
REM  อ่านจาก mode.conf (บรรทัดเดียว):  https  หรือ  http
REM    https -> เปิด Caddy service (URL จอ = https://10.70.0.1)
REM    http  -> หยุด Caddy service  (URL จอ = http://10.70.0.1:3100)
REM
REM  display URL สร้างจาก request อัตโนมัติ (server.ts) — หลังสลับ
REM  ไม่ต้องแก้ .env ไม่ต้อง redeploy — จอใหม่ที่ generate ได้ URL ถูกโหมด
REM ═══════════════════════════════════════════════════════════
setlocal
cd /d C:\signage\caddy

if not exist "%~dp0mode.conf" (
  echo ERROR: หา mode.conf ไมเจอ - ควรมีคาวา http หรือ https
  pause
  exit /b 1
)
set MODE=
for /f "usebackq delims=" %%m in ("%~dp0mode.conf") do set MODE=%%m

echo === switch-mode: mode.conf = "%MODE%" ===

if /i "%MODE%"=="https" goto https
if /i "%MODE%"=="http"  goto http

echo ERROR: mode.conf ตองเปน http หรือ https (ตอนนี้: "%MODE%")
pause
exit /b 1

:https
echo [1/2] เปด Caddy service...
sc query Caddy >nul 2>&1
if errorlevel 1 (
  echo Caddy ยังไมไดติดตั้ง - รัน install-caddy.bat กอน (ครั้งแรก)
  pause
  exit /b 1
)
sc query Caddy | findstr /i RUNNING >nul
if errorlevel 1 net start Caddy >nul 2>&1
sc query Caddy | findstr /i RUNNING >nul
if errorlevel 1 (
  echo FAIL: Caddy ไมรัน - ดู log: caddy-access.log หรือรัน caddy.exe run
  pause
  exit /b 1
)
echo OK: MODE=https พรอมใช — URL ที่ใหจอ:  https://10.70.0.1
goto done

:http
echo [1/2] หยด Caddy service...
sc query Caddy >nul 2>&1
if errorlevel 1 (
  echo OK: Caddy ไมไดติดตั้ง — ระบบเปน http อยูแลว
  goto done
)
sc query Caddy | findstr /i RUNNING >nul
if errorlevel 1 (
  echo OK: Caddy หยดอยูแลว
  goto done
)
net stop Caddy >nul 2>&1
echo OK: MODE=http พรอมใช — URL ที่ใหจอ:  http://10.70.0.1:3100
goto done

:done
echo.
echo  สลบโหมด: แกไขไฟล mode.conf (http / https) แลวรน switch-mode.bat ใหม
echo  หมายเหตุ: จอที่ผูกไวแลวยงใช URL เดิมได (ระบบรองรบทั้ง 2 พรอมกัน)
pause
