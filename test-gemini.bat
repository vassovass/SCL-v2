@echo off
echo Testing Gemini API connection...
echo.

set GEMINI_API_KEY=AIzaSyCzcR4YB5MLUwHsdmaaq5Djp8qbC3OYisw

curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%GEMINI_API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"contents\":[{\"parts\":[{\"text\":\"Say hello in exactly 5 words\"}]}]}"

echo.
echo.
echo If you see a JSON response with "candidates", the Gemini API is working!
echo If you see an error, check your API key.
pause
