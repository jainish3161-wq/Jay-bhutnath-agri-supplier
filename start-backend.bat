@echo off
title Jay Bhutnath Agri Suppler - Backend Server
color 0A

echo.
echo  ============================================
echo   🌾  JAY BHUTNATH AGRI SUPPLER - BACKEND
echo   📍  Mandvi, Kutch, Gujarat
echo  ============================================
echo.

cd /d "%~dp0server"

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Node.js is NOT installed!
    echo     Download from: https://nodejs.org
    pause
    exit /b 1
)
echo  ✅ Node.js found:
node --version

echo.
echo [2/3] Installing dependencies...
if not exist node_modules (
    echo  📦 Running npm install...
    npm install
    if %errorlevel% neq 0 (
        echo  ❌ npm install failed!
        pause
        exit /b 1
    )
) else (
    echo  ✅ Dependencies already installed
)

echo.
echo [3/3] Starting backend server...
echo.
echo  ============================================
echo   🚀  Server starting on http://localhost:3001
echo   📊  Admin Panel  → open admin.html in browser
echo   🌐  Website      → open index.html in browser
echo  ============================================
echo.
echo  Press CTRL+C to stop the server
echo.

node server.js

pause
