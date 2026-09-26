
import { GoogleGenAI, Chat, Type, Part, Modality } from "@google/genai";
import { GEMINI_MODEL_TEXT, GEMINI_MODEL_VISION } from '../constants';
import { SoilData, SoilAnalysisReport, PlantAnalysisReport, MarketAnalysisReport, SoilImageAnalysisReport, Language } from '../types';
import { BHOOMI_SYSTEM_PROMPT } from './bhoomiPrompt';

const getGeminiKey = (): string => {
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (typeof process !== 'undefined' ? process.env.API_KEY || process.env.GEMINI_API_KEY : '') || 
         '';
};

const ai = new GoogleGenAI({ 
  apiKey: getGeminiKey(),
  apiVersion: 'v1beta'
});

export const getBhoomiResponseStream = async (
  history: (ChatMessage | { role: 'user' | 'model'; text?: string; parts?: { text: string }[] })[],
  currentLanguage: Language,
  user?: UserProfile
) => {
  if (!getGeminiKey()) {
    throw new Error("API_KEY_MISSING");
  }

  // 1. Context Trimming: keep last 10 messages to avoid latency buildup
  const trimmedHistory = history.slice(-10);

  // 2. Format history for Google GenAI SDK
  const contents = trimmedHistory.map(msg => {
    let msgText = '';
    if (Array.isArray((msg as any).parts) && (msg as any).parts.length > 0) {
      msgText = (msg as any).parts.map((p: any) => p.text).join('\n');
    } else if ((msg as any).text) {
      msgText = (msg as any).text;
    }
    return {
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msgText }]
    };
  });

  const isKn = currentLanguage === Language.KN;
  const langRule = isKn 
    ? "\n\nCRITICAL INSTRUCTION: The user is communicating in KANNADA (ಕನ್ನಡ). You MUST formulate your entire response in authentic, fluent Kannada script (ಕನ್ನಡ ಲಿಪಿ). Do NOT reply in English."
    : "\n\nCRITICAL INSTRUCTION: The user is communicating in ENGLISH. Formulate your entire response in English.";

  const dynamicSystemPrompt = BHOOMI_SYSTEM_PROMPT + langRule;

  // 3. Inject Golden Language Rule Tag to last user message
  const lastMsg = contents[contents.length - 1];
  if (lastMsg && lastMsg.role === 'user') {
    const langPrompt = isKn 
        ? "\n\n(System: Please reply to this message strictly in Kannada / ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ)" 
        : "\n\n(System: Please reply to this message strictly in English)";
    lastMsg.parts[0].text += langPrompt;
  }

  // 4. Create and return the stream
  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction: { parts: [{ text: dynamicSystemPrompt }] },
      temperature: 0.7,
    }
  });

  return responseStream;
};

/**
 * Gets soil analysis and crop recommendations from the Gemini API.
 * @param data The soil and climate data.
 * @param location The specific location data for the analysis.
 * @returns A structured soil analysis report.
 */
