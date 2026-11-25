@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo 找不到 Node.js。請先安裝 Node.js LTS，再重新雙擊 start-play.bat。
  echo 下載網址：https://nodejs.org/
  pause
  exit /b 1
)
node scripts\play-server.js --open %*
if errorlevel 1 pause
