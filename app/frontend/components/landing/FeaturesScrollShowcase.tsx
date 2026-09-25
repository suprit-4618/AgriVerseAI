import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BugIcon, 
    SparklesIcon, 
    BuildingIcon, 
    LayersIcon, 
    ArrowRightIcon, 
    CheckBadgeIcon, 
    SpeakerWaveIcon 
} from '../common/IconComponents';
import { useLanguage } from '../../context/LanguageContext';

interface FeatureItem {
    id: string;
    tag: string;
    index: string;
    title: string;
    subtitle: string;
    description: string;
    bullets: string[];
    actionText: string;
    actionKey: 'plant' | 'assistant' | 'market' | 'soil';
    badge: string;
    previewType: 'disease' | 'voice' | 'market' | 'soil';
}

const featuresListEn: FeatureItem[] = [
    {
        id: 'feat-vision',
        index: '01',
        tag: 'Computer Vision AI',
        badge: 'Sub-1.2s Latency',
        title: 'Instant Multimodal Crop Pathology Diagnostic',
        subtitle: 'Upload a leaf photo from any smartphone camera to diagnose fungal, bacterial, and pest attacks in real time.',
        description: 'Eliminates the catastrophic 8-day laboratory waiting gap. Powered by high-precision multimodal vision, the system instantly identifies pathogens, calculates disease severity, and generates dual organic and clinical intervention prescriptions in English and Kannada.',
        bullets: [
            'Zero lab delay — instant leaf symptom analysis at the farm edge',
            'Bilingual prescriptions: English and Kannada',
            'Dual actionable paths: Organic bio-pesticides & targeted chemical remedies',
            'Full disease audit history logged per farm plot'
        ],
        actionText: 'Test Plant Disease Scanner',
        actionKey: 'plant',
        previewType: 'disease'
    },
    {
        id: 'feat-voice',
        index: '02',
        tag: 'Bilingual Voice Engine',
        badge: 'Zero Subscriptions',
        title: 'Bhoomi AI: Voice-First Agronomy Advisory',
        subtitle: 'Speak naturally in Kannada or English to get instant advisory on fertilizers, weather shocks, and sowing seasons.',
        description: 'Built specifically for rural accessibility where typing on smartphone keyboards is a barrier. Uses high-fidelity neural audio streaming with strict domain guardrails—answering agricultural queries while politely filtering out irrelevant requests.',
        bullets: [
            'Hands-free voice recognition tuned for regional Kannada and Kanglish intent',
            'Single-queue Web Audio pipeline preventing overlapping or echo voices',
            'Strict domain guardrail: 100% focused on soil, crops, and market logistics',
            'Instant spoken voice playback in natural human tone'
        ],
        actionText: 'Talk to Bhoomi AI',
        actionKey: 'assistant',
        previewType: 'voice'
    },
    {
        id: 'feat-market',
        index: '03',
        tag: 'Fair-Trade Network',
        badge: '0% Brokerage',
        title: 'Direct-to-Buyer Sovereign Mandi Marketplace',
        subtitle: 'Connect farmers directly with verified commercial buyers, millers, and retailers without commission agents.',
        description: 'Bypasses traditional APMC middleman cartels. Farmers post produce with quantity, variety, and photos; buyers place direct bids or purchase at transparent farmgate prices backed by live government mandi benchmark syncing.',
        bullets: [
            'Direct peer-to-peer farmer-to-buyer transactions with zero platform commission',
            'Real-time Karnataka APMC Mandi commodity price benchmark sync',
            'Live order status tracking (Listing -> Bid -> Dispatched -> Delivered)',
            'Admin-monitored price fair-play and listing verification'
        ],
        actionText: 'Explore Marketplace',
        actionKey: 'market',
        previewType: 'market'
    },
    {
        id: 'feat-soil',
        index: '04',
        tag: 'Soil & Climate Intelligence',
        badge: 'Precision Analytics',
        title: 'Predictive Soil Health & Micro-Climate Engine',
        subtitle: 'Optimize fertilizer schedules and harvest timing with hyperlocal meteorological and soil chemistry insights.',
        description: 'Breaks the cycle of blind fertilizer over-application and soil salinity. Delivers customized NPK balancing and moisture management guides tailored to local soil topographies and 7-day micro-weather forecasts.',
        bullets: [
            'Hyperlocal weather forecasting with unseasonal precipitation alerts',
            'Soil nutrient deficiency diagnostic and pH re-balancing guides',
            'Crop-yield suitability mapping based on regional soil types',
            'Historical farm telemetry tracking to reverse soil degradation'
        ],
        actionText: 'Run Soil Health Check',
        actionKey: 'soil',
        previewType: 'soil'
    }
];

