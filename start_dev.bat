@echo off
title SAGE Full-Stack Dev Server
echo ===================================================
echo   Starting SAGE Full-Stack Development Environment
echo ===================================================
set PATH=C:\Users\Vaibhav\AppData\Local\Programs\nodejs;%PATH%

start "SAGE Backend (Django API :8000)" cmd /k ".\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
timeout /t 2 >nul
start "SAGE Frontend (Vite HMR :5173)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting up:
echo  - Django Backend:  http://127.0.0.1:8000/
echo  - Vite Frontend:   http://localhost:5173/
echo.
pause
