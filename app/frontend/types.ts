

export enum Language {
    EN = 'en',
    KN = 'kn',
}

export enum UserRole {
    USER = 'user',
    BUYER = 'buyer',
    ADMIN = 'admin',
}

export interface UserProfileDetails {
    // Farmer
    farmSize?: string;
    mainCrops?: string[];
    experience?: string;

    // Buyer
    companyName?: string;
    licenseNumber?: string;
    preferredCrops?: string[];

    // Admin
    department?: string;
    employeeId?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    location: string;
    profileImageUrl?: string;
    details?: UserProfileDetails;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    attachment?: {
        name: string;
        type: string;
        dataUrl?: string; // Add dataUrl for preview
    };
    analysisReport?: PlantAnalysisReport; // Add this for dashboard responses
}


export interface ExamplePrompt {
    text: string;
}

export interface ExampleCategory {
    title: string;
    prompts: ExamplePrompt[];
}

export interface DailyForecast {
    time: string;
    weatherCode: number;
    temperatureMax: number;
    temperatureMin: number;
    uvIndexMax: number;
    sunrise: string;
    sunset: string;
    rainSum?: number;
    windSpeedMax?: number;
}

export interface HourlyForecast {
    time: string;
    temperature: number;
    weatherCode: number;
    precipitationProbability: number;
    windSpeed?: number;
}

export interface WeatherData {
    timezone: string;
    current: {
        temperature: number;
        apparentTemperature: number;
        weatherCode: number;
        cloudCover: number;
        isDay: number;
        windSpeed: number;
        humidity: number;
        windDirection: number;
        rain?: number;
    };
    daily: DailyForecast[];
    hourly: HourlyForecast[];
}

export interface AgriWeatherInsight {
    type: 'sowing' | 'irrigation' | 'disease' | 'fertilizer' | 'harvest' | 'general';
    riskLevel: 'low' | 'moderate' | 'high';
    message: string;
    icon: 'water' | 'plant' | 'bug' | 'sun' | 'warning';
    crops: string[]; // e.g., ['Arecanut', 'Paddy']
}

export interface AirQualityData {
    usAqi: number;
    co: number;
    no2: number;
    so2: number;
    o3: number;
}

export interface WeatherCodeInfo {
    description: string;
    icon: 'sun' | 'cloud' | 'rain' | 'thunder' | 'snow' | 'fog';
}

export interface SoilData {

    ph: number;
    temperature: number;
    humidity: number;
    rainfall: number;
}

export interface CropRecommendation {
    crop: string;
    reason: string;
    suitabilityScore: number;
    plantingTips: string;
}

export interface NutrientDetail {
    status: string; // e.g. "Optimal", "Deficient", "Slightly Acidic"
    analysis: string; // A short text analysis
    idealRange: [number, number]; // [min, max]
}

export interface SoilAnalysisReport {
    soilHealthScore: number; // A score from 0 to 100 for the gauge chart.
    soilHealthSummary: string;
    nutrientAnalysis: {

        ph: NutrientDetail;
    };
    recommendations: CropRecommendation[];
}

export interface SavedSoilReport {
    id: string;
    date: string; // ISO string
    location: {
        district: string;
        taluk: string;
        village: string;
    };
    report: SoilAnalysisReport;
    soilData: SoilData; // Save the input parameters for context
}

export interface SoilImageAnalysisReport {
    soilColor: {
        colorName: string;
        interpretation: string;
    };
    visualTexture: {
        dominantType: 'Sandy' | 'Loamy' | 'Clay' | 'Silty' | 'Mixed';
        confidence: number;
        description: string;
    };
    moistureLevel: {
        level: 'Dry' | 'Moist' | 'Wet';
        confidence: number;
        description: string;
    };
    organicMatterEstimate: {
        level: 'Low' | 'Medium' | 'High';
        description: string;
    };
    surfaceFeatures: {
        feature: string;
        description: string;
    }[];
    overallAssessment: string;
    limitations: string[];
}


// Location Data Structures
export interface Village {
    name: string;
}

export interface Taluk {
    name: string;
    villages: Village[];
}

export interface DistrictData {
    name: string;
    taluks: Taluk[];
}

// Plant Disease Analysis Data Structures
export interface LocalizedText {
    en: string;
    kn: string;
}

export interface LocalizedStringArray {
    en: string[];
    kn: string[];
}

