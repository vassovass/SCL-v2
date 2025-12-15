@echo off
echo Starting StepCountLeague Development Server...
echo.

echo ============================================
echo Testing Gemini AI API connection...
echo ============================================
echo.

set GEMINI_API_KEY=AIzaSyCzcR4YB5MLUwHsdmaaq5Djp8qbC3OYisw

curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%GEMINI_API_KEY%" -H "Content-Type: application/json" -d "{\"contents\":[{\"parts\":[{\"text\":\"Reply with only: OK\"}]}]}" > "%TEMP%\gemini_test.json" 2>&1

findstr /C:"candidates" "%TEMP%\gemini_test.json" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Gemini AI API test FAILED!
    echo.
    echo Response:
    type "%TEMP%\gemini_test.json"
    echo.
    echo.
    echo Step verification will NOT work without a valid Gemini API key.
    echo You can still use the app for auth, leagues, and submissions.
    echo.
    choice /C YN /M "Continue without AI verification"
    if %ERRORLEVEL% EQU 2 (
        echo.
        echo Exiting. Please fix your Gemini API key and try again.
        pause
        exit /b 1
    )
    echo.
    echo Continuing without AI verification...
    echo.
) else (
    echo [SUCCESS] Gemini AI API is working!
    echo.
)

del "%TEMP%\gemini_test.json" 2>nul

echo ============================================
echo Setting up Next.js...
echo ============================================
echo.

cd /d "%~dp0apps\web"

echo Installing dependencies if needed...
call npm ci

echo.
echo Starting Next.js dev server...
echo Open http://localhost:3000 in your browser
echo.

call npm run dev