export const getSoilAnalysis = async (data: SoilData, location: { district: string; taluk: string; village: string; }): Promise<SoilAnalysisReport> => {
  if (!getGeminiKey()) {
    throw new Error("API_KEY_MISSING");
  }

  const systemInstruction = `You are an expert agronomist for Karnataka, India, acting as a predictive model. Your knowledge is based on comprehensive agricultural datasets (similar to those on Kaggle) covering soil types, climate, and crop yields across the region. Your task is to analyze soil, climate, and location data to provide a comprehensive report.
1.  Calculate an overall 'Soil Health Score' from 0 to 100 based on all parameters.
2.  Provide a brief 'Soil Health Summary'.
3.  For pH, provide a detailed analysis including its status ('Optimal', 'Adequate', 'Deficient', 'Surplus', 'Slightly Acidic', etc.), a concise textual analysis, and a realistic ideal range as a [min, max] array based on the location and common crops.
4.  Recommend the top 3-4 most suitable crops, ensuring they are hyper-localized for the specified village. For each, give a suitability score (0-100), a reason, and planting tips.`;

  const promptText = `Analyze the following conditions for ${location.village}, ${location.taluk}, ${location.district}, Karnataka:

- pH: ${data.ph}
- Temperature: ${data.temperature}°C
- Humidity: ${data.humidity}%
- Rainfall: ${data.rainfall} mm`;

  const nutrientDetailSchema = {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING, description: "The status of the nutrient (e.g., 'Optimal', 'Deficient')." },
      analysis: { type: Type.STRING, description: "A concise analysis of this nutrient's level." },
      idealRange: {
        type: Type.ARRAY,
        description: "The ideal numerical range [min, max] for this nutrient.",
        items: { type: Type.NUMBER },
      },
    },
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      soilHealthScore: {
        type: Type.NUMBER,
        description: "An overall soil health score from 0 to 100.",
      },
      soilHealthSummary: {
        type: Type.STRING,
        description: "A brief, overall summary of the soil's condition and health.",
      },
      nutrientAnalysis: {
        type: Type.OBJECT,
        description: "Detailed analysis for each key nutrient and pH level.",
        properties: {

          ph: nutrientDetailSchema,
        },
      },
      recommendations: {
        type: Type.ARRAY,
        description: "A list of recommended crops.",
        items: {
          type: Type.OBJECT,
          properties: {
            crop: { type: Type.STRING, description: "Name of the recommended crop." },
            reason: { type: Type.STRING, description: "Why this crop is suitable for the given conditions and location." },
            suitabilityScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating suitability." },
            plantingTips: { type: Type.STRING, description: "Practical tips for planting or managing this crop." },
          },
        },
      },
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as SoilAnalysisReport;

  } catch (e) {
    console.error("Error in getSoilAnalysis service:", e);
    throw new Error(`Failed to get analysis: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

/**
 * Gets plant disease analysis from an image using the Gemini API.
 * @param base64Image The base64-encoded image data.
 * @param imageMimeType The MIME type of the image.
 * @returns A structured plant analysis report with English and Kannada text.
 */
export const getPlantDiseaseAnalysis = async (base64Image: string, imageMimeType: string): Promise<PlantAnalysisReport> => {
  if (!getGeminiKey()) {
    throw new Error("API_KEY_MISSING");
  }

  // Try Python ML API first
  try {
    const { getPythonPlantDiseaseAnalysis } = await import('./pythonPlantService');

    console.log('🐍 Attempting Python ML analysis...');

    // Convert base64 to File object
    const byteString = atob(base64Image);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: imageMimeType });
    const file = new File([blob], 'plant_image.jpg', { type: imageMimeType });

    // Get prediction from Python API
    const pythonResult = await getPythonPlantDiseaseAnalysis(file);
    console.log('✅ Python ML analysis complete:', pythonResult.disease_name);

    // Now use Gemini to generate the detailed explanation and advice based on this result
    console.log('🤖 Asking Gemini for detailed insights on:', pythonResult.disease_name);

    try {
      const systemInstruction = `You are an expert plant pathologist. A deep learning model has identified a plant disease. Your task is to provide a detailed, bilingual (English and Kannada) report explaining this disease, its symptoms, and how to treat it.
      
      Input Data from Model:
      - Disease: ${pythonResult.disease_name}
      - Crop: ${pythonResult.crop}
      - Confidence: ${pythonResult.confidence}
      - Severity: ${pythonResult.severity}
      - Is Healthy: ${pythonResult.is_healthy}
  
      Strictly follow the JSON schema. Ensure 'medicineName' and 'usageInstructions' are specific to this disease.
      If the plant is healthy, provide care tips for maintaining health.`;

      const prompt = `Generate a detailed report for ${pythonResult.disease_name} on ${pythonResult.crop}.`;

      const localizedTextSchema = {
        type: Type.OBJECT,
        properties: {
          en: { type: Type.STRING },
          kn: { type: Type.STRING }
        },
        required: ["en", "kn"]
      };

      const localizedStringArraySchema = {
        type: Type.OBJECT,
        properties: {
          en: { type: Type.ARRAY, items: { type: Type.STRING } },
          kn: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["en", "kn"]
      };

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          description: localizedTextSchema,
          symptoms: localizedStringArraySchema,
          prevention: localizedStringArraySchema,
          treatment: {
            type: Type.OBJECT,
            properties: {
              medicineName: localizedTextSchema,
              usageInstructions: localizedStringArraySchema
            }
          },
          affectedAreaPercentage: { type: Type.NUMBER },
          riskFactors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                factor: localizedTextSchema,
                value: { type: Type.NUMBER }
              }
            }
          }
        },
      };

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.4,
        },
      });

      const geminiData = JSON.parse(response.text.trim());

      // Merge Python Result (Truth) with Gemini Insights (Explanation)
      return {
        isDiseaseFound: !pythonResult.is_healthy,
        diseaseName: {
          en: pythonResult.disease_name,
          kn: pythonResult.disease_name // Ideally we'd get a translation, but the model name is standard
        },
        confidenceScore: pythonResult.confidence,
        severity: {
          en: pythonResult.severity,
          kn: pythonResult.severity === 'High' ? 'ಹೆಚ್ಚು' : pythonResult.severity === 'Moderate' ? 'ಮಧ್ಯಮ' : 'ಕಡಿಮೆ'
        },
        description: geminiData.description,
        symptoms: geminiData.symptoms,
        prevention: geminiData.prevention,
        treatment: geminiData.treatment,
        topDetections: pythonResult.top_predictions.map(p => ({
          disease: { en: p.disease_class, kn: p.disease_class },
          confidence: p.confidence
        })),
        affectedAreaPercentage: geminiData.affectedAreaPercentage || (pythonResult.severity === 'High' ? 75 : 30),
        riskFactors: geminiData.riskFactors
      };
    } catch (geminiError) {
      console.warn('⚠️ Gemini detailed analysis failed, falling back to basic Python report:', geminiError);
      // Fallback to basic report from Python result
      const { convertToPlantAnalysisReport } = await import('./pythonPlantService');
      return convertToPlantAnalysisReport(pythonResult);
    }

  } catch (error) {
    console.warn('⚠️ Python API unavailable or failed, falling back to Gemini Vision:', error);
    // Fallback to pure Gemini Vision (existing logic)
  }

  // Fallback to Gemini AI (Vision)
  console.log('🤖 Using Gemini AI Vision for full analysis');

  const systemInstruction = `You are a world-class AI plant pathologist and agricultural diagnostic specialist. You must analyze the provided image with extreme clinical precision.

CRITICAL FIRST CHECKS:
1. **Plant Verification ('isValidPlant')**:
   - Check if the image contains an actual plant, crop, leaf, stem, flower, fruit, or agricultural produce.
   - If the image is a landscape, mountain, building, road, person, animal, vehicle, abstract graphic, indoor furniture, or non-plant object:
     Set 'isValidPlant' to false, 'isDiseaseFound' to false, 'confidenceScore' to 0, 'cropName' to { "en": "Non-Plant Image", "kn": "ಸಸ್ಯವಲ್ಲದ ಚಿತ್ರ" }, 'diseaseName' to { "en": "Invalid Subject", "kn": "ಅಮಾನ್ಯ ವಿಷಯ" }, and set 'validationMessage' to { "en": "The uploaded image does not appear to contain a crop or plant leaf. Please upload a clear photo of a plant leaf or crop.", "kn": "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಚಿತ್ರದಲ್ಲಿ ಯಾವುದೇ ಬೆಳೆ ಅಥವಾ ಸಸ್ಯದ ಎಲೆ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೆಳೆಯ ಎಲೆಯ ಸ್ಪಷ್ಟ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ." }.
2. **Image Quality & Blur Check ('isBlurry')**:
   - If the image is too blurry, heavily out of focus, or dark to diagnose:
     Set 'isBlurry' to true, 'confidenceScore' to 0, and set 'validationMessage' to { "en": "The image is too blurry or out of focus for accurate diagnosis. Please take a sharper, focused photo of the affected leaf.", "kn": "ರೋಗವನ್ನು ನಿಖರವಾಗಿ ಪತ್ತೆಹಚ್ಚಲು ಚಿತ್ರವು ತುಂಬಾ ಮಸುಕಾಗಿದೆ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟ ಮತ್ತು ಫೋಕಸ್ ಮಾಡಿದ ಫೋಟೋ ತೆಗೆಯಿರಿ." }.
3. **Crop & Pathological Classification**:
   - Identify the exact crop name (e.g. Tomato, Cotton, Potato, Apple, Rose, Rice, Wheat, Pepper, Grape, Corn, Citrus, etc.).
   - Classify if there is an active pathological disease (fungal, bacterial, viral, nutrient deficiency, insect infestation) or if the plant is completely healthy.
   - If healthy: Set 'isDiseaseFound' to false, 'diseaseName' to { "en": "Healthy Plant", "kn": "ಆರೋಗ್ಯಕರ ಸಸ್ಯ" }.
   - In 'description': Provide an authoritative, technical yet clear pathological diagnosis explanation (e.g. "Based on a deep learning analysis of visual patterns such as leaf discoloration and lesion texture, the model identifies features consistent with Black Spot...").
4. **DYNAMIC & DISEASE-SPECIFIC Organic Remedies**:
   - DO NOT give a generic fallback! Remedies must be specific to the identified condition:
     - For fungal leaf spots/blight: Bacillus subtilis, Trichoderma viride, Bordeaux mixture 1%, Copper soap, bio-compost tea.
     - For Powdery Mildew: Potassium bicarbonate (3g/L), diluted milk-water spray (1:9 ratio), wettable sulfur.
     - For Black Spot: Bio-fungicide Bacillus subtilis or baking soda (5g) + horticultural oil (5ml) in 1L water.
     - For Bacterial diseases: Pseudomonas fluorescens (10g/L), copper hydroxide, Streptomyces bio-antagonist.
     - For Pests/Mites: Beauveria bassiana, insecticidal potassium salts, yellow sticky traps.
     - For Healthy Plants: DO NOT prescribe pesticide or neem sprays! Instead provide organic plant nutrition and soil health advice (e.g., apply 2kg decomposed vermicompost per plant, organic straw mulching to conserve moisture, seaweed bio-stimulant foliar spray).
   - In 'treatment.organicSteps': Provide 2-3 specific, actionable steps tailored to this disease or healthy maintenance.
5. **Chemical Prescriptions**:
   - Provide the exact chemical molecule and trade name (e.g. Mancozeb 75% WP, Chlorothalonil, Hexaconazole, Azoxystrobin, Copper Oxychloride), with dilution ratio per liter of water and spray timing in 'usageInstructions'.
   - If healthy: 'medicineName' should be { "en": "No chemical treatment required", "kn": "ಯಾವುದೇ ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆಯ ಅಗತ್ಯವಿಲ್ಲ" }.
6. **Bilingual Requirement**:
   - Every localized text field MUST contain authentic English ('en') and natural, accurate Kannada ('kn' in Kannada script).`;

  const contents: Part[] = [
    { inlineData: { mimeType: imageMimeType, data: base64Image } },
    { text: "Analyze this image with clinical plant pathology standards. Check if it is a valid plant, check clarity, classify disease, and provide disease-specific organic and chemical protocols." },
  ];

  const localizedTextSchema = {
    type: Type.OBJECT,
    properties: {
      en: { type: Type.STRING },
      kn: { type: Type.STRING }
    },
    required: ["en", "kn"]
  };

  const localizedStringArraySchema = {
    type: Type.OBJECT,
    properties: {
      en: { type: Type.ARRAY, items: { type: Type.STRING } },
      kn: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["en", "kn"]
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      isValidPlant: { type: Type.BOOLEAN },
      isBlurry: { type: Type.BOOLEAN },
      validationMessage: localizedTextSchema,
      isDiseaseFound: { type: Type.BOOLEAN },
      cropName: localizedTextSchema,
      diseaseName: localizedTextSchema,
      confidenceScore: { type: Type.NUMBER },
      severity: localizedTextSchema,
      description: localizedTextSchema,
      symptoms: localizedStringArraySchema,
      prevention: localizedStringArraySchema,
      treatment: {
        type: Type.OBJECT,
        properties: {
          medicineName: localizedTextSchema,
          usageInstructions: localizedStringArraySchema,
          organicRemedy: localizedTextSchema,
          organicSteps: localizedStringArraySchema
        },
        required: ["medicineName", "usageInstructions", "organicRemedy", "organicSteps"]
      },
      topDetections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            disease: localizedTextSchema,
            confidence: { type: Type.NUMBER }
          }
        }
      },
      affectedAreaPercentage: { type: Type.NUMBER },
      riskFactors: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            factor: localizedTextSchema,
            value: { type: Type.NUMBER }
          }
        }
      }
    },
    required: ["isValidPlant", "isDiseaseFound", "diseaseName", "confidenceScore", "severity", "description", "symptoms", "prevention", "treatment"]
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_VISION,
      contents: [{ parts: contents }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as PlantAnalysisReport;

  } catch (e) {
    console.error("Error in getPlantDiseaseAnalysis service:", e);
    throw new Error("Failed to get analysis from AI. Please try again with a clearer image.");
  }
};

/**
 * Gets crop market price analysis from the Gemini API.
 * @param cropName The name of the crop to analyze.
 * @param marketName The primary market for analysis.
 * @returns A structured market analysis report.
 */
export const getMarketAnalysis = async (cropName: string, marketName: string): Promise<MarketAnalysisReport> => {
  if (!getGeminiKey()) {
    throw new Error("API_KEY_MISSING");
  }

  const systemInstruction = `You are an expert agricultural market analyst for Karnataka, India. Your task is to provide a detailed market price report for a specific crop and primary market. Generate realistic but synthetic data for this simulation.
1.  **Home Market Data**: Provide the min, max, and modal price per quintal for the specified crop in the home market.
2.  **Price Trend**: Generate a list of 30 daily price data points for the last month, showing a believable trend (e.g., seasonal fluctuations). The dates should be in "YYYY-MM-DD" format.
3.  **Comparison Markets**: Provide min, max, and modal prices for the same crop in 7 other major, geographically diverse Karnataka APMC markets. Include markets from different regions (e.g., North, South, Coastal) to provide a comprehensive state-wide comparison.
4.  **Market Insight**: Write a concise, actionable insight (2-3 sentences) summarizing the current market situation, suggesting whether it's a good time to sell, and mentioning any key factors influencing the price.`;

  const promptText = `Generate a market analysis report for ${cropName} in the ${marketName} market.`;

  const marketPriceSchema = {
    type: Type.OBJECT,
    properties: {
      marketName: { type: Type.STRING },
      minPrice: { type: Type.NUMBER },
      maxPrice: { type: Type.NUMBER },
      modalPrice: { type: Type.NUMBER },
    },
    required: ["marketName", "minPrice", "maxPrice", "modalPrice"]
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      cropName: { type: Type.STRING },
      homeMarket: marketPriceSchema,
      priceTrend: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            price: { type: Type.NUMBER },
          },
          required: ["date", "price"]
        }
      },
      comparisonMarkets: {
        type: Type.ARRAY,
        items: marketPriceSchema
      },
      marketInsight: { type: Type.STRING }
    },
    required: ["cropName", "homeMarket", "priceTrend", "comparisonMarkets", "marketInsight"]
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as MarketAnalysisReport;

  } catch (e) {
    console.error("Error in getMarketAnalysis service:", e);
    throw new Error("Failed to get market analysis from AI. Please try again.");
  }
};

