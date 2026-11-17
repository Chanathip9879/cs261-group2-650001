@echo off
setlocal
title HiwKhaw TU Canteen - Run with Docker (CS261 Sprint 1)
echo ========================================================
echo Starting HiwKhaw TU Canteen WebApp via Docker
echo   - Container 1: SQL Server 2022 (MSSQL)
echo   - Container 2: Node.js + React Web App
echo ========================================================
echo.

cd /d "%~dp0"

echo [INFO] Checking Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 goto :NO_DOCKER

echo [INFO] Stopping old containers (data volume is kept)...
docker compose down >nul 2>&1

echo.
echo [INFO] Building and starting 2 containers (No Node.js required)...
if not exist ".env" echo [INFO] No .env found - using built-in demo password defaults
docker compose up -d --build
if %errorlevel% neq 0 goto :START_FAILED

echo.
echo [INFO] Waiting for the web app to become ready (up to 3 minutes)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddMinutes(3); while ((Get-Date) -lt $deadline) { try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 'http://localhost:5000/api/health'; if ($r.StatusCode -eq 200) { Write-Host '[OK] Web app is ready!'; exit 0 } } catch {} ; Start-Sleep -Seconds 3 }; Write-Host '[WARN] Web app is not ready yet.'; exit 1"
if %errorlevel% neq 0 goto :NOT_READY

echo.
echo [INFO] Container status:
docker compose ps

echo.
echo [INFO] Opening WebApp in your browser...
start http://localhost:5000

echo.
echo ========================================================
echo WebApp is running inside Docker at http://localhost:5000
echo Database: SQL Server 2022 (separate container)
echo To stop the containers later, run: docker compose down
echo To wipe the database volume too:  docker compose down -v
echo ========================================================
echo.
pause
exit /b 0

:NO_DOCKER
echo.
echo ========================================================
echo [ERROR] Docker Desktop is not running!
echo ========================================================
echo Please open Docker Desktop on your computer, wait for it
echo to be ready, and then run this file again.
echo ========================================================
echo.
pause
exit /b 1

:START_FAILED
echo.
echo ========================================================
echo [ERROR] docker compose up failed!
echo ========================================================
echo Check the messages above, then try:
echo   docker compose logs
echo ========================================================
echo.
pause
exit /b 1

:NOT_READY
echo.
echo ========================================================
echo [WARN] Containers started but the web app is not ready.
echo ========================================================
echo Check container status and logs with:
echo   docker compose ps
echo   docker compose logs hiwkhaw-app
echo   docker compose logs mssql
echo ========================================================
echo.
pause
exit /b 1
