@echo off
title PAC BATTLE ARENA
color 0A

echo ============================================
echo    PAC BATTLE ARENA - TikTok Live Game
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [FEHLER] Node.js ist nicht installiert!
    echo.
    echo Bitte Node.js herunterladen und installieren:
    echo https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [OK] Node.js gefunden
echo.

:: Check if node_modules exists, if not run npm install
if not exist "node_modules" (
    echo [INFO] Erste Ausfuehrung - Installiere Abhaengigkeiten...
    echo Dies kann 1-2 Minuten dauern...
    echo.
    call npm install
    echo.
    echo [OK] Installation abgeschlossen!
    echo.
)

:: Set TikTok username
set TIKTOK_USERNAME=playandwin2026

echo ============================================
echo    Spiel wird gestartet...
echo    TikTok User: %TIKTOK_USERNAME%
echo ============================================
echo.
echo    Oeffne in OBS als Browser-Quelle:
echo    URL: http://localhost:3000
echo    Breite: 1080  Hoehe: 1080
echo.
echo    Zum Testen im Browser oeffnen:
echo    http://localhost:3000
echo.
echo    Druecke D im Spiel fuer Debug-Panel
echo.
echo    Druecke STRG+C zum Beenden
echo ============================================
echo.

:: Start the server
node server/index.js

:: If server exits, pause so user can see error
echo.
echo [INFO] Server wurde beendet.
pause