const featuresListKn: FeatureItem[] = [
    {
        id: 'feat-vision',
        index: '01',
        tag: 'ಕಂಪ್ಯೂಟರ್ ವಿಷನ್ ಎಐ',
        badge: '೧.೨ ಸೆಕೆಂಡ್ ವೇಗ',
        title: 'ತ್ವರಿತ ಬೆಳೆ ರೋಗ ತಪಾಸಣೆ',
        subtitle: 'ಶಿಲೀಂಧ್ರ, ಬ್ಯಾಕ್ಟೀರಿಯಾ ಮತ್ತು ಕೀಟಗಳ ಹಾವಳಿಯನ್ನು ನೈಜ ಸಮಯದಲ್ಲಿ ಪತ್ತೆಹಚ್ಚಲು ಯಾವುದೇ ಸ್ಮಾರ್ಟ್‌ಫೋನ್‌ನಿಂದ ಎಲೆಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
        description: 'ಪ್ರಯೋಗಾಲಯದ ವಿಳಂಬವನ್ನು ನಿವಾರಿಸುತ್ತದೆ. ನಿಖರವಾದ ಎಐ ತಂತ್ರಜ್ಞಾನದೊಂದಿಗೆ ರೋಗದ ತೀವ್ರತೆಯನ್ನು ಲೆಕ್ಕಹಾಕಿ ಸಾವಯವ ಮತ್ತು ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸಾ ಪರಿಹಾರಗಳನ್ನು ನೀಡುತ್ತದೆ.',
        bullets: [
            'ಪ್ರಯೋಗಾಲಯದ ವಿಳಂಬವಿಲ್ಲದೆ ತಕ್ಷಣದ ಎಲೆ ರೋಗ ವಿಶ್ಲೇಷಣೆ',
            'ದ್ವಿಭಾಷಾ ಚಿಕಿತ್ಸಾ ಮಾಹಿತಿ: ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್',
            'ಸಾವಯವ ಜೈವಿಕ ಕೀಟನಾಶಕಗಳು ಮತ್ತು ರಾಸಾಯನಿಕ ಪರಿಹಾರಗಳು',
            'ಪ್ರತಿ ಜಮೀನಿನ ರೋಗ ತಪಾಸಣೆ ಇತಿಹಾಸ ಸಂಗ್ರಹ'
        ],
        actionText: 'ಸಸ್ಯ ರೋಗ ಸ್ಕ್ಯಾನರ್ ಪರೀಕ್ಷಿಸಿ',
        actionKey: 'plant',
        previewType: 'disease'
    },
    {
        id: 'feat-voice',
        index: '02',
        tag: 'ದ್ವಿಭಾಷಾ ಧ್ವನಿ ಸಹಾಯಕ',
        badge: 'ಉಚಿತ ಸೇವೆ',
        title: 'ಭೂಮಿ ಎಐ: ಧ್ವನಿ ಆಧಾರಿತ ಕೃಷಿ ಸಲಹೆ',
        subtitle: 'ಗೊಬ್ಬರ, ಹವಾಮಾನ ಮತ್ತು ಬಿತ್ತನೆ ಋತುಗಳ ಬಗ್ಗೆ ತ್ವರಿತ ಸಲಹೆ ಪಡೆಯಲು ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಸುಲಭವಾಗಿ ಮಾತನಾಡಿ.',
        description: 'ಟೈಪ್ ಮಾಡುವ ಅಗತ್ಯವಿಲ್ಲದೆ ಗ್ರಾಮೀಣ ರೈತರಿಗೆ ಸುಲಭವಾಗಿ ಲಭ್ಯವಾಗುವಂತೆ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.',
        bullets: [
            'ಕನ್ನಡ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ',
            'ಸ್ಪಷ್ಟ ಆಡಿಯೊ ಸಂಭಾಷಣೆ',
            'ಮಣ್ಣು, ಬೆಳೆಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿಯ ಮೇಲೆ ಸಂಪೂರ್ಣ ಗಮನ',
            'ನೈಸರ್ಗಿಕ ಧ್ವನಿಯಲ್ಲಿ ತ್ವರಿತ ಪ್ರತಿಕ್ರಿಯೆ'
        ],
        actionText: 'ಭೂಮಿ ಎಐ ಜೊತೆ ಮಾತನಾಡಿ',
        actionKey: 'assistant',
        previewType: 'voice'
    },
    {
        id: 'feat-market',
        index: '03',
        tag: 'ನೇರ ಮಾರುಕಟ್ಟೆ',
        badge: '೦% ಕಮಿಷನ್',
        title: 'ನೇರ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ವ್ಯಾಪಾರ',
        subtitle: 'ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ ಪರಿಶೀಲಿಸಿದ ವ್ಯಾಪಾರಿಗಳು, ಗಿರಣಿ ಮಾಲೀಕರು ಮತ್ತು ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳೊಂದಿಗೆ ರೈತರನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.',
        description: 'ಮಧ್ಯವರ್ತಿಗಳ ಶೋಷಣೆ ತಪ್ಪಿಸಿ. ರೈತರು ತಮ್ಮ ಬೆಳೆಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡುತ್ತಾರೆ ಮತ್ತು ಖರೀದಿದಾರರು ನೇರವಾಗಿ ಬಿಡ್ ಮಾಡುತ್ತಾರೆ.',
        bullets: [
            'ಶೂನ್ಯ ಕಮಿಷನ್‌ನೊಂದಿಗೆ ನೇರ ರೈತ-ಖರೀದಿದಾರ ವಹಿವಾಟು',
            'ಕರ್ನಾಟಕ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ನೈಜ ಬೆಲೆಗಳ ಮಾಹಿತಿ',
            'ನೈಜ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕಿಂಗ್ ವ್ಯವಸ್ಥೆ',
            'ಪಾರದರ್ಶಕ ಬೆಲೆ ನಿರ್ಧಾರ'
        ],
        actionText: 'ಮಾರುಕಟ್ಟೆಯನ್ನು ವೀಕ್ಷಿಸಿ',
        actionKey: 'market',
        previewType: 'market'
    },
    {
        id: 'feat-soil',
        index: '04',
        tag: 'ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನ ಮಾಹಿತಿ',
        badge: 'ನಿಖರ ವಿಶ್ಲೇಷಣೆ',
        title: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಮತ್ತು ಸ್ಥಳೀಯ ಹವಾಮಾನ',
        subtitle: 'ಸ್ಥಳೀಯ ಹವಾಮಾನ ಮತ್ತು ಮಣ್ಣಿನ ಪೋಷಕಾಂಶಗಳ ಮಾಹಿತಿಯೊಂದಿಗೆ ರಸಗೊಬ್ಬರ ಮತ್ತು ಕೊಯ್ಲಿನ ಸಮಯವನ್ನು ಯೋಜಿಸಿ.',
        description: 'ಅತಿಯಾದ ರಸಗೊಬ್ಬರ ಬಳಕೆಯನ್ನು ತಡೆದು ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಕಾಪಾಡಲು ಎನ್‌ಪಿಕೆ ಸಮತೋಲನ ಮಾರ್ಗದರ್ಶನ.',
        bullets: [
            'ಅಕಾಲಿಕ ಮಳೆ ಎಚ್ಚರಿಕೆಯೊಂದಿಗೆ ಸ್ಥಳೀಯ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ',
            'ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ ಕೊರತೆ ಪತ್ತೆ ಮತ್ತು ಪಿಹೆಚ್ ಸುಧಾರಣೆ',
            'ಮಣ್ಣಿನ ಪ್ರಕಾರಕ್ಕೆ ತಕ್ಕಂತೆ ಬೆಳೆ ಶಿಫಾರಸು',
            'ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಸುಧಾರಣಾ ಮಾರ್ಗಗಳು'
        ],
        actionText: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಪರೀಕ್ಷಿಸಿ',
        actionKey: 'soil',
        previewType: 'soil'
    }
];

