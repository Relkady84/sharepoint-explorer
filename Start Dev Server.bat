@echo off
title SharePoint Explorer - Dev Server
echo.
echo  ==========================================
echo   SharePoint Explorer - Local Dev Server
echo  ==========================================
echo.
echo  Starting... Chrome will open automatically.
echo  Do NOT close this window while working.
echo.

cd /d "C:\Users\raede\OneDrive - lycee-montaigne.edu.lb\Documents\GitHub\Sharepoint"

:: Open Chrome after 4 seconds in the background
start "" cmd /c "timeout /t 4 /nobreak >nul && start chrome http://localhost:5173"

:: Start the Vite dev server
npm run dev

pause
