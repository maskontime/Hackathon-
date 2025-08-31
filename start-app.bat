@echo off
echo Starting Maskon Health Application...
echo.

echo Starting Backend Server...
cd backend
start cmd /k "npm install && npm run dev"

echo.
echo Starting Frontend Application...
cd ..
start cmd /k "npm install && npm run web"

echo.
echo Application is starting...
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:8081
echo.
echo Press any key to exit...
pause
