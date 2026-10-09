@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo Starting MedOrch development services
echo ========================================

where go >nul 2>nul || (echo ERROR: Go is not installed or not on PATH. & exit /b 1)
where node >nul 2>nul || (echo ERROR: Node.js is not installed or not on PATH. & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm is not installed or not on PATH. & exit /b 1)
for /f "delims=." %%V in ('node -p "process.versions.node"') do set "NODE_MAJOR=%%V"
if %NODE_MAJOR% LSS 24 (
  echo ERROR: Node.js 24 or newer is required. Found major version %NODE_MAJOR%.
  exit /b 1
)

if not exist "database\medorch.db" (
  echo ERROR: database\medorch.db was not found.
  exit /b 1
)
if not exist "frontend\node_modules" (
  echo ERROR: Frontend dependencies are missing. Run: cd frontend ^&^& npm install
  exit /b 1
)
if not exist "engine\venv\Scripts\python.exe" (
  echo ERROR: Python virtual environment is missing. Create engine\venv and install requirements.
  exit /b 1
)

if exist ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do set "%%A=%%B"
)

echo %NVIDIA_BASE_URL% | findstr /i "localhost 127.0.0.1" >nul
if %ERRORLEVEL% EQU 0 (
  where ollama >nul 2>nul
  if %ERRORLEVEL% EQU 0 (
    curl -s -o nul -w "" --max-time 2 http://localhost:11434/api/tags >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
      echo Ollama is already running.
    ) else (
      echo Launching Ollama...
      rem Keep the model resident for 30 minutes of inactivity instead of
      rem Ollama's 5-minute default. A cold reload of a large model (e.g.
      rem qwen2.5:14b on a GPU-constrained machine) can take 45s+, which is
      rem an easy way to hit AI_LLM_TIMEOUT_SECONDS on the first question
      rem after a short pause between questions.
      set "OLLAMA_KEEP_ALIVE=30m"
      start "MedOrch Ollama" /min cmd /k "ollama serve"
      timeout /t 3 /nobreak >nul
    )
  ) else (
    echo WARNING: NVIDIA_BASE_URL points at localhost but ollama is not on PATH. Install it from https://ollama.com.
  )
)

echo Launching Go gateway...
start "MedOrch Gateway" /D "%~dp0gateway" cmd /k go run .

if defined NVIDIA_API_KEY (
  echo Launching Python AI engine...
  start "MedOrch AI Engine" /D "%~dp0engine" cmd /k venv\Scripts\python.exe main.py
) else (
  echo AI engine skipped: NVIDIA_API_KEY is not configured. Dashboard mode remains available.
)

echo Launching Next.js frontend...
start "MedOrch Frontend" /D "%~dp0frontend" cmd /k npm run dev

echo Services were launched in separate windows. Review each window for startup errors.
echo Run stop.bat to shut everything down.
