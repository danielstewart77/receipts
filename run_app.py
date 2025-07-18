#!/usr/bin/env python3
"""
Script to run both FastAPI server and Streamlit app
"""
import subprocess
import sys
import time
import signal
import os

def get_python_executable():
    """Get the virtual environment Python executable"""
    venv_python = os.path.join(os.path.dirname(os.path.abspath(__file__)), "venv", "bin", "python")
    if os.path.exists(venv_python):
        return venv_python
    return sys.executable

def run_servers():
    """Run FastAPI and Streamlit servers"""
    processes = []
    python_exe = get_python_executable()
    
    try:
        # Start FastAPI server
        print(f"Starting FastAPI server on port 8000 using {python_exe}...")
        fastapi_process = subprocess.Popen([
            python_exe, "-m", "uvicorn", "main:app", 
            "--reload", "--host", "0.0.0.0", "--port", "8000"
        ])
        processes.append(fastapi_process)
        
        # Wait for FastAPI to start
        time.sleep(3)
        
        # Start Streamlit app
        print(f"Starting Streamlit app on port 8501 using {python_exe}...")
        streamlit_process = subprocess.Popen([
            python_exe, "-m", "streamlit", "run", "streamlit_app.py",
            "--server.port", "8501", "--server.address", "0.0.0.0"
        ])
        processes.append(streamlit_process)
        
        print("\n" + "="*50)
        print("🚀 Both servers are running!")
        print("📡 FastAPI server: http://localhost:8000")
        print("📱 Streamlit app: http://localhost:8501")
        print("📖 API Documentation: http://localhost:8000/docs")
        print("="*50)
        print("\nPress Ctrl+C to stop both servers")
        
        # Wait for processes
        for process in processes:
            process.wait()
            
    except KeyboardInterrupt:
        print("\n\nStopping servers...")
        for process in processes:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        print("Servers stopped.")
        
    except Exception as e:
        print(f"Error running servers: {e}")
        for process in processes:
            process.terminate()

if __name__ == "__main__":
    run_servers()
