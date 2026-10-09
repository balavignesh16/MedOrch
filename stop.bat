@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ========================================
echo Stopping MedOrch development services
echo ========================================

rem Killed by port, not window title: "go run ." leaves the compiled
rem gateway.exe orphaned from the launching cmd window's process tree, so
rem "taskkill /T" on the window never reaches it. Ports are a reliable
rem identifier for our own fixed dev services regardless of process tree.
call :stop_port 3000 "MedOrch Frontend"
call :stop_port 50052 "MedOrch AI Engine"
call :stop_port 50051 "MedOrch Gateway"

rem Ollama does not have the go-run detachment problem, and here we must
rem NOT kill an Ollama instance the user runs independently of MedOrch, so
rem this one stays window-title-based, matching what start.bat marks.
set "FOUND="
for /f "delims=" %%L in ('taskkill /FI "WINDOWTITLE eq MedOrch Ollama" /T /F 2^>^&1') do (
  echo %%L | findstr /b /i "SUCCESS" >nul && set "FOUND=1"
)
if defined FOUND (
  echo Stopped MedOrch Ollama.
) else (
  echo Ollama was not started by start.bat; leaving it running.
)

echo Done.
exit /b 0

:stop_port
set "PORT=%~1"
set "LABEL=%~2"
set "ANY_FOUND="
rem A port can have more than one LISTENING line (e.g. 0.0.0.0 and
rem 127.0.0.1 bound separately) with different PIDs; kill all of them,
rem not just the last one a naive single-variable capture would keep.
for /f "tokens=5" %%I in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  taskkill /PID %%I /F >nul 2>nul
  set "ANY_FOUND=1"
)
if defined ANY_FOUND (
  echo Stopped %LABEL% on port %PORT%.
) else (
  echo %LABEL% was not running - port %PORT% is free.
)
exit /b 0