export interface PlantAnalysisReport {
    isDiseaseFound: boolean;
    diseaseName: LocalizedText;
    confidenceScore: number;
    severity: LocalizedText;
    description: LocalizedText;
    symptoms: LocalizedStringArray;
    prevention: LocalizedStringArray;
    treatment: {
        medicineName: LocalizedText;
        usageInstructions: LocalizedStringArray;
    };
    // New fields for the dashboard
    topDetections: {
        disease: LocalizedText;
        confidence: number; // 0-1
    }[];
    affectedAreaPercentage: number; // 0-100
    riskFactors: {
        factor: LocalizedText;
        value: number; // 0-1
    }[];
}

// Health Dashboard Data Structures
export interface KpiData {
    totalDetections: number;
    activeAlerts: number;
    cropsAffected: number;
}

export interface TrendDataPoint {
    name: string;
    detections: number;
    temperature: number;
    humidity: number;
    [key: string]: string | number;
}

export interface DistributionDataPoint {
    name: string;
    value: number;
}

export interface DistrictHeatmapData {
    id: string;
    name: string;
    value: number;
}

export interface ScatterDataPoint {
    temperature: number;
    humidity: number;
    detections: number;
}

export interface CropDiseaseDataPoint {
    crop: LocalizedText;
    disease: LocalizedText;
    detections: number;
}

export type HistoricalDataPoint = {
    month: string;
    detections: number;
};

export interface PriorityAlert {
    disease: LocalizedText;
    crop: LocalizedText;
    riskLevel: 'High' | 'Moderate' | 'Low';
    affectedDistricts: string[];
    primaryAction: LocalizedText;
}

// Marketplace Data Structures
export interface MarketPriceData {
    marketName: string;
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
}

export interface PriceTrendPoint {
    date: string; // "YYYY-MM-DD"
    price: number;
}

export interface MarketAnalysisReport {
    cropName: string;
    homeMarket: MarketPriceData;
    priceTrend: PriceTrendPoint[];
    comparisonMarkets: MarketPriceData[];
    marketInsight: string;
}

// --- SELL YOUR CROP FEATURES ---

export type CropCategory = 'Yields' | 'Fruits' | 'Vegetables';
export type RequestStatus = 'PENDING' | 'NEGOTIATING' | 'APPROVED' | 'REJECTED';

export interface RequestMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
}

export interface CropSellRequest {
    id: string;
    farmerId: string;
    farmerName: string;
    category: CropCategory;
    cropName: string;
    quantity: number; // in Quintals
    marketName: string;
    location: {
        lat: number;
        lon: number;
        name: string; // Reverse geocoded or selected district
    };
    weatherSummary: string; // Snapshot of weather at submission
    imageUrl?: string;
    aiEstimatedPrice: {
        min: number;
        max: number;
    };
    status: RequestStatus;
    messages: RequestMessage[];
    createdAt: string;
    finalRate?: number;
    billId?: string;
}

export interface BillReceipt {
    billId: string;
    requestId: string;
    farmerName: string;
    buyerName: string; // Marketer
    cropName: string;
    quantity: number;
    ratePerQuintal: number;
    totalAmount: number;
    marketFee: number; // Calculated
    date: string;
    marketName: string;
}

export interface Notification {
    id: string;
    recipientId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
}


