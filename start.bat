@echo off
title Liminal
cd /d "%~dp0"
echo ==========================================
echo   Liminal — Laboratory Register
echo   Starting... please wait
echo ==========================================
echo.

:: Use embedded runtime if available, otherwise system Python
if exist "%~dp0runtime\python.exe" (
    set PYTHON=%~dp0runtime\python.exe
    set PYTHONHOME=%~dp0runtime
    goto :ready
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Use a standalone kit or install Python 3.10+
    pause
    exit /b 1
)
set PYTHON=python

:: Dev mode: install deps if needed
if not exist ".deps_installed" (
    echo Installing dependencies...
    %PYTHON% -m pip install --target=.\lib -r requirements.txt
    echo done > .deps_installed
)

:ready
set PYTHONPATH=%~dp0lib;%~dp0;%PYTHONPATH%
if not exist "data" mkdir data
if not exist "data\exports" mkdir data\exports

start "" cmd /c "for /L %%i in (1,1,30) do (powershell -Command \"try { (Invoke-WebRequest -Uri http://127.0.0.1:5000 -UseBasicParsing -TimeoutSec 1).StatusCode } catch { exit 1 }\" >nul 2>&1 && start http://127.0.0.1:5000 && exit /b || timeout /t 1 >nul)"
echo Server running at http://127.0.0.1:5000
echo Press Ctrl+C to stop
%PYTHON% -m app.run
