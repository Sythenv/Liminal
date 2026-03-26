@echo off
title MSF Lab Register
echo ==========================================
echo   MSF Laboratory Registration System
echo   Starting... please wait
echo ==========================================
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

if not exist ".deps_installed" (
    echo Installing dependencies...
    python -m pip install --target=.\lib -r requirements.txt
    echo done > .deps_installed
)

set PYTHONPATH=%~dp0lib;%~dp0;%PYTHONPATH%
if not exist "data" mkdir data
if not exist "data\exports" mkdir data\exports

start "" cmd /c "timeout /t 2 >nul && start http://127.0.0.1:5000"
echo Server running at http://127.0.0.1:5000
echo Press Ctrl+C to stop
python -m app.run
