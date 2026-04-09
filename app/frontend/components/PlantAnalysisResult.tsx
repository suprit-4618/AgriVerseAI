

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, Language, PlantAnalysisReport, HistoricalDataPoint } from '../types';
import Button from './common/Button';
import GaugeChart from './common/charts/GaugeChart';
import { CheckBadgeIcon, CheckIcon, DownloadIcon, SpeakerWaveIcon, SparklesIcon, ArrowLeftIcon, SpeakerXMarkIcon } from './common/IconComponents';
import BarChart from './common/charts/BarChart';
import DonutChart from './common/charts/DonutChart';
import RadarChart from './common/charts/RadarChart';
import LineChart from './common/charts/LineChart';
import { historicalData } from '../constants';
import AnimatedStepList from './AnimatedStepList';

const isKannada = (text: string): boolean => {
    if (!text) return false;
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if (charCode >= 0x0C80 && charCode <= 0x0CFF) return true;
    }
    return false;
};

const DashboardCard: React.FC<{ children: React.ReactNode, className?: string, delay?: number }> = ({ children, className, delay = 0 }) => (
    <motion.div
        className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
        {children}
    </motion.div>
);

interface PlantAnalysisResultProps {
    result: PlantAnalysisReport;
    uploadedImage: string;
    texts: UIStringContent;
    language: Language;
    onReset?: () => void;
}

