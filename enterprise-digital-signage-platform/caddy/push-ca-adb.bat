@echo off
REM ═══════════════════════════════════════════════════════════
REM  push-ca-adb.bat — ติดตั้ง Caddy CA บน Android TV ผ่าน ADB (WiFi)
REM
REM  ใช้กับ: จอ Android TV ที่เปิด browser ทั่วไป (ไม่ใช่ native player)
REM          — native player ไม่ต้องทำ (CA ฝังใน APK แล้ว)
REM
REM  ก่อนรัน (ที่ TV):
REM    Settings → Device Preferences → About → กด "Build" 7 ครั้ง
REM    → กลับไป → Developer Options → เปิด "USB debugging" /
REM      "Network debugging" (WiFi ADB)
REM ═══════════════════════════════════════════════════════════
setlocal
cd /d C:\signage\caddy

REM ─── หา adb ───
where adb >nul 2>&1
if errorlevel 1 (
  if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
  ) else (
    echo FAIL: หา adb.exe ไมเจอ
    echo    ติดตั้ง Android platform-tools แลวเพม PATH หรือตั้งท
    echo    https://developer.android.com/tools/releases/platform-tools
    pause
    exit /b 1
  )
) else set "ADB=adb"

set CAFILE=C:\signage\caddy\caddy-root-ca.crt
if not exist "%CAFILE%" (
  echo FAIL: ไมพบ %CAFILE% - copy ไฟล CA จาก server กอน
  pause
  exit /b 1
)

echo === Step 1/4: เชอมตอ TV ผาน ADB WiFi ===
set /p TV_IP=กรอก IP ของ Android TV (เชน 192.168.1.50): 
"%ADB%" connect %TV_IP%:5555
"%ADB%" wait-for-device
"%ADB%" get-state >nul 2>&1
if errorlevel 1 (
  echo FAIL: เชอมตอไมได - ตรวจวาเปด WiFi ADB แลว + อยู network เดยวกน
  pause
  exit /b 1
)
echo OK: เชอมตอ %TV_IP% แลว

echo.
echo === Step 2/4: copy CA ไปท TV ===
"%ADB%" push "%CAFILE%" /sdcard/caddy-root-ca.crt
if errorlevel 1 (
  echo FAIL: push ไมได
  pause
  exit /b 1
)
echo OK: สงไฟล CA แลว

echo.
echo === Step 3/4: เปดหนาตดตง CA บน TV ===
"%ADB%" shell am start -a android.credentials.INSTALL -d file:///sdcard/caddy-root-ca.crt
echo.
echo  >>> ไปทหนาจอ TV: ควรขึ้นหนาตดตง certificate
echo  >>> กด OK/Install + ใส PIN/pattern หนาจอ (ครงเดยว)
echo  >>> แลวคอถด Enter ทนตรงน...
pause

echo.
echo === Step 4/4: ตรวจวา CA เขาแลว ===
"%ADB%" shell "ls /data/misc/user/0/cacerts-added/ 2>/dev/null || ls /data/misc/keychain/cacerts-added/ 2>/dev/null"
echo.
echo  ถาเหนชอไฟลปรากฏ (เชน xxx.0) = CA ตดตงสำเรจ
echo  ตรวจดวย curl จาก TV: https://10.70.0.1/api/health ไมควรม warning
echo ================================================
pause
