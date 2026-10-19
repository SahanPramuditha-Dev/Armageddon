@echo off
echo Starting ARMAGEDDON Simulation Engine and Command Center...

start "ARMAGEDDON Backend (FastAPI + WebSockets)" cmd /k "cd /d %~dp0backend && .\.venv\Scripts\uvicorn app.main:app --port 8000 --reload"
timeout /t 2 >nul
start "ARMAGEDDON Frontend (Vite + R3F)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ARMAGEDDON services launched!
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:5173
pause
