@echo off
REM ═══════════════════════════════════════════════════════════
REM  install-ca-client.bat — ติดตั้ง Caddy Root CA บนเครื่องลูกค้า
REM
REM  ใช้กับ: PC / จอ Windows ที่จะเปิด https://10.70.0.1
REM  ต้อง:  เข้าถึง \\10.70.0.1\c\signage ได้ + รันแบบ ADMINISTRATOR
REM
REM  ทำ: ดาวน์โหลด CA (ตัวที่ถูก) จาก server -> ลบ CA เก่า -> ใส่
REM       Trusted Root -> ตรวจ https + sw.js
REM ═══════════════════════════════════════════════════════════
setlocal
set SERVER=10.70.0.1
set SHARE=\\%SERVER%\c\signage\caddy
set CAFILE=%TEMP%\caddy-root-ca.crt

echo === Step 1/4: ดาวน์โหลด CA จาก server ===
copy /y "%SHARE%\caddy-root-ca.crt" "%CAFILE%" >nul 2>&1
if not exist "%CAFILE%" (
  echo FAIL: เขา %SHARE% ไมได
  echo    ตรวจวาเครื่องนี้เขาถง server ได (ลองเปด \\%SERVER%\c\signage)
  echo    หรือ copy ไฟล caddy-root-ca.crt มาวางขางไฟลน แลวรนใหม
  pause
  exit /b 1
)
echo OK: ได CA แลว (%CAFILE%)

echo.
echo === Step 2/4: ตรวจสิทธิ์ admin ===
net session >nul 2>&1
if errorlevel 1 (
  echo ERROR: ตองรนในโหมด ADMINISTRATOR!
  echo   คลกขวาไฟลน -^> Run as administrator
  pause
  exit /b 1
)
echo OK: admin

echo.
echo === Step 3/4: ติดตั้ง CA เขา Trusted Root ===
REM ลบ CA เกาทชอ Caddy (กันตวเกาทผดคาง) แลวใสตวใหม
certutil -delstore Root "Caddy Local Authority" >nul 2>&1
certutil -addstore -f Root "%CAFILE%"
if errorlevel 1 (
  echo FAIL: ตดตง CA ไมสำเรจ
  pause
  exit /b 1
)
echo OK: CA ตดตงแลว

echo.
echo === Step 4/4: ตรวจ HTTPS ===
curl.exe --ssl-no-revoke -s -m 10 -o NUL -w "health : HTTP %%{http_code} (%%{content_type})" https://%SERVER%/api/health
echo.
curl.exe --ssl-no-revoke -s -m 10 -o NUL -w "sw.js  : HTTP %%{http_code} (%%{content_type})" https://%SERVER%/sw.js
echo.

echo.
echo ================================================
echo  เสรจ! เปด https://%SERVER% ในเบราวเซอร
echo  ควรไมม warning + Service Worker ทำงาน (offline cache)
echo  ตรวจเพิ่ม: เปดหนาจอแลวเพม ?simoffline=1 ตอทาย URL
echo  ควรเหนแถบทอง OFFLINE — เลนจากแคช
echo ================================================
pause
