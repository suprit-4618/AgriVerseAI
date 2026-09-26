import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, Language, PlantAnalysisReport, UserProfile } from '../types';
import { getPlantDiseaseAnalysis } from '../services/geminiService';
import { diseaseLogService } from '../services/diseaseLogService';
import { Button } from './ui/button';
import { ThinkingOrb } from './ui/thinking-orbs';
import CameraCapture from '../CameraCapture';
import PlantHealthDashboard from './PlantHealthDashboard';
import PlantAnalysisResult from './PlantAnalysisResult';
import { 
    UploadCloud, Camera, Sparkles, AlertCircle, 
    BarChart3, RefreshCw, FileImage, ShieldCheck, 
    Leaf, Check, ArrowRight, X
} from 'lucide-react';

// Helper to convert file to data URL
const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const fileToBase64 = (dataUrl: string): string => {
    const parts = dataUrl.split(',');
    return parts.length > 1 ? parts[1] : dataUrl;
};

// Curated sample leaves for 1-click test diagnosis
const SAMPLE_LEAF_DATASETS = [
    {
        id: 'tomato-blight',
        title: 'Tomato Late Blight',
        titleKn: 'ಟೊಮೆಟೊ ಲೇಟ್ ಬ್ಲೈಟ್',
        crop: 'Tomato',
        image: 'https://images.unsplash.com/photo-1592417817098-8f3d69106093?auto=format&fit=crop&w=400&q=80',
        badge: 'Fungal Pathogen'
    },
    {
        id: 'potato-scab',
        title: 'Potato Leaf Scab',
        titleKn: 'ಆಲೂಗಡ್ಡೆ ಎಲೆ ರೋಗ',
        crop: 'Potato',
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
        badge: 'High Humidity'
    },
    {
        id: 'rice-blast',
        title: 'Rice Leaf Blast',
        titleKn: 'ಭತ್ತದ ಬೆಂಕಿ ರೋಗ',
        crop: 'Rice / Paddy',
        image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=400&q=80',
        badge: 'Magnaporthe'
    },
    {
        id: 'healthy-leaf',
        title: 'Healthy Crop Leaf',
        titleKn: 'ಆರೋಗ್ಯಕರ ಎಲೆ',
        crop: 'Pepper / Capsicum',
        image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=400&q=80',
        badge: 'Healthy 100%'
    }
];

interface PlantAnalysisProps {
    texts: UIStringContent;
    currentLanguage: Language;
    user?: UserProfile;
    onConsultAssistant?: (diseaseName: string) => void;
}

