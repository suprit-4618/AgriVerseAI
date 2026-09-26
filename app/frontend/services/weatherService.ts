import { WeatherData, WeatherCodeInfo, AirQualityData, AgriWeatherInsight, LocationResult, Language } from '../types';
import { generateSpeech } from './geminiService';

const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const AQI_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Searches locations across India and globally using Open-Meteo Geocoding API
 */
export const searchLocations = async (query: string): Promise<LocationResult[]> => {
    if (!query || query.trim().length < 2) return [];

    try {
        const url = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        if (!data.results) return [];

        return data.results.map((res: any) => ({
            id: res.id,
            name: res.name,
            admin1: res.admin1 || res.country, // State (e.g. Karnataka)
            admin2: res.admin2 || res.admin3 || '', // District / Taluk
            country: res.country,
            latitude: res.latitude,
            longitude: res.longitude,
        }));
    } catch (err) {
        console.warn('Geocoding search failed:', err);
        return [];
    }
};

/**
 * Reverse geocodes GPS coordinates to village/taluk/district name
 */
export const reverseGeocodeLocation = async (lat: number, lon: number): Promise<string> => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'AgriVerseAI-WeatherApp/1.0',
            }
        });
        if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            const place = addr.village || addr.suburb || addr.town || addr.city || addr.county || addr.state_district || 'Your Farm Location';
            const district = addr.state_district || addr.state || '';
            return district ? `${place}, ${district}` : place;
        }
    } catch (err) {
        console.warn('Reverse geocode failed:', err);
    }
    return `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
};

/**
 * Fetches real-time hyperlocal weather, soil moisture, and 7-day forecast from Open-Meteo
 */
export const getWeatherForDistrict = async (
    lat: number, 
    lon: number, 
    locationName?: string
): Promise<WeatherData> => {
    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'temperature_2m,apparent_temperature,weather_code,is_day,cloud_cover,wind_speed_10m,relative_humidity_2m,wind_direction_10m,rain,surface_pressure',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset,rain_sum,wind_speed_10m_max,precipitation_probability_max,et0_fao_evapotranspiration',
        hourly: 'temperature_2m,weather_code,precipitation_probability,wind_speed_10m,relative_humidity_2m,soil_temperature_0cm,soil_moisture_0_to_1cm',
        timezone: 'auto',
    });

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch real-time weather data from Open-Meteo');
    }
    const data = await response.json();

    // Extract current soil metrics from the closest hourly record if available
    const currentHourIndex = new Date().getHours();
    const currentSoilMoisture = data.hourly?.soil_moisture_0_to_1cm?.[currentHourIndex] != null 
        ? Math.round(data.hourly.soil_moisture_0_to_1cm[currentHourIndex] * 100) 
        : undefined;
    const currentSoilTemp = data.hourly?.soil_temperature_0cm?.[currentHourIndex] != null
        ? Math.round(data.hourly.soil_temperature_0cm[currentHourIndex])
        : undefined;

    return {
        locationName,
        latitude: lat,
        longitude: lon,
        timezone: data.timezone,
        current: {
            temperature: Math.round(data.current.temperature_2m),
            apparentTemperature: Math.round(data.current.apparent_temperature),
            weatherCode: data.current.weather_code,
            cloudCover: data.current.cloud_cover,
            isDay: data.current.is_day,
            windSpeed: Math.round(data.current.wind_speed_10m),
            humidity: Math.round(data.current.relative_humidity_2m),
            windDirection: Math.round(data.current.wind_direction_10m),
            rain: data.current.rain,
            pressure: data.current.surface_pressure ? Math.round(data.current.surface_pressure) : undefined,
            soilMoisture: currentSoilMoisture,
            soilTemperature: currentSoilTemp,
        },
        daily: data.daily.time.map((t: string, index: number) => ({
            time: t,
            weatherCode: data.daily.weather_code[index],
            temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
            temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
            uvIndexMax: data.daily.uv_index_max[index],
            sunrise: data.daily.sunrise[index],
            sunset: data.daily.sunset[index],
            rainSum: data.daily.rain_sum ? data.daily.rain_sum[index] : 0,
            windSpeedMax: data.daily.wind_speed_10m_max ? Math.round(data.daily.wind_speed_10m_max[index]) : 0,
            precipitationProbabilityMax: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[index] : 0,
            evapotranspiration: data.daily.et0_fao_evapotranspiration ? Number(data.daily.et0_fao_evapotranspiration[index].toFixed(1)) : undefined,
        })).slice(0, 7),
        hourly: data.hourly.time.map((t: string, index: number) => ({
            time: t,
            temperature: Math.round(data.hourly.temperature_2m[index]),
            weatherCode: data.hourly.weather_code[index],
            precipitationProbability: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[index] : 0,
            windSpeed: data.hourly.wind_speed_10m ? Math.round(data.hourly.wind_speed_10m[index]) : 0,
            humidity: data.hourly.relative_humidity_2m ? Math.round(data.hourly.relative_humidity_2m[index]) : undefined,
            soilMoisture: data.hourly.soil_moisture_0_to_1cm ? Math.round(data.hourly.soil_moisture_0_to_1cm[index] * 100) : undefined,
            soilTemperature: data.hourly.soil_temperature_0cm ? Math.round(data.hourly.soil_temperature_0cm[index]) : undefined,
        })),
    };
};

/**
 * Fetches Air Quality (AQI) from Open-Meteo Air Quality API
 */
export const getAirQualityForDistrict = async (lat: number, lon: number): Promise<AirQualityData> => {
    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'us_aqi,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    });

    const response = await fetch(`${AQI_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch air quality data');
    }
    const data = await response.json();
    return {
        usAqi: data.current.us_aqi,
        co: data.current.carbon_monoxide,
        no2: data.current.nitrogen_dioxide,
        so2: data.current.sulphur_dioxide,
        o3: data.current.ozone,
    };
};

