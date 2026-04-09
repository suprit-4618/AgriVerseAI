import { KpiData, TrendDataPoint, DistributionDataPoint, DistrictHeatmapData, ScatterDataPoint, CropDiseaseDataPoint, PriorityAlert } from '../types';

export const kpiData: KpiData = {
  totalDetections: 1345,
  activeAlerts: 189,
  cropsAffected: 7,
};

export const diseaseSeverity = {
    index: 72
};

export const diseaseTrendData: TrendDataPoint[] = [
  { name: 'Jan', detections: 65, temperature: 28, humidity: 60 },
  { name: 'Feb', detections: 78, temperature: 30, humidity: 62 },
  { name: 'Mar', detections: 95, temperature: 32, humidity: 65 },
  { name: 'Apr', detections: 120, temperature: 35, humidity: 70 },
  { name: 'May', detections: 150, temperature: 34, humidity: 75 },
  { name: 'Jun', detections: 180, temperature: 30, humidity: 85 },
  { name: 'Jul', detections: 220, temperature: 28, humidity: 88 },
  { name: 'Aug', detections: 190, temperature: 28, humidity: 87 },
  { name: 'Sep', detections: 160, temperature: 29, humidity: 82 },
  { name: 'Oct', detections: 110, temperature: 29, humidity: 78 },
  { name: 'Nov', detections: 85, temperature: 28, humidity: 72 },
  { name: 'Dec', detections: 70, temperature: 27, humidity: 68 },
];

export const cropDistributionData: DistributionDataPoint[] = [
    { name: 'Tomato', value: 350 },
    { name: 'Potato', value: 280 },
    { name: 'Chilli', value: 210 },
    { name: 'Cotton', value: 180 },
    { name: 'Rice', value: 150 },
    { name: 'Sugarcane', value: 100 },
    { name: 'Grapes', value: 75 },
];

export const diseaseDistributionData: DistributionDataPoint[] = [
    { name: 'Blight', value: 450 },
    { name: 'Rust', value: 320 },
    { name: 'Powdery Mildew', value: 280 },
    { name: 'Mosaic Virus', value: 150 },
    { name: 'Leaf Spot', value: 145 },
];

export const environmentalCorrelationData: ScatterDataPoint[] = Array.from({ length: 50 }).map(() => ({
    temperature: Math.random() * 15 + 20, // 20 to 35
    humidity: Math.random() * 40 + 55, // 55 to 95
    detections: Math.floor(Math.random() * 20 + 5),
}));

export const karnatakaHeatmapData: DistrictHeatmapData[] = [
    { id: 'bengaluru_urban', name: 'Bengaluru Urban', value: 155 },
    { id: 'mysuru', name: 'Mysuru', value: 142 },
    { id: 'kodagu', name: 'Kodagu', value: 130 },
    { id: 'ballari', name: 'Ballari', value: 120 },
    { id: 'dakshina_kannada', name: 'Dakshina Kannada', value: 115 },
    { id: 'belagavi', name: 'Belagavi', value: 112 },
    { id: 'shivamogga', name: 'Shivamogga', value: 105 },
    { id: 'chamarajanagara', name: 'Chamarajanagara', value: 99 },
    { id: 'uttara_kannada', name: 'Uttara Kannada', value: 98 },
    { id: 'kalaburagi', name: 'Kalaburagi', value: 95 },
    { id: 'chikkamagaluru', name: 'Chikkamagaluru', value: 92 },
    { id: 'mandya', name: 'Mandya', value: 90 },
    { id: 'vijayapura', name: 'Vijayapura', value: 88 },
    { id: 'udupi', name: 'Udupi', value: 85 },
    { id: 'hassan', name: 'Hassan', value: 85 },
    { id: 'raichur', name: 'Raichur', value: 82 },
    { id: 'bengaluru_rural', name: 'Bengaluru Rural', value: 80 },
    { id: 'tumakuru', name: 'Tumakuru', value: 78 },
    { id: 'bagalkote', name: 'Bagalkote', value: 75 },
    { id: 'ramanagara', name: 'Ramanagara', value: 72 },
    { id: 'chitradurga', name: 'Chitradurga', value: 70 },
    { id: 'kolar', name: 'Kolar', value: 68 },
    { id: 'dharwad', name: 'Dharwad', value: 65 },
    { id: 'davanagere', name: 'Davanagere', value: 62 },
    { id: 'bidar', name: 'Bidar', value: 60 },
    { id: 'koppal', name: 'Koppal', value: 55 },
    { id: 'haveri', name: 'Haveri', value: 51 },
    { id: 'gadag', name: 'Gadag', value: 48 },
    { id: 'chikkaballapura', name: 'Chikkaballapura', value: 45 },
    { id: 'yadgir', name: 'Yadgir', value: 40 },
];

