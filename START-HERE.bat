@echo off
title Jay Bhutnath Agri Portal - Starting...
color 0A
cls

echo.
echo  ================================================
echo    JAY BHUTNATH AGRI PORTAL
echo    Mandvi, Kutch, Gujarat
echo  ================================================
echo.

:: ─── Check Node.js ───────────────────────────────────────
echo  [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   Node.js is NOT installed!
    echo   Please download from: https://nodejs.org
    echo   Then run this file again.
    echo.
    pause
    exit /b 1
)
for /f %%v in ('node --version') do echo   Node.js %%v found
echo.

:: ─── Install Dependencies (first time only) ───────────────
echo  [2/3] Checking dependencies...
if not exist "%~dp0server\node_modules" (
    echo   Installing packages for the first time...
    cd /d "%~dp0server"
    npm install
    if %errorlevel% neq 0 (
        echo   Install failed! Check internet connection.
        pause
        exit /b 1
    )
    echo   Packages installed successfully!
) else (
    echo   Dependencies are ready!
)
echo.

:: ─── Kill old server on port 3001 ────────────────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: ─── Start Backend Server ─────────────────────────────────
echo  [3/3] Starting backend server...
cd /d "%~dp0server"
start /b "" node server.js >"%~dp0server\server.log" 2>&1

:: Wait for server to start
timeout /t 4 /nobreak >nul
cd /d "%~dp0"

echo.
echo  ================================================
echo    Server is RUNNING at http://localhost:3001
echo  ================================================
echo.
echo   Opening website in your browser...
echo.
echo   To STOP the server: close this window
echo.
echo  ================================================
echo.

:: ─── Open Browser ─────────────────────────────────────────
start "" "http://localhost:3001/index.html"

:: ─── Keep window open (server keeps running) ──────────────
echo   Press any key to STOP the server and exit.
echo.
pause >nul

:: ─── Stop server when window closes ──────────────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo   Server stopped. Goodbye!
timeout /t 2 /nobreak >nul