/**
 * Calculates live weather status code
 */
export const getLiveWeatherCode = (current: WeatherData['current']): number => {
    if (current.isDay === 0) {
        return current.weatherCode;
    }
    const { cloudCover, weatherCode } = current;
    if (weatherCode > 3) return weatherCode;
    if (cloudCover <= 10) return 0; // Clear Sky
    if (cloudCover <= 50) return 1; // Mainly Clear
    if (cloudCover <= 85) return 2; // Partly Cloudy
    return 3; // Overcast
};

export const getWeatherInfoFromCode = (code: number | undefined): WeatherCodeInfo => {
    if (code === undefined) return { description: 'N/A', icon: 'cloud' };

    if (code === 0) return { description: 'Clear Sky', icon: 'sun' };
    if (code === 1) return { description: 'Mainly Clear', icon: 'sun' };
    if (code === 2) return { description: 'Partly Cloudy', icon: 'cloud' };
    if (code === 3) return { description: 'Overcast', icon: 'cloud' };
    
    if (code === 45 || code === 48) {
        return { description: 'Foggy Conditions', icon: 'fog' };
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        return { description: 'Rain Showers', icon: 'rain' };
    }
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        return { description: 'Snowfall', icon: 'snow' };
    }
    if (code >= 95 && code <= 99) {
        return { description: 'Thunderstorm', icon: 'thunder' };
    }

    return { description: 'Cloudy', icon: 'cloud' };
};

/**
 * Generates tailored agricultural alerts based on live meteorological data
 */
export const generateAgriInsights = (weather: WeatherData): AgriWeatherInsight[] => {
    const insights: AgriWeatherInsight[] = [];
    const current = weather.current;
    const today = weather.daily[0];

    // 1. Spraying Suitability (Wind & Rain)
    if (current.rain && current.rain > 0.5) {
        insights.push({
            type: 'fertilizer',
            riskLevel: 'high',
            message: 'Active rainfall detected. Postpone pesticide and foliar fertilizer sprays to avoid chemical runoff.',
            icon: 'warning',
            crops: ['All Crops', 'Paddy', 'Cotton']
        });
    } else if (current.windSpeed > 18) {
        insights.push({
            type: 'fertilizer',
            riskLevel: 'moderate',
            message: `Wind speed is high (${current.windSpeed} km/h). Spraying is not recommended due to chemical drift risks.`,
            icon: 'warning',
            crops: ['Arecanut', 'Pomegranate', 'Horticulture']
        });
    } else {
        insights.push({
            type: 'fertilizer',
            riskLevel: 'low',
            message: `Calm wind (${current.windSpeed} km/h) & dry canopy. Excellent window for pesticide and nutrient spraying.`,
            icon: 'plant',
            crops: ['Vegetables', 'Pulses', 'Maize']
        });
    }

    // 2. Irrigation & Soil Moisture
    if (current.soilMoisture && current.soilMoisture > 45) {
        insights.push({
            type: 'irrigation',
            riskLevel: 'low',
            message: `Soil moisture is saturated (${current.soilMoisture}%). Hold off on irrigation for the next 24–48 hours to conserve water.`,
            icon: 'water',
            crops: ['Groundnut', 'Soybean', 'Sugarcane']
        });
    } else if (today && today.precipitationProbabilityMax && today.precipitationProbabilityMax > 70) {
        insights.push({
            type: 'irrigation',
            riskLevel: 'moderate',
            message: `High chance of rain (${today.precipitationProbabilityMax}%). Delay supplemental irrigation.`,
            icon: 'water',
            crops: ['Paddy', 'Cotton', 'Turmeric']
        });
    } else if (current.humidity < 40 && current.temperature > 32) {
        insights.push({
            type: 'irrigation',
            riskLevel: 'high',
            message: 'High heat and low humidity. Early morning or sunset drip irrigation strongly recommended.',
            icon: 'water',
            crops: ['Tomato', 'Chilli', 'Banana']
        });
    }

    // 3. Disease & Fungal Proliferation Alert
    if (current.humidity > 82 && current.temperature >= 22 && current.temperature <= 29) {
        insights.push({
            type: 'disease',
            riskLevel: 'high',
            message: 'Warm and humid microclimate creates optimal conditions for fungal leaf spots, blights, and powdery mildew.',
            icon: 'bug',
            crops: ['Tomato', 'Potato', 'Grapes', 'Paddy']
        });
    }

    return insights;
};

