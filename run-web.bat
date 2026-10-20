@echo off
title HiwKhaw TU Canteen WebApp - CS261 Sprint 1
echo ========================================================
echo   HiwKhaw (TU Canteen) - CS261 Group 2 Sprint 1
echo ========================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% equ 0 goto :RUN_NODE

where docker >nul 2>&1
if %errorlevel% equ 0 goto :RUN_DOCKER

goto :NOT_FOUND

:RUN_NODE
echo [OK] Found Node.js!
echo [INFO] Starting web application at http://localhost:5000 ...
start http://localhost:5000
echo.
echo ========================================================
echo Server is running at http://localhost:5000
echo Press Ctrl+C in this window to stop the server.
echo ========================================================
echo.
node server/index.js
goto :END

:RUN_DOCKER
echo [INFO] Node.js not found, but Docker is detected!
echo [INFO] Starting application inside Docker container...
docker compose up -d --build
start http://localhost:5000
echo.
echo ========================================================
echo Application is running inside Docker at http://localhost:5000
echo To stop container later, run: docker compose down
echo ========================================================
echo.
pause
goto :END

:NOT_FOUND
echo ========================================================
echo [ERROR] Neither Node.js nor Docker is installed/running!
echo ========================================================
echo.
echo Option 1 (Recommended):
echo   Download and install Node.js LTS from: https://nodejs.org
echo   After installing, just double-click this file again!
echo.
echo Option 2:
echo   Open Docker Desktop and make sure it is running.
echo   Then double-click "run-docker.bat"!
echo.
echo ========================================================
set /p CHOICE="Press '1' to open Node.js download page, or any other key to exit: "
if "%CHOICE%"=="1" start https://nodejs.org
exit /b 1

:END
pause