export type UIStringContent = {
    // Landing Page
    landing_top_bar: string;
    landing_phone: string;
    landing_email: string;
    landing_nav_home: string;
    landing_nav_about: string;
    landing_nav_services: string;
    landing_nav_contact: string;
    landing_hero_tagline: string;
    landing_hero_title: string;
    landing_hero_subtitle: string;
    landing_cta_dashboard: string;
    landing_cta_learn_more: string;
    landing_features_title: string;
    landing_features_subtitle: string;
    landing_feature1_title: string;
    landing_feature1_desc: string;
    landing_feature2_title: string;
    landing_feature2_desc: string;
    landing_feature3_title: string;
    landing_feature3_desc: string;
    landing_feature4_title: string;
    landing_feature4_desc: string;
    landing_feature5_title: string;
    landing_feature5_desc: string;
    why_choose_us_title: string;
    why_choose_us_1_title: string;
    why_choose_us_1_desc: string;
    why_choose_us_2_title: string;
    why_choose_us_2_desc: string;
    why_choose_us_3_title: string;
    why_choose_us_3_desc: string;

    // App Info
    appName: string;
    appDescription: string;
    languageEN: string;
    languageKN: string;

    // Bhoomi AI Assistant
    assistantWelcome: string;
    askWithVoice: string;
    typeWithKeyboard: string;
    bilingualSupport: string;
    examplePromptsTitle: string;
    getStarted: string;
    exampleCategories: ExampleCategory[];
    messagePlaceholder: string;
    send: string;
    voiceOutput: string;
    cancelVoiceOutput: string;
    errorPrefix: string;
    errorApiGeneric: string;
    errorSpeechNetwork: string;
    errorSpeechGeneric: string;
    attachFile: string;
    agriculturalFacts: string[];
    listening: string;
    cancel: string;

    // Weather
    weatherTitle: string;
    selectDistrict: string;
    loadingWeather: string;
    weatherStatus: string;
    weather_high: string;
    weather_low: string;
    days: string[];
    today: string;
    weatherCodes: Record<number, string>;
    hourlyForecast: string;
    dailyForecast: string;
    airQuality: string;
    airQualityIndex: string;
    uvIndex: string;
    sunrise: string;
    sunset: string;
    wind: string;
    humidity: string;
    feelsLike: string;
    precipitation: string;
    aqi_good: string;
    aqi_moderate: string;
    aqi_unhealthy_sensitive: string;
    aqi_unhealthy: string;
    aqi_very_unhealthy: string;
    aqi_hazardous: string;
    aqi_good_desc: string;
    aqi_moderate_desc: string;
    aqi_unhealthy_sensitive_desc: string;
    aqi_unhealthy_desc: string;
    aqi_very_unhealthy_desc: string;
    aqi_hazardous_desc: string;

    // Soil Analysis
    soilAnalysisTitle: string;
    soilAnalysisDescription: string;
    soilAnalysisButton: string;
    soilParamTitle: string;
    locationTitle: string;
    selectTaluk: string;
    selectVillage: string;
    soilHealthSummary: string;
    nutrientAnalysis: string;
    cropRecommendations: string;
    suitability: string;
    plantingTips: string;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    ph: string;
    temperature: string;
    rainfall: string;
    loadingAnalysis: string;
    soilHealthScoreTitle: string;
    idealRange: string;

    // Plant Disease Analysis
    plantAnalysisTitle: string;
    plantAnalysisDescription: string;
    uploadPlantImagePrompt: string;
    analyzingPlant: string;
    analysisResults: string;
    diseaseName: string;
    confidence: string;
    description: string;
    severity: string;
    prevention: string;
    treatment: string;
    medicineName: string;
    usageInstructions: string;
    healthyPlant: string;
    healthyPlantDesc: string;
    errorAnalysis: string;
    analyzeAnotherPlant: string;
    captureWithCamera: string;
    or: string;
    switchCamera: string;
    capture: string;
    retake: string;
    usePhoto: string;
    downloadReport: string;
    readAloud: string;
    stopReading: string;
    topDetections: string;
    affectedArea: string;
    healthyArea: string;
    riskFactors: string;
    historicalData: string;
    symptoms: string;
    viewHealthDashboard: string;
    backToAnalysis: string;
    plantHealthDashboardTitle: string;
    keyMetrics: string;
    totalDetections: string;
    activeAlerts: string;
    cropsAffected: string;
    diseaseSeverityIndex: string;
    diseaseTrend: string;
    detections: string;
    cropDistribution: string;
    diseaseDistribution: string;
    environmentalCorrelation: string;
    mostAffectedDistricts: string;
    cropDiseaseHotspots: string;
    crop: string;
    disease: string;
    priorityAlertsTitle: string;
    riskLevel: string;
    highRisk: string;
    moderateRisk: string;
    lowRisk: string;
    affectedRegions: string;
    recommendedAction: string;

    // Marketplace
    marketplaceTitle: string;
    marketplaceDescription: string;
    selectMarket: string;
    selectCrop: string;
    analyzePrices: string;
    priceAnalysisFor: string;
    in: string;
    minPrice: string;
    maxPrice: string;
    modalPrice: string;
    priceTrend30Days: string;
    marketComparison: string;
    marketInsight: string;
    loadingMarketAnalysis: string;
    sellYourCrop: string;
    getEstimate: string;
    quantity: string;
    quality: string;
    estimatedValue: string;
    bestMarketToSell: string;

    // User Profile
    userProfileTitle: string;
    editProfile: string;
    accountVerified: string;
    saveChanges: string;
    cancelEdit: string;
    fullNameLabel: string;
    locationLabel: string;
};

export type UIStrings = {
    [key in Language]: UIStringContent;
};
