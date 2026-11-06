@echo off
title Jay Bhutnath Agri Portal - START HERE
color 0A
cls

echo.
echo  ================================================
echo    🌾  JAY BHUTNATH AGRI PORTAL
echo    📍  Mandvi, Kutch, Gujarat
echo    ✅  All-in-One Startup Script
echo  ================================================
echo.

:: ─── Check Node.js ───────────────────────────────────────
echo  [1/4] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   ❌ Node.js NOT installed!
    echo   ─────────────────────────────────────────────
    echo   Please download and install from:
    echo   https://nodejs.org/en/download
    echo   Then run this file again.
    echo.
    pause
    exit /b 1
)
for /f %%v in ('node --version') do echo   ✅ Node.js %%v found
echo.

:: ─── Install Dependencies ────────────────────────────────
echo  [2/4] Checking dependencies...
if not exist "%~dp0server\node_modules" (
    echo   📦 Installing packages (first-time only)...
    cd /d "%~dp0server"
    npm install --prefer-offline 2>&1
    if %errorlevel% neq 0 (
        echo   ❌ npm install failed! Check your internet connection.
        pause
        exit /b 1
    )
    echo   ✅ Dependencies installed
) else (
    echo   ✅ Dependencies already installed
)
echo.

:: ─── Kill any old server on port 3001 ───────────────────
echo  [3/4] Clearing port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo   ✅ Port ready
echo.

:: ─── Start Server in Background ─────────────────────────
echo  [4/4] Starting backend server...
cd /d "%~dp0server"
start /b "" node server.js >"%~dp0server\server.log" 2>&1

:: Wait 3 seconds for server to start
timeout /t 3 /nobreak >nul

:: ─── Verify Server Started ──────────────────────────────
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo   ⚠️  Server might still be starting...
    timeout /t 2 /nobreak >nul
)

echo.
echo  ================================================
echo    🚀  SERVER RUNNING at http://localhost:3001
echo  ================================================
echo.
echo   🌐  Opening website in browser...
echo.
echo   ─── IMPORTANT LINKS ───────────────────────────
echo.
echo   Website  → http://localhost:3001/index.html
echo   Admin    → http://localhost:3001/admin.html
echo.
echo   ─── LOGIN DETAILS ─────────────────────────────
echo.
echo   Admin    : username=admin  password=admin123
echo   Delivery : phone=9000000000  PIN=1234 (demo)
echo   Farmer   : Register first → get approved → login
echo.
echo   ─── TO STOP ────────────────────────────────────
echo.
echo   Close this window or press CTRL+C
echo.
echo  ================================================
echo.

:: ─── Open Browser ───────────────────────────────────────
start "" "http://localhost:3001/index.html"

:: ─── Keep window open (server runs in background) ───────
echo   Press any key to STOP the server and exit...
echo.
pause >nul

:: ─── Kill server on exit ─────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo   Server stopped. Goodbye!
timeout /t 2 /nobreak >nul
