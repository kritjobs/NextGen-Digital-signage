@echo off
setlocal
REM ============================================================
REM  change-admin-password.bat — เปลี่ยนรหัส admin บน DB (bcrypt)
REM
REM  วิธีใช้ (ที่เครื่อง prod C:\signage หรือเครื่อง dev):
REM    change-admin-password.bat  <email>  <new-password>
REM
REM  ตัวอย่าง:
REM    change-admin-password.bat  admin@signage.local  "MyNew!Pass123"
REM
REM  ข้อกำหนดรหัสใหม่: >=8 ตัว + พิมพ์ใหญ่ + พิมพ์เล็ก + ตัวเลข
REM  กันใช้รหัส default (Admin@2026! ฯลฯ) — ปฏิเสธทันที
REM ============================================================

if "%~1"=="" (
  echo Usage: change-admin-password.bat ^<email^> ^<new-password^>
  echo Example: change-admin-password.bat admin@signage.local "MyNew!Pass123"
  pause
  exit /b 1
)
if "%~2"=="" (
  echo ERROR: missing new password.
  pause
  exit /b 1
)

cd /d "%~dp0"
node scripts/change-password.mjs "%~1" "%~2"
if errorlevel 1 (
  echo.
  echo FAIL: เปลี่ยนรหัสไม่สำเร็จ — ดูข้อผิดพลาดด้านบน
  pause
  exit /b 1
)
echo.
echo ✅ เปลี่ยนรหัสเรียบร้อย — ทดสอบ login ด้วยรหัสใหม่ได้เลย
pause
