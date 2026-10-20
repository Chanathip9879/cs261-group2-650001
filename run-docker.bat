@echo off
title HiwKhaw TU Canteen - Run with Docker (CS261 Sprint 1)
echo ========================================================
echo Starting HiwKhaw TU Canteen WebApp via Docker Container
echo ========================================================
echo.

cd /d "%~dp0"

echo [INFO] Checking Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 goto :NO_DOCKER

echo [INFO] Building and starting container (No Node.js required)...
docker compose up -d --build

echo.
echo [INFO] Opening WebApp in your browser...
start http://localhost:5000

echo.
echo ========================================================
echo WebApp is running inside Docker at http://localhost:5000
echo To stop container later, run: docker compose down
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
