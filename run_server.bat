@echo off
:START
node server.js
timeout 15
echo.
echo Press any key to restart the server...
echo.
goto START