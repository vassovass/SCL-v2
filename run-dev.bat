@echo off
echo Starting StepCountLeague Development Server...
echo.

cd /d "D:\Vasso\coding projects\SCL v2\SCL-v2\apps\web"

echo Installing dependencies if needed...
call npm ci

echo.
echo Starting Next.js dev server...
echo Open http://localhost:3000 in your browser
echo.

call npm run dev
