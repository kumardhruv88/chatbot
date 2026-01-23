@echo off
cd /d "%~dp0"
echo Starting Chatbot Backend...
python -m backend.main
pause