export const cropDiseaseData: CropDiseaseDataPoint[] = [
  {
    crop: { en: 'Tomato', kn: 'ಟೊಮೆಟೊ' },
    disease: { en: 'Early Blight', kn: 'ಆರಂಭಿಕ ರೋಗ' },
    detections: 125,
  },
  {
    crop: { en: 'Potato', kn: 'ಆಲೂಗಡ್ಡೆ' },
    disease: { en: 'Late Blight', kn: 'ಲೇಟ್ ಬ್ಲೈಟ್' },
    detections: 98,
  },
  {
    crop: { en: 'Tomato', kn: 'ಟೊಮೆಟೊ' },
    disease: { en: 'Mosaic Virus', kn: 'ಮೊಸಾಯಿಕ್ ವೈರಸ್' },
    detections: 85,
  },
  {
    crop: { en: 'Chilli', kn: 'ಮೆಣಸಿನಕಾಯಿ' },
    disease: { en: 'Powdery Mildew', kn: 'ಬೂದಿ ರೋಗ' },
    detections: 72,
  },
  {
    crop: { en: 'Cotton', kn: 'ಹತ್ತಿ' },
    disease: { en: 'Leaf Spot', kn: 'ಎಲೆ ಚುಕ್ಕೆ ರೋಗ' },
    detections: 65,
  },
  {
    crop: { en: 'Rice', kn: 'ಭತ್ತ' },
    disease: { en: 'Blast', kn: 'ಬ್ಲಾಸ್ಟ್' },
    detections: 55,
  },
  {
    crop: { en: 'Grapes', kn: 'ದ್ರಾಕ್ಷಿ' },
    disease: { en: 'Downy Mildew', kn: 'ಡೌನಿ ಮಿಲ್ಡ್ಯೂ' },
    detections: 48,
  },
  {
    crop: { en: 'Potato', kn: 'ಆಲೂಗಡ್ಡೆ' },
    disease: { en: 'Black Scurf', kn: 'ಕಪ್ಪು ಕಸಿ' },
    detections: 42,
  },
];

export const priorityAlertsData: PriorityAlert[] = [
  {
    disease: { en: 'Late Blight', kn: 'ಲೇಟ್ ಬ್ಲೈಟ್' },
    crop: { en: 'Potato & Tomato', kn: 'ಆಲೂಗಡ್ಡೆ ಮತ್ತು ಟೊಮೆಟೊ' },
    riskLevel: 'High',
    affectedDistricts: ['Hassan', 'Chikkamagaluru', 'Belagavi'],
    primaryAction: {
      en: 'Monitor for cool, moist conditions. Apply preventative copper-based fungicide immediately.',
      kn: 'ತಂಪಾದ, ತೇವಾಂಶವುಳ್ಳ ಪರಿಸ್ಥಿತಿಗಳಿಗಾಗಿ ಗಮನವಿರಲಿ. ತಾಮ್ರ ಆಧಾರಿತ ಶಿಲೀಂಧ್ರನಾಶಕವನ್ನು ತಕ್ಷಣವೇ ತಡೆಗಟ್ಟುವ ಕ್ರಮವಾಗಿ ಸಿಂಪಡಿಸಿ.',
    },
  },
  {
    disease: { en: 'Rice Blast', kn: 'ಭತ್ತದ ಬ್ಲಾಸ್ಟ್' },
    crop: { en: 'Rice', kn: 'ಭತ್ತ' },
    riskLevel: 'Moderate',
    affectedDistricts: ['Shivamogga', 'Mandya', 'Dakshina Kannada'],
    primaryAction: {
      en: 'Scout fields for diamond-shaped lesions on leaves. Ensure proper water management to avoid plant stress.',
      kn: 'ಎಲೆಗಳ ಮೇಲೆ ವಜ್ರಾಕಾರದ ಕಲೆಗಳಿಗಾಗಿ ಗದ್ದೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ಸಸ್ಯದ ಒತ್ತಡವನ್ನು ತಪ್ಪಿಸಲು ಸರಿಯಾದ ನೀರಿನ ನಿರ್ವಹಣೆಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
    },
  },
  {
    disease: { en: 'Powdery Mildew', kn: 'ಬೂದಿ ರೋಗ' },
    crop: { en: 'Grapes & Chilli', kn: 'ದ್ರಾಕ್ಷಿ ಮತ್ತು ಮೆಣಸಿನಕಾಯಿ' },
    riskLevel: 'Moderate',
    affectedDistricts: ['Vijayapura', 'Bagalkote', 'Kolar'],
    primaryAction: {
      en: 'Check undersides of leaves for white powdery growth. Improve air circulation through pruning.',
      kn: 'ಎಲೆಗಳ ಕೆಳಭಾಗದಲ್ಲಿ ಬಿಳಿ ಪುಡಿಯಂತಹ ಬೆಳವಣಿಗೆಗಾಗಿ ಪರಿಶೀಲಿಸಿ. ಸಸ್ಯಗಳ ಸಮರುವಿಕೆಯಿಂದ ಗಾಳಿಯ ಸಂಚಾರವನ್ನು ಸುಧಾರಿಸಿ.',
    },
  },
];