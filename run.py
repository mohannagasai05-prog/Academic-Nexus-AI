import uvicorn
import os
import sys

# Ensure UTF-8 output encoding for Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='ignore')
    except Exception:
        pass

# Ensure project root directory is on python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.database import init_db

if __name__ == "__main__":
    print("=" * 65)
    print(" ACADEMIC NEXUS AI - STUDENT OPERATING SYSTEM")
    print("=" * 65)
    print(" Initializing database tables...")
    init_db()
    print(" Starting server on http://localhost:8000")
    print(" Press Ctrl+C to stop the server.")
    print("=" * 65)
    
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