/**
 * Generates the written agricultural advisory script for display and TTS
 */
export const getWeatherBriefingScript = (
    weather: WeatherData,
    locationName: string,
    language: Language
): string => {
    const isKn = language === Language.KN;
    const current = weather.current;
    const today = weather.daily[0];
    const rainChance = today?.precipitationProbabilityMax || 0;
    const rainSum = today?.rainSum || 0;
    const windSpeed = current.windSpeed;
    const soilMoisture = current.soilMoisture;
    const conditionText = getWeatherInfoFromCode(current.weatherCode).description;

    if (isKn) {
        return `ನಮಸ್ಕಾರ ರೈತ ಮಿತ್ರರೇ, ${locationName} ಭಾಗದ ಇಂದಿನ ಹವಾಮಾನ ವರದಿ: ಪ್ರಸ್ತುತ ತಾಪಮಾನ ${current.temperature} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್, ವಾತಾವರಣ ${conditionText}. ಗಾಳಿಯ ವೇಗ ಗಂಟೆಗೆ ${windSpeed} ಕಿಲೋಮೀಟರ್. ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆ ಶೇಕಡಾ ${rainChance} ರಷ್ಟಿದೆ. ${
            rainChance > 60 
                ? "ಮಳೆಯ ಸಂಭವವಿರುವುದರಿಂದ ಯಾವುದೇ ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆಯನ್ನು ಮುಂದೂಡಿ." 
                : windSpeed < 15 
                ? "ಗಾಳಿಯು ಶಾಂತವಾಗಿದ್ದು, ಬೆಳೆಗಳಿಗೆ ಔಷಧ ಮತ್ತು ಪೋಷಕಾಂಶ ಸಿಂಪಡಿಸಲು ಸೂಕ್ತ ಸಮಯವಾಗಿದೆ." 
                : "ಗಾಳಿ ಹೆಚ್ಚಿರುವುದರಿಂದ ಸಿಂಪಡಣೆ ಮಾಡುವಾಗ ಎಚ್ಚರ ವಹಿಸಿ."
        } ${soilMoisture ? `ಮಣ್ಣಿನ ತೇವಾಂಶ ಶೇಕಡಾ ${soilMoisture} ರಷ್ಟಿದೆ.` : ''} ಶುಭ ಕೃಷಿ ದಿನ!`;
    } else {
        return `Hello farmer, here is today's agricultural weather briefing for ${locationName}. Current temperature is ${current.temperature}°C with ${conditionText}. Humidity is at ${current.humidity}%, with a ${rainChance}% probability of precipitation. Wind speed is ${windSpeed} km/h. ${
            rainChance > 60
                ? "Due to high rain probability, postpone chemical foliar spraying."
                : windSpeed < 15
                ? "Winds are calm, making this an ideal window for pesticide and nutrient spraying."
                : "Moderate wind speeds observed; take care when applying crop treatments."
        } ${soilMoisture ? `Topsoil moisture is currently at ${soilMoisture}%.` : ''} Have a productive farming day!`;
    }
};

/**
 * Generates an audio agricultural weather advisory via Google AI Studio Gemini TTS
 */
export const generateWeatherVoiceBriefing = async (
    weather: WeatherData,
    locationName: string,
    language: Language
): Promise<{ audioBase64?: string; script: string }> => {
    const script = getWeatherBriefingScript(weather, locationName, language);
    const audioBase64 = await generateSpeech(script, language);
    return { audioBase64, script };
};

/**
 * Decodes and plays Gemini TTS PCM16 audio (or standard WAV) with Web Audio API
 */
export const playWeatherAudio = async (
    base64Audio: string,
    onEnded?: () => void
): Promise<() => void> => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();

    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    let audioBuffer: AudioBuffer;
    // Check if it starts with 'RIFF'
    const isWav = bytes.length >= 4 &&
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;

    if (isWav) {
        audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
    } else {
        // Raw 24000Hz 16-bit Mono PCM from Gemini TTS
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }
        audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.copyToChannel(float32Array, 0);
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    source.onended = () => {
        try {
            ctx.close();
        } catch {}
        onEnded?.();
    };

    source.start(0);

    return () => {
        try {
            source.stop();
            source.disconnect();
            ctx.close();
        } catch {}
    };
};