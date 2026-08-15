@echo off
REM ============================================================
REM  Signage rollback tool  (run on 10.70.0.1 in C:\signage)
REM
REM  Usage:
REM    rollback.bat snapshot  -> BEFORE deploying: tag the current
REM                              running image + dump the database
REM    rollback.bat restore   -> AFTER a bad deploy: bring back the
REM                              last snapshot (code only, data kept)
REM
REM  NEVER run "docker compose down -v" - it deletes the database
REM  and uploads volumes permanently.
REM ============================================================
setlocal

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set STAMP=%%I

if /i "%~1"=="snapshot" goto snapshot
if /i "%~1"=="restore" goto restore
echo Usage: rollback.bat snapshot ^| rollback.bat restore
exit /b 1

:snapshot
echo [1/3] Tagging current image as signage-app:rollback-%STAMP%
docker tag signage-app:latest signage-app:rollback-%STAMP%
if errorlevel 1 echo WARNING: could not tag image - is signage-app:latest present?
echo signage-app:rollback-%STAMP%> rollback-last.txt

echo [2/3] Dumping database to backups\pre-deploy-%STAMP%.sql
if not exist backups mkdir backups
docker exec signage-postgres pg_dump -U signage_admin -d signage_db -f /backups/pre-deploy-%STAMP%.sql
if errorlevel 1 echo WARNING: pg_dump failed - check container name or set PGPASSWORD

echo [3/3] Snapshot complete.
echo   Image tag : signage-app:rollback-%STAMP%
echo   DB backup : backups\pre-deploy-%STAMP%.sql
echo   To restore later: rollback.bat restore
exit /b 0

:restore
echo [1/3] Finding last snapshot
if not exist rollback-last.txt (
  echo ERROR: rollback-last.txt not found - run "rollback.bat snapshot" before deploying.
  exit /b 1
)
set /p LAST=<rollback-last.txt
echo   Restoring: %LAST%
if exist backups (
  echo   DB backups available in: backups\  (see pre-deploy-*.sql files)
)

echo [2/3] Stopping current stack (data volumes are kept)
docker compose down
if errorlevel 1 echo WARNING: docker compose down reported an error - continuing anyway

echo [3/3] Restoring snapshot image and starting
docker tag %LAST% signage-app:latest
docker compose up -d

echo Done. Verify:  curl http://localhost:3100/api/health
exit /b 0
