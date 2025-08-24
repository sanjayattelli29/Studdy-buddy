@echo off
echo Starting StudyBuddy Backend API (backend-render)...
echo.

cd /d "d:\studyBuddy-d folder\backend-render"

echo Checking if node_modules exists...
if not exist node_modules (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting the server...
echo.
echo Backend API will be available at: http://localhost:3001
echo Health check: http://localhost:3001/health
echo API test page: http://localhost:3001/test-api.html
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause
