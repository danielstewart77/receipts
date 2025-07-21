#!/usr/bin/env python3
"""
Production runner for FastAPI + Streamlit application
This script starts both services in a container environment
"""
import os
import sys
import subprocess
import time
import signal
from multiprocessing import Process

def run_fastapi():
    """Run FastAPI server using uvicorn"""
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload in production
        workers=1
    )

def run_streamlit():
    """Run Streamlit app"""
    # Wait a moment for FastAPI to start
    time.sleep(2)
    subprocess.run([
        sys.executable, "-m", "streamlit", "run", "streamlit_app.py",
        "--server.port", "8501",
        "--server.address", "0.0.0.0",
        "--server.headless", "true",
        "--browser.gatherUsageStats", "false"
    ])

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print(f"Received signal {signum}, shutting down...")
    sys.exit(0)

if __name__ == "__main__":
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("Starting FastAPI + Streamlit services...")
    
    # Start FastAPI in a separate process
    fastapi_process = Process(target=run_fastapi)
    fastapi_process.start()
    
    try:
        # Run Streamlit in the main process
        run_streamlit()
    except KeyboardInterrupt:
        print("Shutting down services...")
    finally:
        if fastapi_process.is_alive():
            fastapi_process.terminate()
            fastapi_process.join()