/**
 * Gets a qualitative soil analysis from an image using the Gemini API.
 * @param base64Image The base64-encoded image data.
 * @param imageMimeType The MIME type of the image.
 * @returns A structured soil image analysis report.
 */
export const getSoilAnalysisFromImage = async (base64Image: string, imageMimeType: string): Promise<SoilImageAnalysisReport> => {
  if (!getGeminiKey()) {
    throw new Error("API_KEY_MISSING");
  }

  const systemInstruction = `You are an expert soil scientist specializing in visual analysis of soil images. Your task is to analyze the provided image of a soil sample and generate a qualitative report.

    **Strict Rules:**
    1.  **DO NOT ESTIMATE OR GUESS NUMERICAL VALUES.** You cannot determine exact nutrient levels (N, P, K), pH, or contamination from a standard photo. State this limitation clearly.
    2.  Your analysis must be based *only* on visual cues present in the image.
    3.  Follow the JSON schema precisely.

    **Analysis Checklist:**
    - **Soil Color:** Describe the color (e.g., "Dark Brown", "Reddish-Brown") and interpret what it likely means for organic matter or mineral content.
    - **Visual Texture:** Estimate the dominant soil texture (Sandy, Loamy, Clay, Silty, Mixed) based on visual graininess, smoothness, or clumping. Provide a confidence score (0-1).
    - **Moisture Level:** Assess if the soil appears Dry, Moist, or Wet based on its color darkness and reflectivity. Provide a confidence score (0-1).
    - **Organic Matter:** Based primarily on color (darker = higher), estimate if the organic matter content is Low, Medium, or High.
    - **Surface Features:** Identify and describe any visible features like stones, cracks, compaction, or signs of erosion.
    - **Overall Assessment:** Provide a concise summary of your findings.
    - **Limitations:** Explicitly list the key limitations of image-based analysis, such as "Exact nutrient levels (N, P, K) cannot be determined." and "Soil pH requires a lab test."`;

  const contents: Part[] = [
    { inlineData: { mimeType: imageMimeType, data: base64Image } },
    { text: "Analyze this soil image according to your system instructions and provide a structured JSON report." },
  ];

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      soilColor: {
        type: Type.OBJECT,
        properties: {
          colorName: { type: Type.STRING },
          interpretation: { type: Type.STRING },
        },
      },
      visualTexture: {
        type: Type.OBJECT,
        properties: {
          dominantType: { type: Type.STRING, enum: ['Sandy', 'Loamy', 'Clay', 'Silty', 'Mixed'] },
          confidence: { type: Type.NUMBER },
          description: { type: Type.STRING },
        },
      },
      moistureLevel: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, enum: ['Dry', 'Moist', 'Wet'] },
          confidence: { type: Type.NUMBER },
          description: { type: Type.STRING },
        },
      },
      organicMatterEstimate: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
          description: { type: Type.STRING },
        },
      },
      surfaceFeatures: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            feature: { type: Type.STRING },
            description: { type: Type.STRING },
          },
        },
      },
      overallAssessment: { type: Type.STRING },
      limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_VISION,
      contents: [{ parts: contents }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as SoilImageAnalysisReport;

  } catch (e) {
    console.error("Error in getSoilAnalysisFromImage service:", e);
    throw new Error("Failed to get soil analysis from image. Please try again with a clearer image.");
  }
};

