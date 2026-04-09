

import { WeatherData, WeatherCodeInfo, AirQualityData, AgriWeatherInsight } from '../types';

const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const AQI_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export const getWeatherForDistrict = async (lat: number, lon: number): Promise<WeatherData> => {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,apparent_temperature,weather_code,is_day,cloud_cover,wind_speed_10m,relative_humidity_2m,wind_direction_10m,rain',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset,rain_sum,wind_speed_10m_max',
    hourly: 'temperature_2m,weather_code,precipitation_probability,wind_speed_10m',
    timezone: 'auto',
  });

  const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  const data = await response.json();
  
  return {
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
    },
    daily: data.daily.time.map((t: string, index: number) => ({
      time: t,
      weatherCode: data.daily.weather_code[index],
      temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
      temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
      uvIndexMax: data.daily.uv_index_max[index],
      sunrise: data.daily.sunrise[index],
      sunset: data.daily.sunset[index],
      rainSum: data.daily.rain_sum[index],
      windSpeedMax: data.daily.wind_speed_10m_max[index],
    })).slice(0, 7), // Ensure we only have 7 days
    hourly: data.hourly.time.map((t: string, index: number) => ({
        time: t,
        temperature: Math.round(data.hourly.temperature_2m[index]),
        weatherCode: data.hourly.weather_code[index],
        precipitationProbability: data.hourly.precipitation_probability[index],
        windSpeed: data.hourly.wind_speed_10m[index],
    })),
  };
};

export const getAirQualityForDistrict = async (lat: number, lon: number): Promise<AirQualityData> => {
    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'us_aqi,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    });

    const response = await fetch(`${AQI_BASE_URL}?${params.toString()}`);
    if(!response.ok) {
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
 * Returns a more accurate "live" weather code based on cloud cover.
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

    if (code === 0) return { description: 'Clear', icon: 'sun' };
    if (code === 1) return { description: 'Mainly Clear', icon: 'sun' };
    if (code === 2) return { description: 'Partly Cloudy', icon: 'cloud' };
    if (code === 3) return { description: 'Overcast', icon: 'cloud' };
    
    if (code === 45 || code === 48) { // Fog
        return { description: 'Fog', icon: 'fog' };
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { // Drizzle, Rain, Showers
        return { description: 'Rain', icon: 'rain' };
    }
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) { // Snow
        return { description: 'Snow', icon: 'snow' };
    }
    if (code >= 95 && code <= 99) { // Thunderstorm
        return { description: 'Thunderstorm', icon: 'thunder' };
    }

    return { description: 'Cloudy', icon: 'cloud' }; // Default fallback
};


export const getWeatherBackground = (code: number | undefined, isDay: number): string => {
    const { icon } = getWeatherInfoFromCode(code);

    if (isDay === 0) {
        return 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=2670&auto=format&fit=crop'; // Night
    }

    switch (icon) {
        case 'sun':
            return 'https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?q=80&w=2670&auto=format&fit=crop'; // Sunny day
        case 'cloud':
            return 'https://images.unsplash.com/photo-1499956827185-0d63ee78a910?q=80&w=2574&auto=format&fit=crop'; // Cloudy
        case 'rain':
            return 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=2574&auto=format&fit=crop'; // Rainy
        case 'thunder':
            return 'https://images.unsplash.com/photo-1561485132-59e2a045a64b?q=80&w=2670&auto=format&fit=crop'; // Thunderstorm
        case 'snow':
            return 'https://images.unsplash.com/photo-1547754980-3df97fed72a8?q=80&w=2670&auto=format&fit=crop'; // Snowy
        case 'fog':
            return 'https://images.unsplash.com/photo-1487621167335-5ab53247544a?q=80&w=2070&auto=format&fit=crop'; // Foggy
        default:
            return 'https://images.unsplash.com/photo-1499956827185-0d63ee78a910?q=80&w=2574&auto=format&fit=crop';
    }
};

/**
 * Generates agricultural insights based on weather conditions.
 */
export const generateAgriInsights = (weather: WeatherData): AgriWeatherInsight[] => {
    const insights: AgriWeatherInsight[] = [];
    const current = weather.current;
    const forecast = weather.daily;

    // 1. Irrigation Advice
    // Use hourly data to determine precipitation probability for today (next 24 hours)
    const maxPrecipProb = Math.max(...weather.hourly.slice(0, 24).map(h => h.precipitationProbability));
    const willRainToday = maxPrecipProb > 50 || (forecast[0]?.rainSum || 0) > 2;
    
    if (willRainToday) {
        insights.push({
            type: 'irrigation',
            riskLevel: 'low',
            message: 'Rainfall expected today. Skip irrigation to save water.',
            icon: 'water',
            crops: ['Paddy', 'Sugarcane', 'Vegetables']
        });
    } else if (current.temperature > 32 && current.humidity < 40) {
        insights.push({
            type: 'irrigation',
            riskLevel: 'high',
            message: 'High heat and dry air detected. Ensure sufficient irrigation to prevent crop stress.',
            icon: 'water',
            crops: ['Banana', 'Vegetables', 'Arecanut']
        });
    }

    // 2. Disease Risk (High Humidity)
    if (current.humidity > 85 && current.temperature > 24) {
        insights.push({
            type: 'disease',
            riskLevel: 'high',
            message: 'High humidity promotes fungal growth. Check for Rot disease and Blight.',
            icon: 'bug',
            crops: ['Arecanut', 'Grapes', 'Potato', 'Tomato']
        });
    }

    // 3. Spraying Conditions (Wind)
    if (current.windSpeed > 15) {
        insights.push({
            type: 'general',
            riskLevel: 'moderate',
            message: 'High wind speeds detected. Avoid spraying pesticides/fertilizers today.',
            icon: 'warning',
            crops: ['All Crops']
        });
    }

    // 4. Sowing Advice (Rain Pattern)
    const rainNext3Days = forecast.slice(0, 3).reduce((sum, day) => sum + (day.rainSum || 0), 0);
    if (rainNext3Days > 10 && rainNext3Days < 50) {
        insights.push({
            type: 'sowing',
            riskLevel: 'low',
            message: 'Good soil moisture expected over the next 3 days. Ideal time for sowing.',
            icon: 'plant',
            crops: ['Ragi', 'Jowar', 'Cotton']
        });
    }

    return insights;
};