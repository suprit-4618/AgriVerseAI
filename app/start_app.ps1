# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\app\backend; & 'd:\app\.venv\Scripts\python.exe' -m uvicorn api:app --reload --port 8000"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\app; npm run dev"
