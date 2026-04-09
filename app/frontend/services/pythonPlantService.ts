/**
 * Python-based plant disease analysis service
 * Integrates with the FastAPI backend for ML-based predictions
 */

const PYTHON_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PythonPredictionResult {
    disease_name: string;
    confidence: number;
    severity: string;
    crop: string;
    is_healthy: boolean;
    top_predictions: Array<{
        disease_class: string;
        confidence: number;
    }>;
}

/**
 * Check if Python API is available
 */
export async function isPythonApiAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${PYTHON_API_URL}/`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        const data = await response.json();
        return data.status === 'online' && data.model_loaded === true;
    } catch (error) {
        console.warn('Python API not available:', error);
        return false;
    }
}

/**
 * Get plant disease analysis from Python ML model
 */
export async function getPythonPlantDiseaseAnalysis(
    imageFile: File
): Promise<PythonPredictionResult> {
    try {
        console.log(`🚀 Sending request to Python API at ${PYTHON_API_URL}/predict`);
        const formData = new FormData();
        formData.append('file', imageFile);
        console.log(`📁 File prepared: ${imageFile.name} (${imageFile.size} bytes)`);

        const response = await fetch(`${PYTHON_API_URL}/predict`, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(60000), // 60 second timeout
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Prediction failed');
        }

        const result: PythonPredictionResult = await response.json();
        return result;
    } catch (error: any) {
        console.error('Python API prediction error:', error);
        throw new Error(`Failed to analyze image: ${error.message}`);
    }
}

/**
 * Get all available disease classes
 */
export async function getAvailableClasses(): Promise<string[]> {
    try {
        const response = await fetch(`${PYTHON_API_URL}/classes`);
        const data = await response.json();
        return data.classes || [];
    } catch (error) {
        console.error('Failed to fetch classes:', error);
        return [];
    }
}

/**
 * Convert Python prediction to PlantAnalysisReport format
 * This allows seamless integration with existing UI components
 */
export function convertToPlantAnalysisReport(
    prediction: PythonPredictionResult,
    language: 'en' | 'kn' = 'en'
): any {
    const isHealthy = prediction.is_healthy;

    // Generate treatment recommendations based on disease
    // Generate treatment recommendations based on disease
    const getTreatment = (disease: string, severity: string) => {
        if (isHealthy) {
            return {
                medicineName: {
                    en: "None required",
                    kn: "ಯಾವುದೂ ಅಗತ್ಯವಿಲ್ಲ"
                },
                usageInstructions: {
                    en: ["Continue regular care and monitoring."],
                    kn: ["ನಿಯಮಿತ ಆರೈಕೆ ಮತ್ತು ಮೇಲ್ವಿಚಾರಣೆಯನ್ನು ಮುಂದುವರಿಸಿ."]
                }
            };
        }

        // Generic treatment based on severity
        if (severity === 'High') {
            return {
                medicineName: {
                    en: "Broad-spectrum Fungicide/Pesticide",
                    kn: "ವ್ಯಾಪಕ ಶ್ರೇಣಿಯ ಶಿಲೀಂಧ್ರನಾಶಕ/ಕೀಟನಾಶಕ"
                },
                usageInstructions: {
                    en: [
                        `Immediate action required for ${disease}.`,
                        "Remove affected leaves immediately.",
                        "Apply appropriate fungicide or pesticide.",
                        "Isolate plant if possible to prevent spread."
                    ],
                    kn: [
                        `${disease} ಗಾಗಿ ತಕ್ಷಣದ ಕ್ರಮ ಅಗತ್ಯವಿದೆ.`,
                        "ಪೀಡಿತ ಎಲೆಗಳನ್ನು ತಕ್ಷಣ ತೆಗೆದುಹಾಕಿ.",
                        "ಸೂಕ್ತವಾದ ಶಿಲೀಂಧ್ರನಾಶಕ ಅಥವಾ ಕೀಟನಾಶಕವನ್ನು ಅನ್ವಯಿಸಿ.",
                        "ಹರಡುವುದನ್ನು ತಡೆಯಲು ಸಾಧ್ಯವಾದರೆ ಸಸ್ಯವನ್ನು ಪ್ರತ್ಯೇಕಿಸಿ."
                    ]
                }
            };
        } else if (severity === 'Moderate') {
            return {
                medicineName: {
                    en: "Organic Neem Oil / Copper Soap",
                    kn: "ಸಾವಯವ ಬೇವಿನ ಎಣ್ಣೆ / ತಾಮ್ರದ ಸಾಬೂನು"
                },
                usageInstructions: {
                    en: [
                        `Monitor ${disease} closely.`,
                        "Apply organic treatments like Neem oil.",
                        "Ensure proper plant hygiene and air circulation."
                    ],
                    kn: [
                        `${disease} ಅನ್ನು ನಿಕಟವಾಗಿ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.`,
                        "ಬೇವಿನ ಎಣ್ಣೆಯಂತಹ ಸಾವಯವ ಚಿಕಿತ್ಸೆಗಳನ್ನು ಅನ್ವಯಿಸಿ.",
                        "ಸರಿಯಾದ ಸಸ್ಯ ನೈರ್ಮಲ್ಯ ಮತ್ತು ಗಾಳಿ ಪರಿಚಲನೆಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ."
                    ]
                }
            };
        } else {
            return {
                medicineName: {
                    en: "Preventative Care",
                    kn: "ತಡೆಗಟ್ಟುವ ಆರೈಕೆ"
                },
                usageInstructions: {
                    en: [
                        `Early stage ${disease} detected.`,
                        "Improve air circulation.",
                        "Reduce humidity around the plant.",
                        "Avoid overhead watering."
                    ],
                    kn: [
                        `ಆರಂಭಿಕ ಹಂತದ ${disease} ಪತ್ತೆಯಾಗಿದೆ.`,
                        "ಗಾಳಿ ಪರಿಚಲನೆಯನ್ನು ಸುಧಾರಿಸಿ.",
                        "ಸಸ್ಯದ ಸುತ್ತಲೂ ತೇವಾಂಶವನ್ನು ಕಡಿಮೆ ಮಾಡಿ.",
                        "ಮೇಲಿನಿಂದ ನೀರುಹಾಕುವುದನ್ನು ತಪ್ಪಿಸಿ."
                    ]
                }
            };
        }
    };

    const treatment = getTreatment(prediction.disease_name, prediction.severity);

    return {
        isDiseaseFound: !isHealthy,
        diseaseName: {
            en: prediction.disease_name,
            kn: prediction.disease_name
        },
        severity: {
            en: prediction.severity,
            kn: prediction.severity === 'High' ? 'ಹೆಚ್ಚು' :
                prediction.severity === 'Moderate' ? 'ಮಧ್ಯಮ' :
                    prediction.severity === 'Low' ? 'ಕಡಿಮೆ' : 'ಆರೋಗ್ಯಕರ'
        },
        confidence: prediction.confidence,
        affectedAreaPercentage: isHealthy ? 0 : (prediction.severity === 'High' ? 75 : prediction.severity === 'Moderate' ? 40 : 15),
        description: {
            en: isHealthy ? "The plant appears to be in good health with no visible signs of disease." : `Detected ${prediction.disease_name} with ${(prediction.confidence * 100).toFixed(1)}% confidence.`,
            kn: isHealthy ? "ಸಸ್ಯವು ಉತ್ತಮ ಆರೋಗ್ಯದಲ್ಲಿದೆ ಎಂದು ತೋರುತ್ತದೆ." : `${(prediction.confidence * 100).toFixed(1)}% ವಿಶ್ವಾಸದೊಂದಿಗೆ ${prediction.disease_name} ಪತ್ತೆಯಾಗಿದೆ.`
        },
        affectedParts: {
            en: ["Leaves"],
            kn: ["ಎಲೆಗಳು"]
        },
        symptoms: {
            en: isHealthy ? ["No symptoms detected"] : [`Visible signs of ${prediction.disease_name}`, "Discoloration or spots on leaves"],
            kn: isHealthy ? ["ಯಾವುದೇ ರೋಗಲಕ್ಷಣಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ"] : [`${prediction.disease_name} ನ ಗೋಚರ ಚಿಹ್ನೆಗಳು`, "ಎಲೆಗಳ ಮೇಲೆ ಬಣ್ಣ ಬದಲಾವಣೆ ಅಥವಾ ಕಲೆಗಳು"]
        },
        treatment: treatment,
        prevention: {
            en: ["Maintain proper plant spacing", "Ensure good drainage", "Practice crop rotation"],
            kn: ["ಸರಿಯಾದ ಸಸ್ಯ ಅಂತರವನ್ನು ನಿರ್ವಹಿಸಿ", "ಉತ್ತಮ ಒಳಚರಂಡಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ", "ಬೆಳೆ ಪರಿಭ್ರಮಣೆಯನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ"]
        },
        cropName: {
            en: prediction.crop,
            kn: prediction.crop
        },
        topDetections: prediction.top_predictions.map(p => ({
            disease: { en: p.disease_class, kn: p.disease_class },
            confidence: p.confidence
        })),
        riskFactors: [
            { factor: { en: "Humidity", kn: "ತೇವಾಂಶ" }, value: 0.7 },
            { factor: { en: "Temperature", kn: "ತಾಪಮಾನ" }, value: 0.6 }
        ]
    };
}
