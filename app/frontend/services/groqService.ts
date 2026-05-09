
import { SoilData, SoilAnalysisReport, MarketAnalysisReport } from '../types';

const GROQ_API_KEY = process.env.GROQ_API_KEY || (import.meta as any).env?.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Gets soil analysis and crop recommendations using Groq API.
 */
export const getSoilAnalysis = async (data: SoilData, location: { district: string; taluk: string; village: string; }): Promise<SoilAnalysisReport> => {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY_MISSING");
  }

  const systemInstruction = `You are an expert agronomist for Karnataka, India. 
  Analyze soil, climate, and location data to provide a comprehensive report in JSON format.
  Strictly follow this JSON schema:
  {
    "soilHealthScore": number (0-100),
    "soilHealthSummary": "string",
    "nutrientAnalysis": {
      "ph": {
        "status": "string",
        "analysis": "string",
        "idealRange": [number, number]
      }
    },
    "recommendations": [
      {
        "crop": "string",
        "reason": "string",
        "suitabilityScore": number,
        "plantingTips": "string"
      }
    ]
  }`;

  const promptText = `Analyze the following conditions for ${location.village}, ${location.taluk}, ${location.district}, Karnataka:
  - pH: ${data.ph}
  - Temperature: ${data.temperature}°C
  - Humidity: ${data.humidity}%
  - Rainfall: ${data.rainfall} mm`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Groq API Error");
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content) as SoilAnalysisReport;

  } catch (e) {
    console.error("Error in Groq soil analysis:", e);
    throw new Error(`Groq Analysis Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

/**
 * Gets market analysis using Groq API.
 */
export const getMarketAnalysis = async (cropName: string, marketName: string): Promise<MarketAnalysisReport> => {
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY_MISSING");

    const systemInstruction = `You are an expert agricultural market analyst for Karnataka. 
    Provide a market report in JSON format following this schema:
    {
      "cropName": "string",
      "homeMarket": { "marketName": "string", "minPrice": number, "maxPrice": number, "modalPrice": number },
      "priceTrend": [{ "date": "YYYY-MM-DD", "price": number }],
      "comparisonMarkets": [{ "marketName": "string", "minPrice": number, "maxPrice": number, "modalPrice": number }],
      "marketInsight": "string"
    }`;

    try {
        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: `Generate market report for ${cropName} in ${marketName}.` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });

        const result = await response.json();
        return JSON.parse(result.choices[0].message.content) as MarketAnalysisReport;
    } catch (e) {
        console.error("Error in Groq market analysis:", e);
        throw e;
    }
};

/**
 * Sends a chat message to Groq and returns a stream or full response.
 * Note: Groq's fetch streaming is handled differently, so we'll implement a non-streaming version first 
 * for compatibility or a standard readable stream.
 */
export const sendMessageToGroq = async (messages: { role: string, content: string }[]) => {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY_MISSING");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.7,
      stream: true // We can use streaming!
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Groq Chat Error");
  }

  return response.body; // Return the stream
};

/**
 * Gets a price estimate for a crop based on market, quality, and weather.
 */
export const getPriceEstimate = async (
  cropName: string,
  category: string,
  quantity: number,
  locationName: string,
  marketName: string,
  weatherSummary: string
): Promise<{ min: number; max: number }> => {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY_MISSING");

  const systemInstruction = `You are an expert agricultural price estimator in Karnataka. 
  Estimate the price range per quintal for the given crop in the specified market.
  Consider typical market rates and weather impacts.
  Return only JSON with "min" and "max" numbers.`;

  const promptText = `Crop: ${cropName} (${category}), Quantity: ${quantity} Quintals, 
  Location: ${locationName}, Target Market: ${marketName}, Weather: ${weatherSummary}`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  } catch (e) {
    console.error("Error in Groq price estimate:", e);
    throw e;
  }
};
