---
description: Setup and Run Python Backend for Plant Disease Analysis
---

# Setup and Run Python Backend

This workflow guides you through setting up the Python backend, downloading the dataset, training the model, and running the API server.

## Prerequisites

- Python 3.8+ installed
- Node.js installed (for the frontend)

## Steps

1.  **Install Python Dependencies**
    Navigate to the backend directory and install the required packages.
    ```powershell
    cd backend
    pip install -r requirements.txt
    ```

2.  **Download the Dataset**
    Run the download script to fetch the Plant Village dataset from Kaggle.
    ```powershell
    python download_dataset.py
    ```
    *Note: This may take a few minutes.*

3.  **Train the Model**
    Train the MobileNetV2 model on the downloaded dataset.
    ```powershell
    python train_model.py
    ```
    *Note: Training may take some time depending on your hardware (GPU recommended).*

4.  **Start the Backend API**
    Start the FastAPI server.
    ```powershell
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload
    ```

5.  **Start the Frontend**
    In a separate terminal, start the React frontend (if not already running).
    ```powershell
    npm run dev
    ```

## Verification

-   Open `http://localhost:8000/` to verify the backend is running.
-   Open the app in your browser and try uploading a plant image.
-   The app should now use the local Python model for fast classification and Gemini AI for detailed recommendations.
