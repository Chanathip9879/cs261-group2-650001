@echo off
title TU Canteen WebApp - CS261 Sprint 1
echo ========================================================
echo Starting TU Canteen Web Application (Mobile-First)
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [INFO] Installing required dependencies...
    call npm install --no-audit --no-fund
)

echo.
echo [INFO] Opening WebApp in your browser...
start http://localhost:3000

echo.
echo [INFO] Starting Local Server at http://localhost:3000 ...
echo (Press Ctrl+C to stop the server)
echo.

node server.js
pause
