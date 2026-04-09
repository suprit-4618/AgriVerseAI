# AgriVerseAI - System Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Plant Disease Analysis Module](#plant-disease-analysis-module)
3. [Soil Analysis Module](#soil-analysis-module)
4. [Crop Marketplace (Sell) Module](#crop-marketplace-module)
5. [Weather Module](#weather-module)
6. [ML Model Training Architecture](#ml-model-training-architecture)

---

## System Overview

AgriVerseAI is a comprehensive AI-powered agricultural platform designed for farmers in Karnataka, India. The system provides bilingual support (English and Kannada) and integrates multiple AI/ML services for plant disease detection, soil analysis, market price prediction, and weather forecasting.

### High-Level System Architecture

```mermaid
flowchart TB
    subgraph "Frontend Layer"
        UI["React + TypeScript UI"]
        Vite["Vite Dev Server"]
    end
    
    subgraph "AI Services"
        Gemini["Google Gemini API"]
        PyML["Python ML API"]
    end
    
    subgraph "Backend Layer"
        FastAPI["FastAPI Server"]
        MLModels["ML Models"]
    end
    
    subgraph "External APIs"
        Weather["Open-Meteo API"]
        Market["Market Data API"]
    end
    
    UI --> Vite
    Vite --> Gemini
    Vite --> PyML
    Vite --> Weather
    FastAPI --> MLModels
    PyML --> FastAPI
    
    style Gemini fill:#4285F4,color:#fff
    style FastAPI fill:#009688,color:#fff
    style UI fill:#61DAFB,color:#000
```

---

## Plant Disease Analysis Module

### Overview
The Plant Disease Analysis module uses a hybrid AI approach combining a local Python ML model for fast initial detection and Google Gemini Vision for detailed bilingual explanations.

### Architecture Diagram

```mermaid
flowchart TD
    subgraph "User Interface"
        A["📷 User Uploads/Captures Image"]
        B["Image Preview & Validation"]
    end
    
    subgraph "Frontend Processing"
        C["Base64 Encoding"]
        D["geminiService.ts"]
    end
    
    subgraph "Primary Analysis - Python ML"
        E["pythonPlantService.ts"]
        F["FastAPI /predict Endpoint"]
        G["PyTorch CNN Model"]
        H["Disease Classification"]
    end
    
    subgraph "Secondary Analysis - Gemini AI"
        I["Gemini Vision API"]
        J["Bilingual Response Generation"]
        K["Treatment Recommendations"]
    end
    
    subgraph "Response Processing"
        L["PlantAnalysisReport"]
        M["UI Dashboard Display"]
        N["TTS Voice Output"]
    end
    
    A --> B --> C --> D
    D --> E --> F --> G --> H
    H -->|"Disease Detected"| I
    H -->|"Fallback if ML fails"| I
    I --> J --> K
    K --> L --> M
    L --> N
    
    style A fill:#4CAF50,color:#fff
    style G fill:#FF6B6B,color:#fff
    style I fill:#4285F4,color:#fff
```

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant PythonAPI
    participant MLModel
    participant GeminiAPI
    
    User->>Frontend: Upload Plant Image
    Frontend->>Frontend: Convert to Base64
    Frontend->>PythonAPI: POST /predict (image)
    PythonAPI->>MLModel: Run Inference
    MLModel-->>PythonAPI: Disease Label + Confidence
    PythonAPI-->>Frontend: ML Prediction Result
    
    Frontend->>GeminiAPI: Request Detailed Analysis
    Note over GeminiAPI: Generate bilingual<br/>treatment plan
    GeminiAPI-->>Frontend: Detailed Report (EN/KN)
    
    Frontend-->>User: Display Analysis Dashboard
    Frontend-->>User: Voice Output (TTS)
```

### PlantAnalysisReport Schema

```typescript
interface PlantAnalysisReport {
    isDiseaseFound: boolean;
    diseaseName: { en: string; kn: string };
    confidence: number;
    description: { en: string; kn: string };
    severity: { en: string; kn: string };
    symptoms: { en: string[]; kn: string[] };
    prevention: { en: string[]; kn: string[] };
    treatment: { en: string[]; kn: string[] };
    medicineName: { en: string; kn: string };
    medicineUsage: { en: string; kn: string };
}
```

---

## Soil Analysis Module

### Overview
The Soil Analysis module provides real-time crop recommendations based on soil parameters (N, P, K, pH) and climate conditions (temperature, rainfall) specific to Karnataka districts.

### Architecture Diagram

```mermaid
flowchart TD
    subgraph "User Input"
        A["🧪 Soil Parameters Input"]
        B["📍 Location Selection"]
        C["🌡️ Climate Data"]
    end
    
    subgraph "Input Parameters"
        D["Nitrogen (N): 0-140 kg/ha"]
        E["Phosphorus (P): 0-145 kg/ha"]
        F["Potassium (K): 0-205 kg/ha"]
        G["pH Level: 0-14"]
        H["Temperature: 0-50°C"]
        I["Rainfall: 0-300 mm"]
    end
    
    subgraph "AI Analysis Engine"
        J["geminiService.ts"]
        K["Gemini AI Model"]
        L["Crop Suitability Algorithm"]
    end
    
    subgraph "Output Generation"
        M["Soil Health Score"]
        N["Nutrient Analysis"]
        O["Top 3 Crop Recommendations"]
        P["Planting Tips"]
    end
    
    subgraph "Display"
        Q["SoilAnalysisReport UI"]
        R["Interactive Charts"]
    end
    
    A --> D & E & F & G
    B --> H & I
    C --> H & I
    D & E & F & G & H & I --> J
    J --> K --> L
    L --> M & N & O & P
    M & N & O & P --> Q --> R
    
    style A fill:#8B4513,color:#fff
    style K fill:#4285F4,color:#fff
    style M fill:#4CAF50,color:#fff
```

### Analysis Flow

```mermaid
sequenceDiagram
    participant User
    participant SoilAnalysis as Soil Analysis UI
    participant GeminiAPI as Gemini AI
    participant Charts as Chart Display
    
    User->>SoilAnalysis: Input Soil Parameters
    User->>SoilAnalysis: Select District/Taluk
    SoilAnalysis->>SoilAnalysis: Validate Input Ranges
    
    SoilAnalysis->>GeminiAPI: Send Analysis Request
    Note over GeminiAPI: Process soil data<br/>Compare with ideal ranges<br/>Calculate suitability scores
    
    GeminiAPI-->>SoilAnalysis: SoilAnalysisReport JSON
    
    SoilAnalysis->>Charts: Render Health Score
    SoilAnalysis->>Charts: Render Nutrient Bars
    SoilAnalysis->>Charts: Display Crop Cards
    
    Charts-->>User: Interactive Dashboard
```

### SoilAnalysisReport Schema

```typescript
interface SoilAnalysisReport {
    overallHealthScore: number; // 0-100
    healthSummary: { en: string; kn: string };
    nutrientAnalysis: {
        nitrogen: { level: string; status: string };
        phosphorus: { level: string; status: string };
        potassium: { level: string; status: string };
        ph: { level: string; status: string };
    };
    cropRecommendations: Array<{
        name: { en: string; kn: string };
        suitabilityScore: number;
        plantingTips: { en: string; kn: string };
        expectedYield: string;
    }>;
}
```

---

## Crop Marketplace Module

### Overview
The Crop Marketplace provides real-time price analysis across Karnataka's APMC markets, enabling farmers to make informed selling decisions.

### Architecture Diagram

```mermaid
flowchart TD
    subgraph "Market Selection"
        A["🏪 Select APMC Market"]
        B["🌾 Select Crop Type"]
        C["📊 Set Quantity"]
    end
    
    subgraph "Data Sources"
        D["Karnataka APMC Data"]
        E["Historical Price Database"]
        F["Weather Correlation Data"]
    end
    
    subgraph "AI Analysis Engine"
        G["geminiService.ts"]
        H["Gemini AI Analysis"]
        I["Price Prediction Model"]
    end
    
    subgraph "Market Intelligence"
        J["Current Price (Min/Max/Modal)"]
        K["30-Day Price Trend"]
        L["Market Comparison"]
        M["Best Market Recommendation"]
    end
    
    subgraph "Seller Tools"
        N["Price Estimator"]
        O["Quality Assessment"]
        P["Estimated Value Calculator"]
    end
    
    A & B --> G
    D & E & F --> H
    G --> H --> I
    I --> J & K & L & M
    C --> N
    N --> O --> P
    
    style A fill:#FF9800,color:#fff
    style H fill:#4285F4,color:#fff
    style M fill:#4CAF50,color:#fff
```

### Price Analysis Flow

```mermaid
sequenceDiagram
    participant Farmer
    participant Marketplace as Marketplace UI
    participant GeminiAPI as Gemini AI
    participant PriceDB as Price Database
    
    Farmer->>Marketplace: Select Market & Crop
    Marketplace->>GeminiAPI: Request Price Analysis
    
    GeminiAPI->>PriceDB: Fetch Historical Data
    PriceDB-->>GeminiAPI: Price Trends
    
    Note over GeminiAPI: Analyze trends<br/>Compare markets<br/>Generate insights
    
    GeminiAPI-->>Marketplace: MarketAnalysisReport
    
    Marketplace-->>Farmer: Display Price Charts
    Marketplace-->>Farmer: Show Best Market
    
    Farmer->>Marketplace: Enter Quantity & Quality
    Marketplace->>Marketplace: Calculate Estimated Value
    Marketplace-->>Farmer: Show Sale Recommendation
```

### MarketAnalysisReport Schema

```typescript
interface MarketAnalysisReport {
    crop: string;
    market: string;
    currentPrices: {
        minPrice: number;
        maxPrice: number;
        modalPrice: number;
    };
    priceTrend: Array<{ date: string; price: number }>;
    marketComparison: Array<{
        marketName: string;
        price: number;
        distance: string;
    }>;
    aiInsight: { en: string; kn: string };
    bestMarketToSell: string;
    priceEstimate: {
        quantity: number;
        quality: string;
        estimatedValue: number;
    };
}
```

---

## Weather Module

### Overview
The Weather module provides hyperlocal weather forecasts for all 31 Karnataka districts using the Open-Meteo API, with agricultural-specific insights.

### Architecture Diagram

```mermaid
flowchart TD
    subgraph "Location Input"
        A["📍 District Selection"]
        B["GPS Coordinates"]
    end
    
    subgraph "External Weather API"
        C["Open-Meteo API"]
        D["Current Weather Data"]
        E["Hourly Forecast"]
        F["7-Day Forecast"]
        G["Air Quality Index"]
    end
    
    subgraph "Data Processing"
        H["weatherService.ts"]
        I["Temperature Conversion"]
        J["Weather Code Mapping"]
        K["AQI Classification"]
    end
    
    subgraph "Agricultural Insights"
        L["Farming Recommendations"]
        M["Irrigation Alerts"]
        N["Pest Risk Assessment"]
    end
    
    subgraph "Display Components"
        O["Current Weather Card"]
        P["Hourly Chart"]
        Q["7-Day Forecast Grid"]
        R["AQI & UV Display"]
    end
    
    A --> B --> C
    C --> D & E & F & G
    D & E & F & G --> H
    H --> I & J & K
    I & J & K --> L & M & N
    L & M & N --> O & P & Q & R
    
    style C fill:#2196F3,color:#fff
    style H fill:#009688,color:#fff
    style L fill:#4CAF50,color:#fff
```

### Weather Data Flow

```mermaid
sequenceDiagram
    participant User
    participant WeatherUI as Weather Component
    participant Service as weatherService.ts
    participant OpenMeteo as Open-Meteo API
    
    User->>WeatherUI: Select District
    WeatherUI->>Service: getWeatherData(lat, lon)
    
    Service->>OpenMeteo: GET /forecast?params
    Note over OpenMeteo: Fetch current,<br/>hourly, daily data
    OpenMeteo-->>Service: Weather JSON Response
    
    Service->>Service: Parse & Transform Data
    Service->>Service: Map Weather Codes
    Service->>Service: Calculate AQI Level
    
    Service-->>WeatherUI: WeatherData Object
    
    WeatherUI-->>User: Display Weather Dashboard
    WeatherUI-->>User: Show Farming Recommendations
```

### Karnataka Districts Coverage

```mermaid
graph LR
    subgraph "North Karnataka"
        A["Bagalkote"]
        B["Belagavi"]
        C["Bidar"]
        D["Kalaburagi"]
        E["Vijayapura"]
    end
    
    subgraph "Central Karnataka"
        F["Ballari"]
        G["Chitradurga"]
        H["Davanagere"]
        I["Haveri"]
        J["Shivamogga"]
    end
    
    subgraph "South Karnataka"
        K["Bengaluru"]
        L["Mysuru"]
        M["Mandya"]
        N["Tumakuru"]
        O["Kolar"]
    end
    
    subgraph "Coastal Karnataka"
        P["Dakshina Kannada"]
        Q["Udupi"]
        R["Uttara Kannada"]
    end
    
    style A fill:#FFC107,color:#000
    style K fill:#4CAF50,color:#fff
    style P fill:#2196F3,color:#fff
```

---

## ML Model Training Architecture

### Overview
The ML pipeline for plant disease detection uses PyTorch with a CNN architecture (ResNet-based) trained on agricultural disease datasets.

### Training Pipeline Architecture

```mermaid
flowchart TD
    subgraph "Data Collection"
        A["🌿 Plant Disease Images"]
        B["Data Augmentation"]
        C["Train/Val/Test Split"]
    end
    
    subgraph "Preprocessing"
        D["Image Resizing (224x224)"]
        E["Normalization"]
        F["Data Loaders"]
    end
    
    subgraph "Model Architecture"
        G["Base Model: ResNet18/34"]
        H["Feature Extraction Layers"]
        I["Custom Classifier Head"]
        J["Softmax Output"]
    end
    
    subgraph "Training Loop"
        K["Loss: CrossEntropyLoss"]
        L["Optimizer: Adam"]
        M["Learning Rate Scheduler"]
        N["Early Stopping"]
    end
    
    subgraph "Evaluation"
        O["Accuracy Metrics"]
        P["Confusion Matrix"]
        Q["Per-Class F1 Scores"]
    end
    
    subgraph "Deployment"
        R["Model Export (.pth)"]
        S["FastAPI Serving"]
        T["GPU/CPU Inference"]
    end
    
    A --> B --> C
    C --> D --> E --> F
    F --> G --> H --> I --> J
    J --> K --> L --> M --> N
    N --> O --> P --> Q
    Q --> R --> S --> T
    
    style G fill:#EE4C2C,color:#fff
    style S fill:#009688,color:#fff
```

### Model Architecture Detail

```mermaid
flowchart LR
    subgraph "Input"
        A["RGB Image<br/>224 x 224 x 3"]
    end
    
    subgraph "ResNet Backbone"
        B["Conv1 + BN + ReLU"]
        C["MaxPool"]
        D["Layer1 (64 filters)"]
        E["Layer2 (128 filters)"]
        F["Layer3 (256 filters)"]
        G["Layer4 (512 filters)"]
    end
    
    subgraph "Classifier"
        H["Global Avg Pool"]
        I["FC: 512 → 256"]
        J["ReLU + Dropout"]
        K["FC: 256 → N_classes"]
        L["Softmax"]
    end
    
    subgraph "Output"
        M["Disease Probabilities"]
        N["Top-1 Prediction"]
    end
    
    A --> B --> C --> D --> E --> F --> G
    G --> H --> I --> J --> K --> L
    L --> M --> N
    
    style A fill:#9C27B0,color:#fff
    style G fill:#EE4C2C,color:#fff
    style N fill:#4CAF50,color:#fff
```

### Training Configuration

```python
# Model Configuration
CONFIG = {
    "model": {
        "backbone": "resnet18",
        "pretrained": True,
        "num_classes": 38,  # PlantVillage dataset
        "dropout": 0.5
    },
    "training": {
        "batch_size": 32,
        "epochs": 50,
        "learning_rate": 0.001,
        "weight_decay": 1e-4,
        "early_stopping_patience": 10
    },
    "augmentation": {
        "random_horizontal_flip": True,
        "random_rotation": 15,
        "color_jitter": 0.2,
        "random_crop": 224
    },
    "data": {
        "train_split": 0.7,
        "val_split": 0.15,
        "test_split": 0.15
    }
}
```

### Inference Pipeline

```mermaid
sequenceDiagram
    participant Client
    participant FastAPI as FastAPI Server
    participant PreProcess as Preprocessor
    participant Model as PyTorch Model
    participant PostProcess as Postprocessor
    
    Client->>FastAPI: POST /predict (image)
    FastAPI->>PreProcess: Decode & Resize Image
    PreProcess->>PreProcess: Normalize (ImageNet stats)
    PreProcess->>Model: Tensor Input
    
    Note over Model: GPU/CPU Inference<br/>Forward Pass
    
    Model-->>PostProcess: Raw Logits
    PostProcess->>PostProcess: Softmax
    PostProcess->>PostProcess: Get Top-K Classes
    
    PostProcess-->>FastAPI: Prediction Result
    FastAPI-->>Client: JSON Response
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + TypeScript | UI Components |
| **Styling** | TailwindCSS | Responsive Design |
| **Build Tool** | Vite | Fast Development |
| **Animation** | Framer Motion | Smooth Transitions |
| **AI/Chat** | Google Gemini API | Text & Vision AI |
| **TTS** | Web Speech API | Voice Output |
| **Backend** | FastAPI (Python) | ML API Server |
| **ML Framework** | PyTorch | Model Training |
| **Weather API** | Open-Meteo | Weather Data |
| **Database** | Supabase | Authentication |

---

## File Structure

```
d:\app\
├── frontend/
│   ├── components/
│   │   ├── BhoomiAssistant.tsx      # Main AI Chat
│   │   ├── PlantAnalysisResult.tsx  # Disease Display
│   │   ├── SoilAnalysis.tsx         # Soil Analysis UI
│   │   ├── Marketplace.tsx          # Crop Selling
│   │   └── WeatherDisplay.tsx       # Weather Module
│   ├── services/
│   │   ├── geminiService.ts         # Gemini AI Integration
│   │   ├── pythonPlantService.ts    # Python ML API
│   │   └── weatherService.ts        # Weather API
│   └── types.ts                     # TypeScript Types
│
├── backend/
│   ├── api.py                       # FastAPI Endpoints
│   ├── model.py                     # PyTorch Model
│   └── utils/
│       └── predictor.py             # Inference Logic
│
└── run_app.py                       # Application Launcher
```

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Plant disease prediction |
| `/health` | GET | API health check |
| `/models` | GET | Available ML models |

---

*Documentation generated for AgriVerseAI Platform*
*Last Updated: January 2026*
