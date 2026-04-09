"""
FastAPI server for plant disease prediction
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import json
from pathlib import Path
from typing import List, Dict, Optional
from contextlib import asynccontextmanager
import traceback
import logging
import sys
import asyncio
import os

# JWT Authentication
from jwt_auth import get_current_user, get_optional_user, TokenData

# Token Database
from token_db import (
    store_token, get_token_by_hash, validate_token as validate_db_token,
    revoke_token, revoke_all_user_tokens, get_user_tokens, cleanup_expired_tokens
)
from crypto_utils import generate_secure_token, generate_token_hash

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler("server.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
IMG_SIZE = 224
MODEL_PATH = Path(__file__).parent / 'models' / 'plant_disease_model.h5'
CLASS_MAPPING_PATH = Path(__file__).parent / 'models' / 'class_mapping.json'

# Global variables
model = None
class_mapping = None

# Response models
class TopPrediction(BaseModel):
    disease_class: str
    confidence: float

class PredictionResult(BaseModel):
    disease_name: str
    confidence: float
    severity: str
    crop: str
    is_healthy: bool
    top_predictions: List[TopPrediction]

def configure_gpu():
    """Configure GPU memory growth to avoid OOM errors"""
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print(f"✅ GPU detected: {len(gpus)} device(s)")
        except RuntimeError as e:
            print(f"⚠️ GPU configuration error: {e}")
    else:
        print("⚠️ No GPU detected. Training will run on CPU (slower).")

def load_model_and_mapping():
    """Load the trained model and class mapping"""
    global model, class_mapping
    
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Please train the model first by running 'python train_model.py'"
        )
    
    if not CLASS_MAPPING_PATH.exists():
        raise FileNotFoundError(
            f"Class mapping not found at {CLASS_MAPPING_PATH}. "
            "Please train the model first by running 'python train_model.py'"
        )
    
    print("🔄 Loading model...", flush=True)
    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    except TypeError as e:
        if "groups" in str(e) and "DepthwiseConv2D" in str(e):
            print("⚠️  Model version mismatch detected. Applying patch for DepthwiseConv2D...", flush=True)
            class PatchedDepthwiseConv2D(tf.keras.layers.DepthwiseConv2D):
                def __init__(self, **kwargs):
                    if 'groups' in kwargs:
                        kwargs.pop('groups')
                    super().__init__(**kwargs)
            model = tf.keras.models.load_model(MODEL_PATH, custom_objects={'DepthwiseConv2D': PatchedDepthwiseConv2D}, compile=False)
        else:
            raise e
    
    with open(CLASS_MAPPING_PATH, 'r') as f:
        class_mapping = json.load(f)
        
    print(f"✅ Model loaded successfully! ({len(class_mapping)} classes)", flush=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup"""
    configure_gpu()
    try:
        load_model_and_mapping()
        if model is not None:
            print("🔥 Warming up model...", flush=True)
            dummy_input = np.zeros((1, IMG_SIZE, IMG_SIZE, 3))
            model.predict(dummy_input, verbose=0)
            print("✅ Model warmup complete!", flush=True)
    except Exception as e:
        print(f"⚠️  Warning: Could not load model: {e}")
        print("The API will start but predictions will fail until the model is trained.")
    yield

# Initialize FastAPI
app = FastAPI(
    title="Plant Disease Detection API",
    description="AI-powered plant disease classification using deep learning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://agriverse-ai.vercel.app", # Default production URL
]

# Add dynamic frontend URL if provided
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url}", flush=True)
    response = await call_next(request)
    print(f"Response: {response.status_code}", flush=True)
    return response

def parse_disease_name(class_name: str) -> Dict[str, str]:
    parts = class_name.split('___')
    if len(parts) == 2:
        crop = parts[0].replace('_', ' ')
        disease = parts[1].replace('_', ' ')
        is_healthy = 'healthy' in disease.lower()
        return {'crop': crop, 'disease': disease, 'is_healthy': is_healthy}
    else:
        return {'crop': class_name, 'disease': 'Unknown', 'is_healthy': False}

def determine_severity(confidence: float, is_healthy: bool) -> str:
    if is_healthy:
        return "Healthy"
    if confidence >= 0.9:
        return "High"
    elif confidence >= 0.7:
        return "Moderate"
    else:
        return "Low"

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Plant Disease Detection API",
        "model_loaded": model is not None,
        "num_classes": len(class_mapping) if class_mapping else 0
    }

