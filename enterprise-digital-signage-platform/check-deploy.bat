@echo off
REM ============================================================
REM  Deploy diagnostic - run on 10.70.0.1 in C:\signage
REM  Purpose: find out why the running server still shows OLD code
REM ============================================================
cd /d C:\signage

echo === 0) Docker Compose version + config validation ===
docker compose version
docker compose config -q
if errorlevel 1 (
  echo FAIL: docker compose cannot read the compose file - check error above
  pause
  exit /b 1
) else (
  echo OK: compose file is valid
)

echo.
echo === 1) Image creation dates (latest should be TODAY after build) ===
docker images signage-app

echo.
echo === 2) Container status ===
docker compose ps

echo.
echo === 3) Secrets inside the running container ===
docker exec signage-app node -e "console.log('JWT_SECRET      :', process.env.JWT_SECRET ? 'SET (len ' + process.env.JWT_SECRET.length + ')' : 'MISSING'); console.log('WEBHOOK_TOKEN   :', process.env.WEBHOOK_TOKEN ? 'SET (len ' + process.env.WEBHOOK_TOKEN.length + ')' : 'MISSING'); console.log('NODE_ENV        :', process.env.NODE_ENV)"

echo.
echo === 4) SSRF guard test (NEW code = "URL blocked", OLD code = "Proxy fetch failed") ===
curl -s "http://localhost:3100/api/media-proxy?url=http://169.254.169.254/x"

echo.
echo === 5) Trigger without token (NEW code = 401, OLD code = 200) ===
curl -s -o nul -w "HTTP %%{http_code}%%" -X POST http://localhost:3100/api/trigger -H "Content-Type: application/json" -d "{\"action\":\"refresh\",\"target\":{\"all\":true}}"
echo.

echo.
echo === 6) Disk space (full disk = build fails silently) ===
docker system df

echo.
echo Done. If step 4/5 show OLD-code behavior, the deploy did not rebuild.
pause
