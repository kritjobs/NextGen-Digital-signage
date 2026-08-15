@echo off
setlocal
REM ============================================================
REM  Fix Prod Media URLs - run on 10.70.0.1 in C:\signage
REM  AFTER redeploy (so /media/sample/* is in the container).
REM  Points seed media med-001..008 to local sample files
REM  instead of dead external URLs (Google bucket -> 403).
REM  Idempotent - safe to run multiple times.
REM ============================================================
cd /d C:\signage

echo ========================================
echo  STEP 1/2: Verify sample media is served
echo ========================================
curl -s -m 5 -o nul http://localhost:3100/media/sample/welcome-demo.mp4
if errorlevel 1 (
  echo WARNING: /media/sample/welcome-demo.mp4 not served.
  echo Did you redeploy yet? Run redeploy.bat first, then this script.
  echo Continuing anyway - the SQL below is still safe to run.
) else (
  echo OK: sample media is served by the app
)

echo.
echo ========================================
echo  STEP 2/2: Update media URLs (med-001..008)
echo ========================================
type fix-prod-media.sql | docker compose exec -T signage-postgres psql -U signage_admin -d signage_db -v ON_ERROR_STOP=1
if errorlevel 1 (
  echo.
  echo FAIL: psql failed. Check:  docker compose ps   (postgres must be Up)
  pause
  exit /b 1
)

echo.
echo ========================================
echo  DONE.
echo  Verify: open a screen/player that uses
echo  med-001 (e.g. Main Lobby) - the video
echo  should play from /media/sample now.
echo ========================================
pause
