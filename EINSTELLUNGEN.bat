@echo off
title PAC BATTLE ARENA - Einstellungen
color 0E

echo ============================================
echo    PAC BATTLE ARENA - Einstellungen
echo ============================================
echo.
echo Aktueller TikTok Username: playandwin2026
echo.

set /p USERNAME="Neuer TikTok Username (Enter = Standard): "

if "%USERNAME%"=="" set USERNAME=playandwin2026

echo.
echo ============================================
echo    Starte Spiel mit: %USERNAME%
echo ============================================
echo.
echo    OBS Browser-Quelle:
echo    URL: http://localhost:3000
echo    Breite: 1080  Hoehe: 1080
echo.

set TIKTOK_USERNAME=%USERNAME%

:: Install if needed
if not exist "node_modules" (
    echo [INFO] Installiere Abhaengigkeiten...
    call npm install
    echo.
)

node server/index.js

echo.
echo [INFO] Server wurde beendet.
pause
