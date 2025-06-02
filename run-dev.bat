@echo off
echo Starting Kana Pop development server...
echo Press Ctrl+C to stop the server when done
echo.

:: Run Vite with clean termination handling
npx vite
IF %ERRORLEVEL% NEQ 0 (
  echo.
  echo Server stopped with error code %ERRORLEVEL%
) ELSE (
  echo.
  echo Server stopped cleanly.
)

:: Ensure we exit cleanly
exit /b 0
