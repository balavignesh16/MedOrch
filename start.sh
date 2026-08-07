#!/bin/bash

echo "========================================"
echo "Starting MedOrch Enterprise Platform..."
echo "========================================"

echo "Starting Go Gateway Backend on port 50051..."
cd gateway && go run main.go &
cd ..

echo "Starting Python AI Engine on port 50052..."
cd engine && source venv/bin/activate && python main.py &
cd ..

echo "Starting Next.js Frontend Development Server on port 3000..."
cd frontend && npm run dev &
cd ..

echo "All services have been launched in the background!"
echo "Press CTRL+C to stop all services."

trap 'kill $(jobs -p)' SIGINT
wait
