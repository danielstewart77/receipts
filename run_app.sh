#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
VENV_PYTHON="$SCRIPT_DIR/venv/bin/python"

# Check if virtual environment exists
if [ ! -f "$VENV_PYTHON" ]; then
    echo "Virtual environment not found at $VENV_PYTHON"
    echo "Please create a virtual environment first: python -m venv venv"
    exit 1
fi

# Kill any existing processes
pkill -f "uvicorn main:app"
pkill -f "streamlit run"

# Start FastAPI server in the background
echo "Starting FastAPI server with virtual environment..."
$VENV_PYTHON -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!

# Wait a moment for FastAPI to start
sleep 3

# Start Streamlit app
echo "Starting Streamlit app with virtual environment..."
$VENV_PYTHON -m streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0 &
STREAMLIT_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $FASTAPI_PID 2>/dev/null
    kill $STREAMLIT_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "FastAPI server running on: http://localhost:8000"
echo "Streamlit app running on: http://localhost:8501"
echo "Press Ctrl+C to stop both servers"

# Wait for processes
wait
