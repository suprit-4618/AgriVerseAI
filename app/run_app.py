"""
Agriverse AI - Application Launcher
Starts both Frontend (Vite) and Backend (FastAPI) servers concurrently.
"""

import subprocess
import sys
import os
import signal
import threading
from pathlib import Path

# Configuration
ROOT_DIR = Path(__file__).parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"
VENV_PYTHON = ROOT_DIR / ".venv" / "Scripts" / "python.exe"

# Server ports
BACKEND_PORT = 8000
FRONTEND_PORT = 3000

# Store process references for cleanup
processes = []


def run_backend():
    """Start the FastAPI backend server."""
    print("\n🚀 Starting Backend Server (FastAPI with Uvicorn)...")
    print(f"   📍 URL: http://localhost:{BACKEND_PORT}")
    print(f"   📁 Directory: {BACKEND_DIR}\n")
    
    backend_process = subprocess.Popen(
        [str(VENV_PYTHON), "-m", "uvicorn", "api:app", "--reload", "--port", str(BACKEND_PORT)],
        cwd=str(BACKEND_DIR),
        stdout=sys.stdout,
        stderr=sys.stderr,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
    )
    processes.append(backend_process)
    return backend_process


def run_frontend():
    """Start the Vite frontend development server."""
    print("\n🌐 Starting Frontend Server (Vite)...")
    print(f"   📍 URL: http://localhost:{FRONTEND_PORT}")
    print(f"   📁 Directory: {FRONTEND_DIR}\n")
    
    # Use npm on Windows
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR),
        stdout=sys.stdout,
        stderr=sys.stderr,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
    )
    processes.append(frontend_process)
    return frontend_process


def cleanup(signum=None, frame=None):
    """Clean up all running processes."""
    print("\n\n🛑 Shutting down servers...")
    for process in processes:
        try:
            if os.name == 'nt':
                process.terminate()
            else:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        except Exception:
            pass
    print("✅ All servers stopped.")
    sys.exit(0)


def main():
    print("=" * 60)
    print("        🌱 AGRIVERSE AI - Application Launcher 🌱")
    print("=" * 60)
    
    # Check if frontend directory exists
    if not FRONTEND_DIR.exists():
        print(f"❌ Frontend directory not found: {FRONTEND_DIR}")
        sys.exit(1)
    
    # Check if backend directory exists
    if not BACKEND_DIR.exists():
        print(f"❌ Backend directory not found: {BACKEND_DIR}")
        sys.exit(1)
    
    # Check if virtual environment exists
    if not VENV_PYTHON.exists():
        print(f"❌ Python virtual environment not found: {VENV_PYTHON}")
        print("   Run: python -m venv .venv && .venv\\Scripts\\pip install -r backend\\requirements.txt")
        sys.exit(1)
    
    # Register cleanup handler
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    # Start servers in separate threads
    backend_thread = threading.Thread(target=run_backend)
    frontend_thread = threading.Thread(target=run_frontend)
    
    backend_thread.start()
    frontend_thread.start()
    
    print("\n" + "=" * 60)
    print("  ✅ Both servers are starting...")
    print(f"  🔗 Frontend: http://localhost:{FRONTEND_PORT}")
    print(f"  🔗 Backend:  http://localhost:{BACKEND_PORT} (Uvicorn)")
    print("  📝 Press Ctrl+C to stop all servers")
    print("=" * 60 + "\n")
    
    # Wait for processes to complete
    backend_thread.join()
    frontend_thread.join()
    
    # Keep main thread alive to handle signals
    for process in processes:
        process.wait()


if __name__ == "__main__":
    main()
