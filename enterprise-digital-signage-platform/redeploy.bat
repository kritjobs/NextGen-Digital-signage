@echo off
setlocal
REM ============================================================
REM  Signage REDEPLOY - run on 10.70.0.1 in C:\signage
REM  Does everything: snapshot -> stop -> rebuild -> start ->
REM  wait for health -> verify the NEW code is actually live.
REM  Build output is saved to build-log.txt (readable via SMB).
REM  Data (database + uploads) is NOT touched by this script.
REM ============================================================
cd /d C:\signage

echo ========================================
echo  STEP 1/6: Snapshot current image + DB
echo ========================================
call rollback.bat snapshot
if errorlevel 1 echo WARNING: snapshot had issues - continuing anyway

echo.
echo ========================================
echo  STEP 2/6: Stopping stack (data is kept)
echo ========================================
docker compose down
if errorlevel 1 (
  echo FAIL: docker compose down failed - aborting.
  pause
  exit /b 1
)

echo.
echo ========================================
echo  STEP 3/6: Building new image (no cache)
echo  This takes 2-5 minutes...
echo  Log: C:\signage\build-log.txt
echo ========================================
docker compose build --no-cache signage-app > build-log.txt 2>&1
if errorlevel 1 (
  echo FAIL: build failed. See build-log.txt - the dev can read it via SMB.
  pause
  exit /b 1
)
echo OK: build finished.

echo.
echo ========================================
echo  STEP 4/6: Starting stack (migrate runs)
echo ========================================
docker compose up -d
if errorlevel 1 (
  echo FAIL: docker compose up failed - see output above.
  pause
  exit /b 1
)

REM หนึ่ง-shot migrate container อาจไม่ rerun ถ้ามัน exited แล้ว
REM บังคับรัน migration ทุกครั้ง (กัน schema ตกค้างตอน deploy รอบใหม่)
REM --build บังคับ rebuild image ของ signage-migrate ด้วย (มัน build จาก Dockerfile.dev
REM แยกต่างหากจาก signage-app — ถ้าไม่ build ภาพเก่าจะไม่มี migration ใหม่)
echo.
echo  -- running migrate (ensuring schema is up to date) --
docker compose run --rm --build signage-migrate
if errorlevel 1 (
  echo WARN: migrate reported an error - check output above.
  pause
  exit /b 1
)
echo OK: migrations up to date.

echo.
echo ========================================
echo  STEP 5/6: Waiting for the app to answer
echo ========================================
set /a tries=0
:healthloop
set /a tries+=1
curl -s -m 3 -o nul http://localhost:3100/api/health
if %errorlevel%==0 goto healthy
if %tries% geq 24 goto healthfail
timeout /t 5 /nobreak >nul
goto healthloop

:healthy
echo App is answering on :3100
goto verify

:healthfail
echo WARNING: app did not answer within 2 minutes.
echo Check: docker compose ps  and  docker compose logs --tail=50 signage-app
goto verify

:verify
echo.
echo ========================================
echo  STEP 6/6: Verifying NEW code is live
echo ========================================
docker compose ps

echo.
echo --- Secrets inside the container (expect SET/SET) ---
docker exec signage-app node -e "console.log('JWT_SECRET      :', process.env.JWT_SECRET ? 'SET' : 'MISSING'); console.log('WEBHOOK_TOKEN   :', process.env.WEBHOOK_TOKEN ? 'SET' : 'MISSING')"

echo.
echo --- SSRF test (NEW code = URL blocked) ---
curl -s "http://localhost:3100/api/media-proxy?url=http://169.254.169.254/x"
echo.

echo --- Trigger no-token (NEW code = 401) ---
curl -s -o nul -w "HTTP %%{http_code}%%" -X POST http://localhost:3100/api/trigger -H "Content-Type: application/json" -d "{\"action\":\"refresh\",\"target\":{\"all\":true}}"
echo.

echo.
echo ========================================
echo  DONE. Tell the dev:
echo   1) the CREATED column above (must be
echo      seconds/minutes, not 31 hours)
echo   2) the test results in step 6
echo  build-log.txt is also readable by dev
echo ========================================
pause
