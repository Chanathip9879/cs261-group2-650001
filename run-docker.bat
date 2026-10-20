@echo off
title TU Canteen WebApp - Run with Docker
echo ========================================================
echo Starting TU Canteen Web Application via Docker Container
echo ========================================================
echo.

cd /d "%~dp0\Runnable_WebApp_TU_Canteen"

echo [INFO] Checking Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not running!
    echo Please open Docker Desktop and try again.
    pause
    exit /b 1
)

echo [INFO] Building and starting container (No Node.js installation required)...
docker compose up -d --build

echo.
echo [INFO] Opening WebApp in your browser...
start http://localhost:3000

echo.
echo ========================================================
echo WebApp is running inside Docker at http://localhost:3000
echo To stop container later, run: docker compose down
echo ========================================================
pause
