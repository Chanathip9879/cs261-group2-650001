@echo off
echo ========================================================
echo Testing Docker Build and Container Startup (Sprint 1)
echo ========================================================
echo 1. Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

echo 2. Building and starting containers with docker compose...
docker compose up -d --build

echo 3. Checking running containers...
docker compose ps

echo 4. Waiting for web application health check...
timeout /t 5 /nobreak >nul
curl -I http://localhost:3000

echo ========================================================
echo Docker test completed! Open http://localhost:3000 to test.
echo ========================================================