@app.post("/predict", response_model=PredictionResult)
async def predict(file: UploadFile = File(...)):
    print(f"\n{'='*50}", flush=True)
    print(f"🔄 Processing new image: {file.filename}...", flush=True)
    print(f"{'='*50}\n", flush=True)
    
    if model is None or class_mapping is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train the model first.")
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image (JPG, PNG)")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB').resize((IMG_SIZE, IMG_SIZE))
        
        img_array = tf.keras.preprocessing.image.img_to_array(image)
        img_array = tf.expand_dims(img_array, 0)
        img_array = img_array / 255.0
        
        print("🧠 Running inference...", flush=True)
        predictions = model(img_array, training=False).numpy()[0]
        
        top_idx = np.argmax(predictions)
        top_confidence = float(predictions[top_idx])
        top_class = class_mapping[str(top_idx)]
        disease_info = parse_disease_name(top_class)
        
        print(f"✅ Prediction Complete: {disease_info['disease']} ({top_confidence:.2%})", flush=True)
        
        top_3_indices = np.argsort(predictions)[-3:][::-1]
        top_predictions = [
            TopPrediction(disease_class=class_mapping[str(idx)], confidence=float(predictions[idx]))
            for idx in top_3_indices
        ]
            
        severity = determine_severity(top_confidence, disease_info['is_healthy'])
        
        return PredictionResult(
            disease_name=disease_info['disease'],
            confidence=top_confidence,
            severity=severity,
            crop=disease_info['crop'],
            is_healthy=disease_info['is_healthy'],
            top_predictions=top_predictions
        )
        
    except Exception as e:
        print(f"❌ Prediction Error: {str(e)}", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/classes")
async def get_classes():
    if class_mapping is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {
        "num_classes": len(class_mapping),
        "classes": list(class_mapping.values())
    }

# ============================================================
# TOKEN MANAGEMENT ENDPOINTS
# ============================================================

class TokenRequest(BaseModel):
    user_id: str
    email: Optional[str] = None
    role: Optional[str] = None
    device_info: Optional[str] = None

class TokenResponse(BaseModel):
    token: str
    token_hash: str
    expires_in: int

class TokenValidateRequest(BaseModel):
    token: str

class TokenRevokeRequest(BaseModel):
    token: Optional[str] = None
    revoke_all: bool = False
    reason: Optional[str] = None

@app.post("/auth/token", response_model=TokenResponse)
async def generate_token(request: TokenRequest, req: Request):
    print(f"🔐 Generating token for user: {request.user_id}", flush=True)
    try:
        import jwt
        from datetime import datetime, timedelta
        import os
        
        expiry_days = int(os.environ.get("TOKEN_EXPIRY_DAYS", "7"))
        expires_at = datetime.utcnow() + timedelta(days=expiry_days)
        
        payload = {
            "sub": request.user_id,
            "email": request.email,
            "role": request.role,
            "iat": datetime.utcnow(),
            "exp": expires_at
        }
        
        secret = os.environ.get("JWT_SECRET", "your-jwt-secret-key")
        token = jwt.encode(payload, secret, algorithm="HS256")
        
        client_ip = req.client.host if req.client else None
        
        token_hash = store_token(
            user_id=request.user_id,
            token=token,
            device_info=request.device_info,
            ip_address=client_ip,
            expiry_days=expiry_days
        )
        
        return TokenResponse(
            token=token,
            token_hash=token_hash,
            expires_in=expiry_days * 24 * 60 * 60
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/validate")
async def validate_token_endpoint(request: TokenValidateRequest):
    try:
        is_valid = validate_db_token(request.token)
        return {"valid": is_valid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(current_user: TokenData = Depends(get_current_user), req: Request = None):
    try:
        import jwt
        from datetime import datetime, timedelta
        import os
        
        expiry_days = int(os.environ.get("TOKEN_EXPIRY_DAYS", "7"))
        expires_at = datetime.utcnow() + timedelta(days=expiry_days)
        
        payload = {
            "sub": current_user.user_id,
            "email": current_user.email,
            "role": current_user.role,
            "iat": datetime.utcnow(),
            "exp": expires_at
        }
        
        secret = os.environ.get("JWT_SECRET", "your-jwt-secret-key")
        token = jwt.encode(payload, secret, algorithm="HS256")
        
        client_ip = req.client.host if req and req.client else None
        
        token_hash = store_token(
            user_id=current_user.user_id,
            token=token,
            ip_address=client_ip,
            expiry_days=expiry_days
        )
        
        return TokenResponse(
            token=token,
            token_hash=token_hash,
            expires_in=expiry_days * 24 * 60 * 60
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/revoke")
async def revoke_token_endpoint(request: TokenRevokeRequest, current_user: TokenData = Depends(get_current_user)):
    try:
        if request.revoke_all:
            count = revoke_all_user_tokens(current_user.user_id, request.reason)
            return {"success": True, "revoked_count": count}
        elif request.token:
            success = revoke_token(request.token, request.reason)
            return {"success": success}
        else:
            raise HTTPException(status_code=400, detail="Either token or revoke_all must be specified")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/tokens")
async def get_user_sessions(current_user: TokenData = Depends(get_current_user)):
    try:
        tokens = get_user_tokens(current_user.user_id)
        return {"tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/cleanup")
async def cleanup_tokens():
    try:
        count = cleanup_expired_tokens()
        return {"success": True, "cleaned_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
