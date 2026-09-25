
import { SoilData, SoilAnalysisReport, MarketAnalysisReport } from '../types';
import { 
  getSoilAnalysis as getGeminiSoilAnalysis, 
  getMarketAnalysis as getGeminiMarketAnalysis, 
  getPriceEstimate as getGeminiPriceEstimate 
} from './geminiService';

const getGroqKey = (): string => {
  return (import.meta as any).env?.VITE_GROQ_API_KEY || 
         (typeof process !== 'undefined' ? process.env.GROQ_API_KEY : '') || 
         '';
};

const getGroqUrls = (): string[] => [
  '/api/groq/chat/completions',
  'https://api.groq.com/openai/v1/chat/completions'
];

/**
 * Gets soil analysis and crop recommendations using Groq API with Gemini fallback.
 */
export const getSoilAnalysis = async (data: SoilData, location: { district: string; taluk: string; village: string; }): Promise<SoilAnalysisReport> => {
  const apiKey = getGroqKey();

  if (apiKey) {
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

    const urls = getGroqUrls();
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
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

        if (response.ok) {
          const result = await response.json();
          return JSON.parse(result.choices[0].message.content) as SoilAnalysisReport;
        }
      } catch (e) {
        // Fall back to next url or Gemini
      }
    }
  }

  // Graceful Gemini 2.5 Flash Fallback
  return getGeminiSoilAnalysis(data, location);
};

/**
 * Gets market analysis using Groq API with Gemini fallback.
 */
export const getMarketAnalysis = async (cropName: string, marketName: string): Promise<MarketAnalysisReport> => {
    const apiKey = getGroqKey();

    if (apiKey) {
      const systemInstruction = `You are an expert agricultural market analyst for Karnataka. 
      Provide a market report in JSON format following this schema:
      {
        "cropName": "string",
        "homeMarket": { "marketName": "string", "minPrice": number, "maxPrice": number, "modalPrice": number },
        "priceTrend": [{ "date": "YYYY-MM-DD", "price": number }],
        "comparisonMarkets": [{ "marketName": "string", "minPrice": number, "maxPrice": number, "modalPrice": number }],
        "marketInsight": "string"
      }`;

      const urls = getGroqUrls();
      for (const url of urls) {
          try {
              const response = await fetch(url, {
                  method: "POST",
                  headers: {
                      "Authorization": `Bearer ${apiKey}`,
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

              if (response.ok) {
                  const result = await response.json();
                  return JSON.parse(result.choices[0].message.content) as MarketAnalysisReport;
              }
          } catch (e) {
              // Fall back to next url or Gemini
          }
      }
    }

    // Graceful Gemini 2.5 Flash Fallback
    return getGeminiMarketAnalysis(cropName, marketName);
};

import { BHOOMI_SYSTEM_PROMPT } from './bhoomiPrompt';
import { Language } from '../types';

/**
 * Streams chat responses from Groq LLaMA-3.3 70B with ultra-low latency (<200ms)
 */
export const getGroqBhoomiStream = async function* (
  history: (any)[],
  currentLanguage: Language,
  user?: any
) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error("GROQ_API_KEY_MISSING");

  const trimmedHistory = history.slice(-10);
  const isKn = currentLanguage === Language.KN;
  const langRule = isKn
    ? "\n\nCRITICAL INSTRUCTION: The user is communicating in KANNADA (ಕನ್ನಡ). You MUST formulate your entire response in authentic, fluent Kannada script (ಕನ್ನಡ ಲಿಪಿ). Do NOT reply in English."
    : "\n\nCRITICAL INSTRUCTION: The user is communicating in ENGLISH. Formulate your entire response in English.";

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: BHOOMI_SYSTEM_PROMPT + langRule },
    ...trimmedHistory.map(msg => {
      let msgText = '';
      if (Array.isArray((msg as any).parts) && (msg as any).parts.length > 0) {
        msgText = (msg as any).parts.map((p: any) => p.text).join('\n');
      } else if ((msg as any).text) {
        msgText = (msg as any).text;
      }
      return {
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msgText
      };
    })
  ];

  const lastMsg = messages[messages.length - 1];
  if (lastMsg && lastMsg.role === 'user') {
    const langPrompt = isKn
      ? "\n\n(System: Please reply to this message strictly in Kannada / ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ)"
      : "\n\n(System: Please reply to this message strictly in English)";
    lastMsg.content += langPrompt;
  }

  let response: Response | null = null;
  const urls = getGroqUrls();

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7,
          stream: true
        })
      });

      if (res.ok && res.body) {
        response = res;
        break;
      }
    } catch (e) {
      // try next url
    }
  }

  if (!response || !response.body) {
    throw new Error("Groq streaming request failed on all endpoints");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const jsonStr = trimmed.replace("data: ", "").trim();
        if (jsonStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield { text: content };
          }
        } catch (e) {
          // ignore chunk parse errors
        }
      }
    }
  }
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
  const apiKey = getGroqKey();

  if (apiKey) {
    const systemInstruction = `You are an expert agricultural price estimator in Karnataka. 
    Estimate the price range per quintal for the given crop in the specified market.
    Consider typical market rates and weather impacts.
    Return only JSON with "min" and "max" numbers.`;

    const promptText = `Crop: ${cropName} (${category}), Quantity: ${quantity} Quintals, 
    Location: ${locationName}, Target Market: ${marketName}, Weather: ${weatherSummary}`;

    const urls = getGroqUrls();
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
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

        if (response.ok) {
          const result = await response.json();
          return JSON.parse(result.choices[0].message.content);
        }
      } catch (e) {
        // Fall back to next url or Gemini
      }
    }
  }

  // Graceful Gemini 2.5 Flash Fallback
  return getGeminiPriceEstimate(cropName, category, quantity, locationName, marketName, weatherSummary);
};