/**
 * Estimates a price for a crop based on location, quantity, and weather.
 */
export const getPriceEstimate = async (
  cropName: string,
  category: string,
  quantity: number,
  location: string,
  marketName: string,
  weatherSummary: string
): Promise<{ min: number, max: number }> => {
  if (!getGeminiKey()) throw new Error("API_KEY_MISSING");

  const systemInstruction = `You are an AI agricultural economist specializing in the Karnataka market. Estimate the price range (min and max) in Indian Rupees (₹) per Quintal for a given crop sale request.
    Consider:
    1. Crop Category & Name.
    2. Location & Specific Market (APMC).
    3. Current Weather conditions (which affect supply/demand).
    4. Quantity (Bulk orders might have slightly lower per-unit rates, or higher if demand is high).
    
    Return ONLY a JSON object with 'min' and 'max' numbers.`;

  const prompt = `Estimate price for:
    Crop: ${cropName} (${category})
    Quantity: ${quantity} Quintals
    Location: ${location}
    Market: ${marketName}
    Weather Context: ${weatherSummary}`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      min: { type: Type.NUMBER },
      max: { type: Type.NUMBER }
    },
    required: ["min", "max"]
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Error in getPriceEstimate:", e);
    // Fallback estimate
    return { min: 2000, max: 3500 };
  }
}

