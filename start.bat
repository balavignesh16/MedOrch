@echo off
echo ========================================
echo Starting MedOrch Enterprise Platform...
echo ========================================

echo Starting Go Gateway Backend on port 50051...
start "MedOrch Gateway" cmd /c "cd gateway && go run main.go"

echo Starting Python AI Engine on port 50052...
start "MedOrch AI Engine" cmd /c "cd engine && venv\Scripts\python main.py"

echo Starting Next.js Frontend Development Server on port 3000...
start "MedOrch Frontend" cmd /c "cd frontend && npm run dev"

echo All services have been launched in separate windows!
