@echo off
title TU Canteen WebApp - CS261 Sprint 1
echo ========================================================
echo Starting TU Canteen Web Application (Mobile-First)
echo ========================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบ Node.js ในเครื่องคอมพิวเตอร์นี้!
    echo.
    echo วิธีแก้ไข (เลือกได้ 2 ทาง):
    echo  1. ติดตั้ง Node.js จาก https://nodejs.org (ดาวน์โหลดตัว LTS ติดตั้งแล้วเปิดใหม่)
    echo  2. หรือรันด้วย Docker โดยดับเบิ้ลคลิกไฟล์ "run-docker.bat" แทนได้เลย (ไม่ต้องลง Node.js)
    echo.
    pause
    exit /b 1
)

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