/**
 * Generates speech audio from text using the Gemini TTS model.
 * @param text The text to speak.
 * @returns A base64 encoded string of the audio data.
 */
export const generateSpeech = async (text: string, language: Language = Language.EN): Promise<string | undefined> => {
  if (!getGeminiKey()) {
    throw new Error("API_KEY_MISSING");
  }

  // Use the high-fidelity Gemini 2.5 Flash TTS model
  const model = 'gemini-2.5-flash-preview-tts';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // Return the base64 audio data directly from the response
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error("Error generating speech with Gemini:", e);
    return undefined;
  }
};

/**
 * Speaks the exact diagnostic explanation text that appears on the screen using Google AI Studio Gemini TTS.
 */
export const generateDiseaseExplanationAudio = async (
  report: PlantAnalysisReport,
  language: Language
): Promise<string | undefined> => {
  if (!getGeminiKey()) {
    throw new Error("API_KEY_MISSING");
  }

  const isKn = language === Language.KN;
  // Use the exact description text that was output by the model and displayed on screen
  const exactDescription = isKn
    ? (report.description?.kn || report.description?.en || '')
    : (report.description?.en || report.description?.kn || '');

  if (!exactDescription.trim()) return undefined;

  return generateSpeech(exactDescription.trim(), language);
};
