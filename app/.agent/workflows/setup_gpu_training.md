---
description: Setup and Run GPU Training for Plant Disease Model
---

# Setup and Run GPU Training

This workflow guides you through setting up the environment for GPU-accelerated model training on Windows.

## Prerequisites

- **NVIDIA GPU** with updated drivers.
- **Windows 10/11**.
- **Python 3.8 - 3.10** (TensorFlow 2.10 does not support Python 3.11+).
  - *Note: If you have Python 3.11+, you must use a virtual environment with Python 3.10 or use WSL2.*

## Step 1: Install CUDA and cuDNN (Manual Step)

To use your GPU with TensorFlow 2.10 on Windows Native, you **MUST** install specific versions of CUDA and cuDNN. Newer versions will NOT work.

1.  **Download & Install CUDA Toolkit 11.2**:
    -   [Download Link](https://developer.nvidia.com/cuda-11.2.0-download-archive)
    -   Install with default settings.

2.  **Download & Install cuDNN 8.1 for CUDA 11.x**:
    -   [Download Link](https://developer.nvidia.com/rdp/cudnn-archive) (Requires NVIDIA Developer account).
    -   Extract the zip file.
    -   Copy the contents of `bin`, `include`, and `lib` folders into your CUDA installation directory (usually `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.2`).

3.  **Verify Environment Variables**:
    -   Ensure `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.2\bin` is in your system `PATH`.

## Step 2: Setup Python Environment

1.  **Create a Virtual Environment (Recommended)**:
    It is highly recommended to use Python 3.9 or 3.10.
    ```powershell
    # If you have Python 3.10 installed as 'py -3.10' or similar:
    py -3.10 -m venv venv
    .\venv\Scripts\activate
    ```

2.  **Install Dependencies**:
    Navigate to the backend directory and install the GPU-enabled requirements.
    ```powershell
    cd backend
    pip install -r requirements.txt
    ```

## Step 3: Train the Model

Run the training script. It will automatically detect your GPU.

```powershell
python train_model.py
```

**Verify GPU Usage**:
At the start of the script, look for:
`✅ GPU detected: 1 device(s)`

## Step 4: Start the API

Once training is complete, start the backend server.

```powershell
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