const PlantAnalysisResult: React.FC<PlantAnalysisResultProps> = ({ result, uploadedImage, texts, language, onReset }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakError, setSpeakError] = useState<string | null>(null);

    const currentText = (localized: { en: string; kn: string; }) => localized ? localized[language] : '';
    const currentTextArray = (localized: { en: string[]; kn: string[]; }) => localized ? localized[language] : [];

    const handleSpeak = () => {
        setSpeakError(null);
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        if (!('speechSynthesis' in window)) {
            console.warn("Speech synthesis not supported.");
            setSpeakError("Speech synthesis is not supported on this device.");
            setTimeout(() => setSpeakError(null), 5000);
            return;
        }

        const reportSections = [
            result.isDiseaseFound ? `${texts.diseaseName}: ${currentText(result.diseaseName)}` : texts.healthyPlant,
            result.isDiseaseFound ? `${texts.severity}: ${currentText(result.severity)}` : '',
            result.isDiseaseFound ? `${texts.description}: ${currentText(result.description)}` : texts.healthyPlantDesc,
            result.isDiseaseFound && currentTextArray(result.symptoms).length > 0 ? `${texts.symptoms}: ${currentTextArray(result.symptoms).join('. ')}` : '',
            result.isDiseaseFound && currentTextArray(result.prevention).length > 0 ? `${texts.prevention}: ${currentTextArray(result.prevention).join('. ')}` : '',
            result.isDiseaseFound && currentText(result.treatment.medicineName) ? `${texts.treatment}: ${currentText(result.treatment.medicineName)}. ${texts.usageInstructions}: ${currentTextArray(result.treatment.usageInstructions).join('. ')}` : ''
        ].filter(Boolean);

        const fullReportText = reportSections.join('. ');
        if (!fullReportText.trim()) return;

        const speak = () => {
            const utterance = new SpeechSynthesisUtterance(fullReportText);
            const detectedLanguageIsKannada = isKannada(fullReportText);

            if (detectedLanguageIsKannada) {
                utterance.lang = 'kn-IN';
            } else {
                utterance.lang = 'en-US';
            }

            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const langPrefix = detectedLanguageIsKannada ? 'kn' : 'en';
                const langVoices = voices.filter(v => v.lang.startsWith(langPrefix));

                if (langVoices.length > 0) {
                    let bestVoice: SpeechSynthesisVoice | null = null;
                    let maxScore = -1;
                    for (const voice of langVoices) {
                        let score = 0;
                        const name = voice.name.toLowerCase();
                        if (name.includes('female') || name.includes('heera')) score += 10;
                        if (name.includes('google')) score += 5;
                        if (name.includes('microsoft')) score += 3;
                        if (voice.localService) score += 2;
                        if (score > maxScore) {
                            maxScore = score;
                            bestVoice = voice;
                        }
                    }
                    utterance.voice = bestVoice || langVoices[0];
                } else {
                    console.warn(`SpeechSynthesis: No explicit voices found for language '${langPrefix}'. Relying on browser default.`);
                }
            }

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (e) => {
                console.error("SpeechSynthesis Error:", e.error, "for report text.");
                setIsSpeaking(false);
            };

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = speak;
        } else {
            speak();
        }
    };

    const handleDownload = () => {
        window.print();
    };

    const topDetectionsData = result.topDetections?.map(d => ({
        name: currentText(d.disease),
        value: d.confidence * 100
    })) || [];

    const donutData = [
        { name: texts.affectedArea, value: result.affectedAreaPercentage },
        { name: texts.healthyArea, value: 100 - result.affectedAreaPercentage }
    ];

    const riskFactorData = result.riskFactors?.map(rf => ({
        label: currentText(rf.factor),
        value: rf.value
    })) || [];

    const severityValue = {
        'low': 25,
        'moderate': 60,
        'high': 90
    }[result.severity.en.toLowerCase()] || 0;


    if (!result.isDiseaseFound) {
        return (
            <motion.div
                className="p-6 text-center h-full flex flex-col justify-center items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <CheckBadgeIcon className="w-24 h-24 mx-auto text-green-500 animate-pulse-green" />
                <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{texts.healthyPlant}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{texts.healthyPlantDesc}</p>
                {onReset && (
                    <Button onClick={onReset} className="mt-6" variant="primary">
                        {texts.analyzeAnotherPlant}
                    </Button>
                )}
            </motion.div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 printable-area">
            {/* Header */}
            <div className="non-printable">
                <div className="flex justify-between items-start">
                    {onReset ? (
                        <Button onClick={onReset} variant="ghost" size="sm" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
                            {texts.analyzeAnotherPlant}
                        </Button>
                    ) : <div />}
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSpeak} variant="subtle" size="sm" leftIcon={isSpeaking ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}>
                                {isSpeaking ? texts.stopReading : texts.readAloud}
                            </Button>
                            <Button onClick={handleDownload} variant="primary" size="sm" leftIcon={<DownloadIcon className="w-5 h-5" />}>
                                {texts.downloadReport}
                            </Button>
                        </div>
                        <AnimatePresence>
                            {speakError &&
                                <motion.p
                                    className="text-xs text-red-500 mt-1"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {speakError}
                                </motion.p>
                            }
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="xl:col-span-1 space-y-6">
                    <DashboardCard delay={0.1}>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{texts.diseaseName}</h3>
                        <p className={`text-2xl font-bold mt-1 text-gray-900 dark:text-white ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {currentText(result.diseaseName)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Confidence: <span className="font-bold text-green-500">{(result.confidenceScore * 100).toFixed(0)}%</span></p>
                    </DashboardCard>
                    <DashboardCard className="relative aspect-square overflow-hidden" delay={0.2}>
                        <img src={uploadedImage} alt="Uploaded Plant" className="w-full h-full object-cover rounded-lg animate-root-grow" />
                        <div className="absolute inset-0 bg-red-500/20 rounded-lg pointer-events-none" style={{ maskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)' }}></div>
                    </DashboardCard>
                    <DashboardCard delay={0.3}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.symptoms}</h3>
                        <AnimatedStepList items={currentTextArray(result.symptoms)} language={language} />
                    </DashboardCard>
                </div>

                {/* Center Column */}
                <div className="xl:col-span-1 space-y-6">
                    <DashboardCard delay={0.4}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.topDetections}</h3>
                        <div className="h-48">
                            <BarChart data={topDetectionsData} />
                        </div>
                    </DashboardCard>
                    <div className="grid grid-cols-2 gap-6">
                        <DashboardCard className="flex flex-col items-center justify-center text-center" delay={0.5}>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.severity}</h3>
                            <GaugeChart value={severityValue} />
                        </DashboardCard>
                        <DashboardCard className="flex flex-col items-center justify-center text-center" delay={0.6}>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.affectedArea}</h3>
                            <DonutChart data={donutData} />
                        </DashboardCard>
                    </div>
                    <DashboardCard delay={0.7}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.riskFactors}</h3>
                        <div className="h-48">
                            <RadarChart data={riskFactorData} />
                        </div>
                    </DashboardCard>
                </div>

                {/* Right Column */}
                <div className="xl:col-span-1 space-y-6">
                    <DashboardCard delay={0.8}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.historicalData}</h3>
                        <div className="h-48">
                            <LineChart data={historicalData} />
                        </div>
                    </DashboardCard>
                    <DashboardCard delay={0.9}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <CheckIcon className="w-6 h-6 text-green-500" />{texts.prevention}
                        </h3>
                        <AnimatedStepList items={currentTextArray(result.prevention)} language={language} />
                    </DashboardCard>
                    <DashboardCard delay={1.0}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-blue-500" />{texts.treatment}
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mb-3">
                            <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300">{texts.medicineName}</h5>
                            <p className={`font-bold text-blue-900 dark:text-blue-200 ${language === 'kn' ? 'font-kannada' : ''}`}>{currentText(result.treatment.medicineName)}</p>
                        </div>
                        <AnimatedStepList items={currentTextArray(result.treatment.usageInstructions)} language={language} isNumbered={true} />
                    </DashboardCard>
                </div>
            </div>
        </div>
    );
};

export default PlantAnalysisResult;