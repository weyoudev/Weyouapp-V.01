@echo off
REM Stops all Node processes and removes existing Prisma client so generate can create fresh (fixes EPERM on Windows)
echo Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (echo Node processes stopped.) else (echo No Node processes were running.)
timeout /t 2 /nobreak >nul
echo.
echo Removing existing Prisma client so it can be recreated (avoids rename lock)...
if exist node_modules\.prisma rmdir /s /q node_modules\.prisma
echo.
echo Running prisma generate...
call npm run prisma:generate
echo.
echo Done. You can start the API again with: npm run dev:api
