# Plant Disease Detection Backend

Python-based plant disease classification system using deep learning (TensorFlow/Keras) with FastAPI.

## 🌟 Features

- **38 Plant Disease Classes** - Covers major crops including tomato, potato, apple, grape, corn, etc.
- **Transfer Learning** - Uses MobileNetV2 pre-trained on ImageNet
- **High Accuracy** - Achieves 90-95% validation accuracy
- **Fast Inference** - <500ms prediction time
- **REST API** - FastAPI server with CORS support
- **Easy Integration** - Works seamlessly with React frontend

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- 4GB+ RAM recommended
- GPU optional (speeds up training significantly)

## 🚀 Quick Start

### 1. Set Up Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download Dataset

```bash
python download_dataset.py
```

This will:
- Download the New Plant Diseases Dataset from Kaggle (~2GB)
- Verify dataset structure
- Display statistics (87K+ images, 38 classes)
- Save dataset paths to `dataset_config.txt`

### 4. Train the Model

```bash
python train_model.py
```

Training will:
- Load and preprocess images
- Build MobileNetV2-based CNN
- Train for ~20 epochs with early stopping
- Save best model to `models/plant_disease_model_best.h5`
- Generate training plots

**Training Time:**
- CPU: 1-2 hours
- GPU: 15-30 minutes

### 5. Start API Server

```bash
uvicorn api:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

## 📡 API Endpoints

### Health Check
```
GET /
```

Response:
```json
{
  "status": "online",
  "message": "Plant Disease Detection API",
  "model_loaded": true,
  "num_classes": 38
}
```

### Predict Disease
```
POST /predict
Content-Type: multipart/form-data
```

Parameters:
- `file`: Image file (JPG, PNG)

Response:
```json
{
  "disease_name": "Late blight",
  "confidence": 0.95,
  "severity": "High",
  "crop": "Tomato",
  "is_healthy": false,
  "top_predictions": [
    {
      "class": "Tomato___Late_blight",
      "confidence": 0.95
    },
    ...
  ]
}
```

### Get All Classes
```
GET /classes
```

## 🧪 Testing the API

### Using curl
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/plant_image.jpg"
```

### Using Python
```python
import requests

url = "http://localhost:8000/predict"
files = {"file": open("plant_image.jpg", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

### API Documentation
Visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

## 📁 Project Structure

```
backend/
├── models/                          # Trained models and artifacts
│   ├── plant_disease_model.h5      # Final trained model
│   ├── plant_disease_model_best.h5 # Best model checkpoint
│   ├── class_mapping.json          # Class index to name mapping
│   └── training_history.png        # Training plots
├── dataset/                         # Downloaded dataset (auto-created)
├── download_dataset.py              # Dataset downloader
├── train_model.py                   # Model training script
├── api.py                          # FastAPI server
├── requirements.txt                # Python dependencies
├── dataset_config.txt              # Dataset paths (auto-generated)
└── README.md                       # This file
```

## 🔧 Configuration

Edit these variables in `train_model.py`:
- `IMG_SIZE`: Image size (default: 224)
- `BATCH_SIZE`: Batch size (default: 32)
- `EPOCHS`: Maximum epochs (default: 20)
- `LEARNING_RATE`: Learning rate (default: 0.0001)

## 📊 Model Architecture

```
MobileNetV2 (pre-trained, frozen)
    ↓
GlobalAveragePooling2D
    ↓
BatchNormalization + Dropout(0.5)
    ↓
Dense(512, relu)
    ↓
BatchNormalization + Dropout(0.3)
    ↓
Dense(38, softmax)
```

## 🎯 Expected Performance

- **Training Accuracy:** ~95%
- **Validation Accuracy:** ~92%
- **Top-3 Accuracy:** ~98%
- **Inference Time:** <500ms per image

## 🔗 Integration with React App

The React frontend is already configured to use this API. The service file `services/pythonPlantService.ts` handles all API calls.

To use the Python model in your app:
1. Start the API server (port 8000)
2. The React app will automatically detect and use it
3. Fallback to Gemini AI if Python API is unavailable

## 🐛 Troubleshooting

### Model not loading
- Ensure you've run `python train_model.py` first
- Check that `models/plant_disease_model.h5` exists

### Dataset download fails
- Check internet connection
- Ensure you have Kaggle credentials configured
- Try downloading manually from Kaggle

### Low accuracy
- Ensure dataset downloaded completely
- Try training for more epochs
- Check data augmentation settings

### API CORS errors
- Verify React app is running on port 3000
- Check CORS settings in `api.py`

## 📝 License

This project uses the PlantVillage dataset, which is publicly available for research purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
