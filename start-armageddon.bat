@echo off
setlocal
cd /d "%~dp0"

echo Starting ARMAGEDDON Simulation Engine and Command Center...

if not exist "backend\.venv\Scripts\uvicorn.exe" (
    echo ERROR: Backend virtual environment not found.
    echo Create it and install backend\requirements.txt before running this script.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo ERROR: Frontend dependencies not found.
    echo Run "npm install" from the frontend folder before running this script.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found on PATH.
    echo Install Node.js, then run this script again.
    pause
    exit /b 1
)

start "ARMAGEDDON Backend (FastAPI + WebSockets)" cmd /k "cd /d "%~dp0backend" && .\.venv\Scripts\uvicorn.exe app.main:app --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "ARMAGEDDON Frontend (Vite + React Three Fiber)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ARMAGEDDON services launched in separate windows.
echo Backend API: http://localhost:8000
echo API docs:    http://localhost:8000/docs
echo Website:     http://localhost:5173
echo.
echo Keep both service windows open while using the website.
pause