const PlantAnalysis: React.FC<PlantAnalysisProps> = ({ 
    texts, 
    currentLanguage, 
    user,
    onConsultAssistant 
}) => {
    const [view, setView] = useState<'upload' | 'camera' | 'loading' | 'results' | 'error' | 'dashboard'>('upload');
    const [analysisResult, setAnalysisResult] = useState<PlantAnalysisReport | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [displayLang, setDisplayLang] = useState<Language>(currentLanguage);
    const [isDragging, setIsDragging] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isKn = displayLang === Language.KN;

    const performAnalysis = useCallback(async (imageDataUrl: string, mimeType: string = 'image/jpeg') => {
        setView('loading');
        setUploadedImage(imageDataUrl);
        setLoadingStage(0);

        // Simulated progress steps for telemetry
        const interval = setInterval(() => {
            setLoadingStage(prev => (prev < 3 ? prev + 1 : prev));
        }, 1200);

        try {
            const base64Image = fileToBase64(imageDataUrl);
            const result = await getPlantDiseaseAnalysis(base64Image, mimeType);
            setAnalysisResult(result);
            clearInterval(interval);
            setView('results');

            // Save scan record to Firestore disease_logs
            if (user?.id) {
                try {
                    await diseaseLogService.saveScanLog(
                        user.id,
                        user.fullName || 'Farmer',
                        user.location || 'Karnataka, India',
                        result.cropName?.en || 'Crop',
                        result
                    );
                } catch (logErr) {
                    console.warn('Failed to persist scan to Firestore disease_logs:', logErr);
                }
            }
        } catch (err: any) {
            clearInterval(interval);
            console.error("Plant Analysis Error:", err);
            setErrorMessage(err.message || texts.errorAnalysis || "Pathology analysis could not complete. Please verify the leaf image and try again.");
            setView('error');
        }
    }, [texts.errorAnalysis, user]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const dataUrl = await fileToDataURL(file);
            performAnalysis(dataUrl, file.type);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const dataUrl = await fileToDataURL(file);
            performAnalysis(dataUrl, file.type);
        }
    };

    const handleSampleSelect = async (sample: typeof SAMPLE_LEAF_DATASETS[0]) => {
        try {
            // Fetch sample image and convert to Data URL
            setView('loading');
            const res = await fetch(sample.image);
            const blob = await res.blob();
            const dataUrl = await fileToDataURL(new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' }));
            performAnalysis(dataUrl, 'image/jpeg');
        } catch (err) {
            console.warn("Could not load sample image directly, analyzing with fallback:", err);
            performAnalysis(sample.image, 'image/jpeg');
        }
    };

    const handleReset = () => {
        setAnalysisResult(null);
        setUploadedImage(null);
        setErrorMessage('');
        setView('upload');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const loadingStagesText = isKn ? [
        "ಚಿತ್ರವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
        "ಎಲೆ ರೋಗಶಾಸ್ತ್ರ ಮತ್ತು ಮಾದರಿಗಳನ್ನು ಗುರುತಿಸಲಾಗುತ್ತಿದೆ...",
        "50,000+ ರೋಗಗಳ ಡೇಟಾಸೆಟ್‌ಗೆ ಹೋಲಿಸಲಾಗುತ್ತಿದೆ...",
        "ಸಾವಯವ ಮತ್ತು ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ ಶಿಫಾರಸುಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ..."
    ] : [
        "Analyzing leaf visual morphology...",
        "Extracting lesion patterns & cellular discoloration...",
        "Evaluating against 50,000+ PlantVillage pathological models...",
        "Synthesizing organic & chemical treatment prescriptions..."
    ];

    return (
        <div className="w-full flex flex-col text-neutral-100 font-sans">
            {/* Top Lab Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80 mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        {isKn ? "ಬೆಳೆ ರೋಗ ಪತ್ತೆ ಮತ್ತು ಪರಿಹಾರ" : "Crop Disease Diagnosis & Treatment"}
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                        {isKn ? "ಎಲೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — ತಕ್ಷಣವೇ ಸಾವಯವ ಮತ್ತು ರಾಸಾಯನಿಕ ಪರಿಹಾರಗಳನ್ನು ಪಡೆಯಿರಿ." : "Upload or capture a leaf photo for instant deep-learning diagnosis and bilingual treatment protocols."}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                    {/* Language Switcher */}
                    <div className="flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 shadow-md">
                        <button
                            type="button"
                            onClick={() => setDisplayLang(Language.EN)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${displayLang === Language.EN ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'}`}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => setDisplayLang(Language.KN)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${displayLang === Language.KN ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'}`}
                        >
                            ಕನ್ನಡ
                        </button>
                    </div>

                    {/* Switch to Analytics Dashboard button */}
                    {view !== 'dashboard' && (
                        <Button
                            type="button"
                            onClick={() => setView('dashboard')}
                            variant="outline"
                            size="sm"
                            className="rounded-xl bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 gap-1.5 shadow-md"
                        >
                            <BarChart3 className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs hidden sm:inline">{isKn ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : "Analytics"}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {/* 1. UPLOAD VIEW */}
                {view === 'upload' && (
                    <motion.div
                        key="upload-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Drag and Drop Zone + Camera Trigger */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
                            {/* Upload Dropzone */}
                            <div 
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`md:col-span-8 group relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden backdrop-blur-xl ${isDragging ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]' : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/60 hover:bg-neutral-900/90'}`}
                            >
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                />

                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white mb-4 shadow-xl group-hover:scale-110 group-hover:border-emerald-500 transition-all">
                                    <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
                                </div>

                                <h3 className="text-base sm:text-lg font-bold text-white text-center mb-1">
                                    {isKn ? "ಎಲೆಯ ಫೋಟೋವನ್ನು ಇಲ್ಲಿ ಎಳೆಯಿರಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ" : "Drag & drop leaf photo or click to browse"}
                                </h3>
                                <p className="text-xs text-neutral-400 text-center max-w-sm mb-4">
                                    {isKn ? "JPG, PNG, WebP ಫೈಲ್‌ಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ (ಗರಿಷ್ಠ 15MB)" : "Supports high-resolution JPG, PNG, WEBP files up to 15MB"}
                                </p>

                                <span className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-white shadow-md transition-colors flex items-center gap-1.5">
                                    <FileImage className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{isKn ? "ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ" : "Choose Leaf Photo"}</span>
                                </span>
                            </div>

                            {/* Camera Scanner Trigger Card */}
                            <div 
                                onClick={() => setView('camera')}
                                className="md:col-span-4 group flex flex-col items-center justify-center p-8 rounded-3xl border border-neutral-800 hover:border-neutral-600 bg-gradient-to-br from-neutral-900/80 via-neutral-950 to-neutral-900 backdrop-blur-xl cursor-pointer hover:bg-neutral-900 transition-all shadow-xl text-center"
                            >
                                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-xl group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <h3 className="text-base font-bold text-white mb-1">
                                    {isKn ? "ಲೈವ್ ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನ್" : "Live Camera Scanner"}
                                </h3>
                                <p className="text-xs text-neutral-400 max-w-xs mb-4">
                                    {isKn ? "ನಿಮ್ಮ ಮೊಬೈಲ್ ಅಥವಾ ವೆಬ್‌ಕ್ಯಾಮ್ ಬಳಸಿ ತಕ್ಷಣ ಎಲೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ" : "Point camera at plant leaf with real-time HUD targeting guides"}
                                </p>

                                <span className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-black" />
                                    <span>{isKn ? "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ" : "Launch Camera"}</span>
                                </span>
                            </div>
                        </div>

                        {/* Quick 1-Click Sample Library */}
                        <div className="space-y-3 pt-4 border-t border-neutral-800/80">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-300 font-mono">
                                        {isKn ? "1-ಕ್ಲಿಕ್ ಮಾದರಿ ಪರೀಕ್ಷೆ (Sample Library)" : "1-Click Instant Test Library"}
                                    </h4>
                                </div>
                                <span className="text-[11px] text-neutral-500 font-mono">
                                    {isKn ? "ಪರೀಕ್ಷಿಸಲು ಯಾವುದೇ ಮಾದರಿಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ" : "Click any specimen to run test diagnosis"}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {SAMPLE_LEAF_DATASETS.map((sample) => (
                                    <div
                                        key={sample.id}
                                        onClick={() => handleSampleSelect(sample)}
                                        className="group relative rounded-2xl overflow-hidden border border-neutral-800 hover:border-emerald-500/50 bg-neutral-900/60 hover:bg-neutral-900 cursor-pointer transition-all shadow-lg transform hover:-translate-y-1"
                                    >
                                        <div className="aspect-[4/3] w-full overflow-hidden bg-black">
                                            <img 
                                                src={sample.image} 
                                                alt={sample.title} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            />
                                        </div>
                                        <div className="p-3">
                                            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 mb-1">
                                                {sample.crop}
                                            </span>
                                            <h5 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                                {isKn ? sample.titleKn : sample.title}
                                            </h5>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. CAMERA VIEW */}
                {view === 'camera' && (
                    <motion.div
                        key="camera-view"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <CameraCapture 
                            onCapture={(dataUrl) => performAnalysis(dataUrl, 'image/jpeg')} 
                            onBack={() => setView('upload')} 
                            texts={texts} 
                        />
                    </motion.div>
                )}

                {/* 3. LOADING & TELEMETRY VIEW */}
                {view === 'loading' && (
                    <motion.div
                        key="loading-view"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-6"
                    >
                        <div className="relative">
                            <span className="[&_canvas]:!size-24 flex items-center justify-center">
                                <ThinkingOrb state="solving" size={64} theme="dark" />
                            </span>
                        </div>

                        <div className="space-y-2 max-w-md">
                            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                {isKn ? "ಎಲೆ ರೋಗಶಾಸ್ತ್ರ ವಿಶ್ಲೇಷಣೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ..." : "Analyzing Plant Pathology..."}
                            </h3>
                            <p className="text-sm font-mono text-emerald-400 h-6">
                                {loadingStagesText[loadingStage] || loadingStagesText[0]}
                            </p>
                        </div>

                        {/* Pulsing telemetry bar */}
                        <div className="w-64 h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full"
                                animate={{ x: [-200, 250] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                style={{ width: '40%' }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* 4. RESULTS VIEW */}
                {view === 'results' && analysisResult && (
                    <motion.div
                        key="results-view"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <PlantAnalysisResult 
                            result={analysisResult} 
                            uploadedImage={uploadedImage || undefined} 
                            texts={texts} 
                            language={displayLang} 
                            onReset={handleReset}
                            onConsultAssistant={onConsultAssistant}
                        />
                    </motion.div>
                )}

                {/* 5. HISTORICAL DASHBOARD VIEW */}
                {view === 'dashboard' && (
                    <motion.div
                        key="dashboard-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <PlantHealthDashboard 
                            texts={texts} 
                            onBack={() => setView('upload')} 
                            language={displayLang} 
                        />
                    </motion.div>
                )}

                {/* 6. ERROR VIEW */}
                {view === 'error' && (
                    <motion.div
                        key="error-view"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-8 sm:p-12 text-center rounded-3xl bg-neutral-900/90 border border-red-500/30 max-w-lg mx-auto space-y-4 shadow-2xl"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {isKn ? "ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ" : "Diagnosis Could Not Complete"}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                            {errorMessage}
                        </p>
                        <Button 
                            type="button"
                            onClick={handleReset} 
                            className="bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl px-6 py-2.5 shadow-lg"
                        >
                            {isKn ? "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ" : "Try Again"}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlantAnalysis;
