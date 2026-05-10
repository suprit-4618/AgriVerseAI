cd app/backend
..\.venv\Scripts\python.exe -m uvicorn api:app --reload --port 8000
cd app/frontend
npm run dev