export const FeaturesScrollShowcase: React.FC<{
    onPlantClick: () => void;
    onAssistantClick: () => void;
    onMarketplaceClick: () => void;
    onSoilClick: () => void;
}> = ({ onPlantClick, onAssistantClick, onMarketplaceClick, onSoilClick }) => {
    const { isKannada } = useLanguage();
    const [activeTab, setActiveTab] = useState<number>(0);

    const featuresList = isKannada ? featuresListKn : featuresListEn;

    const handleAction = (key: 'plant' | 'assistant' | 'market' | 'soil') => {
        switch (key) {
            case 'plant': onPlantClick(); break;
            case 'assistant': onAssistantClick(); break;
            case 'market': onMarketplaceClick(); break;
            case 'soil': onSoilClick(); break;
        }
    };

    const currentFeature = featuresList[activeTab] || featuresList[0];

    return (
        <section className="bg-neutral-950 text-white py-28 border-t border-neutral-900 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3 border border-neutral-800 px-4 py-1.5 rounded-full bg-black">
                        {isKannada ? 'ತಂತ್ರಜ್ಞಾನ ಪರಿಹಾರಗಳು' : 'Engineered Interventions'}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-5">
                        {isKannada ? 'ಅಗ್ರಿವರ್ಸ್ ಎಐ ವ್ಯವಸ್ಥೆ' : 'The AgriVerse Architecture'}
                    </h2>
                    <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                        {isKannada 
                            ? 'ರೈತರಿಗೆ ಯಾವುದೇ ಶುಲ್ಕವಿಲ್ಲದೆ ಕೃಷಿ ದಕ್ಷತೆಯನ್ನು ಹೆಚ್ಚಿಸಲು ನಿಖರ ಎಐ ರೋಗ ಪತ್ತೆ ಮತ್ತು ನೇರ ಮಾರುಕಟ್ಟೆ ಪರಿಹಾರಗಳು.' 
                            : 'Precision AI diagnostics and transparent peer-to-peer market protocols engineered to dismantle agricultural inefficiencies at zero cost to growers.'}
                    </p>
                </div>

                {/* Interactive Navigation Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-16 max-w-4xl mx-auto">
                    {featuresList.map((feat, idx) => {
                        const isActive = activeTab === idx;
                        return (
                            <button
                                key={feat.id}
                                onClick={() => setActiveTab(idx)}
                                className={`px-5 py-3 rounded-xl font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 border ${
                                    isActive 
                                        ? 'bg-white text-black font-bold border-white shadow-xl transform -translate-y-0.5' 
                                        : 'bg-black text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
                                }`}
                            >
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                    isActive ? 'bg-black text-white' : 'bg-neutral-900 text-neutral-400'
                                }`}>
                                    {feat.index}
                                </span>
                                <span>{feat.tag}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Feature Showcase Container */}
                <div className="bg-black border border-neutral-800 rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentFeature.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
                        >
                            {/* Feature Description (7 cols) */}
                            <div className="lg:col-span-7 flex flex-col items-start">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="font-mono text-xs font-bold px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-white">
                                        {isKannada ? 'ವಿಭಾಗ #' : 'MODULE #'}{currentFeature.index}
                                    </span>
                                    <span className="font-mono text-xs px-3 py-1 bg-neutral-900 text-neutral-300 border border-neutral-800 rounded">
                                        {currentFeature.badge}
                                    </span>
                                </div>

                                <h3 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mb-3">
                                    {currentFeature.title}
                                </h3>

                                <p className="text-sm font-medium text-neutral-300 italic mb-6 border-l-2 border-white pl-4">
                                    {currentFeature.subtitle}
                                </p>

                                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6">
                                    {currentFeature.description}
                                </p>

                                {/* Feature Bullet Points */}
                                <div className="space-y-3 mb-8 w-full">
                                    {currentFeature.bullets.map((bullet, bIdx) => (
                                        <div key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-300">
                                            <div className="w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                            </div>
                                            <span>{bullet}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Trigger CTA Button */}
                                <button
                                    onClick={() => handleAction(currentFeature.actionKey)}
                                    className="bg-white text-black hover:bg-neutral-200 font-mono font-bold px-8 py-3.5 rounded-xl uppercase tracking-wider text-xs transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-2xl"
                                >
                                    <span>{currentFeature.actionText}</span>
                                    <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Feature Live Interactive Visualizer Preview (5 cols) */}
                            <div className="lg:col-span-5 w-full">
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl font-mono">
                                    {/* Terminal Header */}
                                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-5 text-[11px] text-neutral-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                                            <span className="ml-2 uppercase text-white font-bold">{currentFeature.tag}</span>
                                        </div>
                                        <span className="text-[10px] text-neutral-400">{isKannada ? 'ನೈಜ ಮಾದರಿ' : 'LIVE DEMO'}</span>
                                    </div>

                                    {/* Visualizer Body based on Type */}
                                    {currentFeature.previewType === 'disease' && (
                                        <div className="space-y-4">
                                            <div className="relative rounded-xl overflow-hidden border border-neutral-800 h-44 bg-neutral-900">
                                                <img 
                                                    src="/story-disease.jpg" 
                                                    alt="Leaf Diagnostic Scan"
                                                    className="w-full h-full object-cover grayscale contrast-125"
                                                />
                                                <div className="absolute top-3 right-3 bg-black/90 px-2.5 py-1 rounded text-[10px] border border-white/20 text-white font-bold">
                                                    {isKannada ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ: ೯೮.೪%' : 'CONFIDENCE: 98.4%'}
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 bg-black/90 p-2.5 border-t border-white/10 text-xs">
                                                    <span className="text-white font-bold">{isKannada ? 'ರೋಗ ನಿರ್ಣಯ: ' : 'DIAGNOSIS: '}</span>
                                                    <span className="text-neutral-300">{isKannada ? 'ಆರಂಭಿಕ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ' : 'Early Leaf Blight'}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                                                    <div className="text-neutral-400 text-[9px] uppercase">{isKannada ? 'ತೀವ್ರತೆ' : 'Severity'}</div>
                                                    <div className="text-white font-bold">{isKannada ? 'ಮಧ್ಯಮ (ಹಂತ ೨)' : 'Moderate (Stage 2)'}</div>
                                                </div>
                                                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                                                    <div className="text-neutral-400 text-[9px] uppercase">{isKannada ? 'ಪರಿಹಾರ' : 'Remedy Type'}</div>
                                                    <div className="text-white font-bold">{isKannada ? 'ಬೇವಿನ ಎಣ್ಣೆ + ಜೈವಿಕ ಶಿಲೀಂಧ್ರನಾಶಕ' : 'Neem Extract + Bio-Fungicide'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentFeature.previewType === 'voice' && (
                                        <div className="space-y-4">
                                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                                                        {isKannada ? 'KN' : 'EN'}
                                                    </div>
                                                    <div className="text-xs text-neutral-300">
                                                        {isKannada ? '"ಹತ್ತಿ ಬೆಳೆಯಲ್ಲಿ ಗುಲಾಬಿ ಹುಳು ನಿಯಂತ್ರಣ ಹೇಗೆ?"' : '"How to control pink bollworm in cotton?"'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center">
                                                        <SparklesIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-xs text-white font-sans leading-relaxed">
                                                        {isKannada 
                                                            ? 'ಬೆಳೆಗೆ ಫೆರೋಮೋನ್ ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ, ೪೫ ದಿನಗಳಲ್ಲಿ ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ.' 
                                                            : 'Install pheromone traps across the field and apply neem-based spray within 45 days.'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-3 rounded-lg text-[11px]">
                                                <div className="flex items-center gap-2">
                                                    <SpeakerWaveIcon className="w-4 h-4 text-white" />
                                                    <span className="text-neutral-300">{isKannada ? 'ಆಡಿಯೋ ಸ್ಟ್ರೀಮ್: ಸಕ್ರಿಯ' : 'Audio Queue: Active'}</span>
                                                </div>
                                                <span className="text-white font-bold">{isKannada ? 'ಧ್ವನಿ ಪ್ರಸಾರ' : 'Neural Audio Stream'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {currentFeature.previewType === 'market' && (
                                        <div className="space-y-3">
                                            <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl flex justify-between items-center text-xs">
                                                <div>
                                                    <div className="font-bold text-white uppercase">{isKannada ? 'ಬಿಟಿ-ಹತ್ತಿ (ಹಾವೇರಿ ಎಪಿಎಂಸಿ)' : 'Bt-Cotton (Haveri APMC)'}</div>
                                                    <div className="text-[10px] text-neutral-400">{isKannada ? 'ಸರ್ಕಾರಿ ಎಂಎಸ್‌ಪಿ: ₹೭,೧೨೦ / ಕ್ವಿಂ' : 'Govt MSP: ₹7,120 / Quintal'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-white font-bold">{isKannada ? '₹೭,೪೨೦ / ಕ್ವಿಂ' : '₹7,420 / Qtl'}</div>
                                                    <div className="text-[10px] text-neutral-400">{isKannada ? '+₹೩೦೦ ಬೆಂಬಲ ಬೆಲೆಗಿಂತ ಹೆಚ್ಚು' : '+₹300 over MSP'}</div>
                                                </div>
                                            </div>
                                            <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl flex justify-between items-center text-xs">
                                                <div>
                                                    <div className="font-bold text-white uppercase">{isKannada ? 'ಟೊಮೆಟೊ ಗ್ರೇಡ್-ಎ (ಕೋಲಾರ ಎಪಿಎಂಸಿ)' : 'Tomato Grade-A (Kolar APMC)'}</div>
                                                    <div className="text-[10px] text-neutral-400">{isKannada ? 'ನೇರ ಖರೀದಿ ಬಿಡ್‌ಗಳು' : 'Direct Buyer Bids'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-white font-bold">{isKannada ? '₹೨,೧೦೦ / ಕ್ವಿಂ' : '₹2,100 / Qtl'}</div>
                                                    <div className="text-[10px] text-neutral-400">{isKannada ? '೦% ಕಮಿಷನ್' : '0% Commission'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentFeature.previewType === 'soil' && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                                                <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-lg">
                                                    <div className="text-neutral-500">N (Nitrogen)</div>
                                                    <div className="text-white font-bold mt-0.5">240 kg/ha</div>
                                                    <div className="text-neutral-400 text-[9px]">{isKannada ? 'ಸಾಧಾರಣ' : 'Medium'}</div>
                                                </div>
                                                <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-lg">
                                                    <div className="text-neutral-500">P (Phosphorus)</div>
                                                    <div className="text-white font-bold mt-0.5">18 kg/ha</div>
                                                    <div className="text-neutral-400 text-[9px]">{isKannada ? 'ಕಡಿಮೆ' : 'Low'}</div>
                                                </div>
                                                <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-lg">
                                                    <div className="text-neutral-500">K (Potassium)</div>
                                                    <div className="text-white font-bold mt-0.5">310 kg/ha</div>
                                                    <div className="text-white font-bold text-[9px]">{isKannada ? 'ಉತ್ತಮ' : 'Optimal'}</div>
                                                </div>
                                            </div>
                                            <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg text-[11px] flex justify-between items-center">
                                                <span className="text-neutral-400">{isKannada ? 'ಮಣ್ಣಿನ ಪಿಹೆಚ್ ಸೂಚ್ಯಂಕ' : 'Soil pH Index'}</span>
                                                <span className="text-white font-bold">6.8 ({isKannada ? 'ತಟಸ್ಥ ಫಲವತ್ತತೆ' : 'Neutral-Ideal'})</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

export default FeaturesScrollShowcase;
