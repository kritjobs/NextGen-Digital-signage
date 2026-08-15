@echo off
setlocal
REM ============================================================
REM  watch-screen-online.bat - เฝ้าดูจอที่ offline แล้วแจ้งเมื่อกลับมา online
REM  ใช้ได้ทั้งเครื่อง dev (ชี้ไป prod ผ่าน WATCH_API_BASE) และเครื่อง prod
REM ============================================================
cd /d "%~dp0"

REM --- ตั้งค่า (แก้ได้ตามต้องการ) ---------------------------------
REM ชี้ไป prod ถ้ารันที่เครื่อง dev:
REM   set WATCH_API_BASE=http://10.70.0.1:3100
if "%WATCH_API_BASE%"=="" set WATCH_API_BASE=http://localhost:3100
if "%WATCH_SCREEN_ID%"=="" set WATCH_SCREEN_ID=scr-002
if "%WATCH_INTERVAL_SEC%"=="" set WATCH_INTERVAL_SEC=60
REM ส่ง webhook เมื่อจอกลับมา online (เช่น Slack) — ปล่อยว่าง = แค่ log
REM   set WATCH_WEBHOOK_URL=https://hooks.slack.com/services/xxx

echo ============================================
echo  Watch screen: %WATCH_SCREEN_ID%
echo  Server      : %WATCH_API_BASE%
echo  Interval    : %WATCH_INTERVAL_SEC% sec
echo  --once เพื่อตรวจครั้งเดียวแล้วจบ (กด Ctrl+C เพื่อหยุด)
echo ============================================
node scripts/watch-screen-online.mjs %*
pause
