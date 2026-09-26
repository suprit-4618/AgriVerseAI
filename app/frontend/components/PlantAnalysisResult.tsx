import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, Language, PlantAnalysisReport } from '../types';
import { Button } from './ui/button';
import { generateDiseaseExplanationAudio } from '../services/geminiService';
import {
    CheckCircle2, AlertTriangle, ShieldAlert, Sparkles,
    Volume2, VolumeX, Printer, RotateCcw,
    Leaf, FlaskConical, ShieldCheck, ListChecks,
    Activity, Gauge, Droplets, Wind, Thermometer,
    Loader2
} from 'lucide-react';

const isKannada = (text: string): boolean => {
    if (!text) return false;
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if (charCode >= 0x0C80 && charCode <= 0x0CFF) return true;
    }
    return false;
};

// Audio decoding helpers for Google AI Studio audio
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const convertPCM16ToFloat32 = (pcmData: ArrayBuffer): Float32Array => {
    const int16Array = new Int16Array(pcmData);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
    }
    return float32Array;
};

interface PlantAnalysisResultProps {
    result: PlantAnalysisReport;
    uploadedImage?: string;
    texts: UIStringContent;
    language?: Language;
    onReset?: () => void;
    onConsultAssistant?: (diseaseName: string) => void;
}

const PlantAnalysisResult: React.FC<PlantAnalysisResultProps> = ({ 
    result, 
    uploadedImage, 
    texts, 
    language = Language.EN, 
    onReset,
    onConsultAssistant
}) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [activeTreatmentTab, setActiveTreatmentTab] = useState<'organic' | 'chemical' | 'prevention'>('organic');

    const audioContextRef = useRef<AudioContext | null>(null);
    const activeSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const getAudioContext = (): AudioContext => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(err => console.error("AudioContext resume error:", err));
        }
        return audioContextRef.current;
    };

    const stopAudio = () => {
        if (activeSourceNodeRef.current) {
            try {
                activeSourceNodeRef.current.stop();
                activeSourceNodeRef.current.disconnect();
            } catch {}
            activeSourceNodeRef.current = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsLoadingAudio(false);
    };

    useEffect(() => {
        return () => {
            stopAudio();
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
                audioContextRef.current = null;
            }
        };
    }, []);

    const currentText = (localized?: { en: string; kn: string; }) => {
        if (!localized) return '';
        return language === Language.KN ? (localized.kn || localized.en) : (localized.en || localized.kn);
    };

    const currentTextArray = (localized?: { en: string[]; kn: string[]; }) => {
        if (!localized) return [];
        return language === Language.KN ? (localized.kn || localized.en || []) : (localized.en || localized.kn || []);
    };

    const isKn = language === Language.KN;
    const confidencePct = Math.round((result.confidenceScore || 0.95) * 100);
    const affectedPct = result.affectedAreaPercentage || 30;

    const severityKey = (result.severity?.en || 'Moderate').toLowerCase();
    const isHealthy = !result.isDiseaseFound;

    const getSeverityBadge = () => {
        if (isHealthy) {
            return {
                bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
                label: isKn ? "ಆರೋಗ್ಯಕರ ಸಸ್ಯ" : "Healthy Crop",
            };
        }
        if (severityKey.includes('high') || severityKey.includes('severe')) {
            return {
                bg: "bg-red-500/10 text-red-400 border-red-500/30",
                icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
                label: isKn ? "ಹೆಚ್ಚಿನ ತೀವ್ರತೆ (High Severity)" : "High Severity",
            };
        }
        if (severityKey.includes('low')) {
            return {
                bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
                icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
                label: isKn ? "ಕಡಿಮೆ ತೀವ್ರತೆ (Low Severity)" : "Low Severity",
            };
        }
        return {
            bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
            icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
            label: isKn ? "ಮಧ್ಯಮ ತೀವ್ರತೆ (Moderate Severity)" : "Moderate Severity",
        };
    };

    const severityInfo = getSeverityBadge();

    // Voice Readout powered by Google AI Studio Gemini API
    const handleSpeak = async () => {
        if (isSpeaking || isLoadingAudio) {
            stopAudio();
            return;
        }

        setIsLoadingAudio(true);

        try {
            // 1. Request Gemini Google AI Studio Audio model explanation
            const base64Audio = await generateDiseaseExplanationAudio(result, language);

            if (base64Audio) {
                const ctx = getAudioContext();
                const arrayBuffer = base64ToArrayBuffer(base64Audio);

                let audioBuffer: AudioBuffer;
                try {
                    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
                } catch {
                    // Fallback to PCM16 at 24kHz
                    const float32Data = convertPCM16ToFloat32(arrayBuffer);
                    audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
                    audioBuffer.copyToChannel(float32Data, 0);
                }

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                activeSourceNodeRef.current = source;

                source.onended = () => {
                    activeSourceNodeRef.current = null;
                    setIsSpeaking(false);
                };

                setIsLoadingAudio(false);
                setIsSpeaking(true);
                source.start(0);
                return;
            }
        } catch (geminiAudioError) {
            console.warn("Gemini Audio error, falling back to Web Speech:", geminiAudioError);
        }

        // Fallback: Browser Web Speech
        setIsLoadingAudio(false);
        if (!('speechSynthesis' in window)) return;

        const reportSections = [
            result.isDiseaseFound ? `${texts.diseaseName || 'Diagnosis'}: ${currentText(result.diseaseName)}` : (texts.healthyPlant || 'Healthy Plant'),
            result.isDiseaseFound ? `${texts.severity || 'Severity'}: ${currentText(result.severity)}` : '',
            result.isDiseaseFound ? currentText(result.description) : (texts.healthyPlantDesc || 'No pathological disease detected.'),
            result.isDiseaseFound && currentText(result.treatment?.medicineName) ? `${texts.treatment || 'Treatment'}: ${currentText(result.treatment.medicineName)}. ${currentTextArray(result.treatment?.usageInstructions).join('. ')}` : ''
        ].filter(Boolean);

        const fullReportText = reportSections.join('. ');
        if (!fullReportText.trim()) return;

        const utterance = new SpeechSynthesisUtterance(fullReportText);
        utterance.lang = isKn ? 'kn-IN' : 'en-US';

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const langPrefix = isKn ? 'kn' : 'en';
            const bestVoice = voices.find(v => v.lang.startsWith(langPrefix));
            if (bestVoice) utterance.voice = bestVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handlePrint = () => {
        window.print();
    };

    const symptomsList = currentTextArray(result.symptoms);
    const preventionList = currentTextArray(result.prevention);
    const instructionsList = currentTextArray(result.treatment?.usageInstructions);

    return (
        <div className="space-y-6 text-neutral-100 font-sans printable-area">
            {/* Top Header Card */}
            <div className="relative overflow-hidden bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${severityInfo.bg}`}>
                                {severityInfo.icon}
                                <span>{severityInfo.label}</span>
                            </span>

                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-neutral-800 border border-neutral-700 text-neutral-300">
                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{confidencePct}% {isKn ? "ಖಚಿತತೆ" : "Confidence"}</span>
                            </span>

                            {result.cropName && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 border border-neutral-700 text-emerald-300">
                                    <Leaf className="w-3.5 h-3.5" />
                                    <span>{currentText(result.cropName)}</span>
                                </span>
                            )}
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            {currentText(result.diseaseName) || (isKn ? "ಆರೋಗ್ಯಕರ ಸಸ್ಯ" : "Healthy Plant")}
                        </h2>

                        <p className="text-sm text-neutral-300 leading-relaxed max-w-3xl">
                            {currentText(result.description) || (isKn ? "ಸಸ್ಯವು ರೋಗ ಲಕ್ಷಣಗಳಿಲ್ಲದೆ ಆರೋಗ್ಯಕರವಾಗಿದೆ." : "Plant shows normal physiological development with no active fungal or bacterial pathogens detected.")}
                        </p>
                    </div>

                    {/* Quick Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 non-printable shrink-0">
                        <Button
                            type="button"
                            onClick={handleSpeak}
                            disabled={isLoadingAudio}
                            variant="outline"
                            size="sm"
                            className={`rounded-xl border-neutral-700 gap-2 shadow-md transition-all ${
                                isSpeaking 
                                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                                    : 'bg-neutral-800/80 hover:bg-neutral-700 text-white'
                            }`}
                        >
                            {isLoadingAudio ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                    <span className="text-xs">{isKn ? "ಧ್ವನಿ ತಯಾರಿಸಲಾಗುತ್ತಿದೆ..." : "Generating Audio..."}</span>
                                </>
                            ) : isSpeaking ? (
                                <>
                                    <VolumeX className="w-4 h-4 text-red-400 animate-pulse" />
                                    <span className="text-xs">{isKn ? "ನಿಲ್ಲಿಸಿ" : "Stop"}</span>
                                </>
                            ) : (
                                <>
                                    <Volume2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs">{isKn ? "ಧ್ವನಿ ವಿವರಣೆ (Google AI)" : "Listen (Google AI)"}</span>
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            onClick={handlePrint}
                            variant="outline"
                            size="sm"
                            className="rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white border-neutral-700 gap-1.5 shadow-md"
                        >
                            <Printer className="w-4 h-4 text-neutral-300" />
                            <span className="text-xs">{isKn ? "ಮುದ್ರಿಸಿ" : "Print PDF"}</span>
                        </Button>

                        {onReset && (
                            <Button
                                type="button"
                                onClick={onReset}
                                size="sm"
                                className="rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold gap-1.5 shadow-md"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span className="text-xs">{isKn ? "ಮತ್ತೆ ಪರೀಕ್ಷಿಸಿ" : "New Scan"}</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Diagnostic Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Specimen Image & Metrics */}
                <div className="space-y-6">
                    {/* Specimen Photo Card */}
                    {uploadedImage && (
                        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-4 backdrop-blur-xl overflow-hidden shadow-xl">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                                    {isKn ? "ವಿಶ್ಲೇಷಿಸಿದ ಎಲೆಯ ಮಾದರಿ" : "Analyzed Leaf Specimen"}
                                </span>
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                    224×224 CNN Input
                                </span>
                            </div>

                            <div className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-neutral-800 bg-black">
                                <img 
                                    src={uploadedImage} 
                                    alt="Plant specimen" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 border border-neutral-700/60 backdrop-blur-md text-[11px] font-mono text-neutral-300">
                                    {isKn ? "ಹಾನಿಗೊಳಗಾದ ಪ್ರದೇಶ:" : "Affected Area:"} <span className="text-emerald-400 font-bold">{affectedPct}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diagnostic Probability Gauges */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <h4 className="text-xs font-bold font-mono uppercase text-neutral-300 flex items-center gap-1.5">
                                <Gauge className="w-4 h-4 text-emerald-400" />
                                {isKn ? "ಮಾದರಿ ಸಂಭವನೀಯತೆ ಸ್ಕೋರ್" : "Model Probability Breakdown"}
                            </h4>
                            <span className="text-xs font-mono text-emerald-400 font-bold">{confidencePct}%</span>
                        </div>

                        {/* Confidence Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-neutral-400 font-mono">
                                <span>{currentText(result.diseaseName)}</span>
                                <span className="text-white font-medium">{confidencePct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${confidencePct}%` }}
                                />
                            </div>
                        </div>

                        {/* Top Detections if available */}
                        {result.topDetections && result.topDetections.length > 1 && (
                            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                                <span className="text-[11px] font-mono text-neutral-400">
                                    {isKn ? "ಇತರ ಸಂಭಾವ್ಯ ವರ್ಗೀಕರಣಗಳು:" : "Alternative Classifications:"}
                                </span>
                                {result.topDetections.slice(1, 3).map((det, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs font-mono text-neutral-400">
                                        <span className="truncate max-w-[180px]">{currentText(det.disease)}</span>
                                        <span>{Math.round(det.confidence * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Environmental Risk Factors */}
                    {result.riskFactors && result.riskFactors.length > 0 && (
                        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-3">
                            <h4 className="text-xs font-bold font-mono uppercase text-neutral-300 flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                                <Thermometer className="w-4 h-4 text-amber-400" />
                                {isKn ? "ಪರಿಸರ ಅಪಾಯಕಾರಿ ಅಂಶಗಳು" : "Microclimate Risk Indicators"}
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {result.riskFactors.map((rf, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs font-mono">
                                        <div className="flex items-center gap-2">
                                            {i % 2 === 0 ? <Droplets className="w-3.5 h-3.5 text-blue-400" /> : <Wind className="w-3.5 h-3.5 text-emerald-400" />}
                                            <span className="text-neutral-300">{currentText(rf.factor)}</span>
                                        </div>
                                        <span className="text-neutral-400 font-bold">{Math.round(rf.value * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Prescriptions, Organic/Chemical Treatment Protocols */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Treatment Selector Tabs */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                        <div className="flex items-center gap-2 border-b border-neutral-800 pb-4 mb-5 non-printable overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTreatmentTab('organic')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeTreatmentTab === 'organic' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                            >
                                <Leaf className="w-4 h-4 text-emerald-400" />
                                <span>{isKn ? "ಸಾವಯವ ಪರಿಹಾರಗಳು" : "Organic Remedies"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTreatmentTab('chemical')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeTreatmentTab === 'chemical' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                            >
                                <FlaskConical className="w-4 h-4 text-blue-400" />
                                <span>{isKn ? "ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ" : "Chemical Prescriptions"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTreatmentTab('prevention')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeTreatmentTab === 'prevention' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                            >
                                <ShieldCheck className="w-4 h-4 text-purple-400" />
                                <span>{isKn ? "ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮಗಳು" : "Prevention & Care"}</span>
                            </button>
                        </div>

                        {/* TAB 1: Organic Remedies */}
                        {activeTreatmentTab === 'organic' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                                        <Leaf className="w-4 h-4" />
                                        <span>{isKn ? "ನೈಸರ್ಗಿಕ ಜೈವಿಕ ನಿಯಂತ್ರಣ" : "Biological & Botanical Formulations"}</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                                        {currentText(result.treatment?.organicRemedy) || (isKn 
                                            ? "ಬೇವು ಎಣ್ಣೆ (Neem Oil 5ml/L) ಅಥವಾ ಸೂಡೋಮೊನಾಸ್ ಫ್ಲೋರೆಸೆನ್ಸ್ (Pseudomonas fluorescens 10g/L) ದ್ರಾವಣವನ್ನು ಸಿಂಪಡಿಸಿ." 
                                            : "Apply 5ml/L Neem Seed Kernel Extract (NSKE) or spray Trichoderma viride / Pseudomonas fluorescens at 10g/L for natural fungal containment.")}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h5 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                                        {isKn ? "ಶಿಫಾರಸು ಮಾಡಲಾದ ಸಾವಯವ ಹಂತಗಳು:" : "Recommended Organic Steps:"}
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300">
                                            <span className="font-bold text-emerald-400 block mb-1">1. Neem Oil Spray</span>
                                            {isKn ? "ಸಂಜೆ ವೇಳೆ 5ml ಬೇವಿನ ಎಣ್ಣೆಯನ್ನು 1 ಲೀಟರ್ ನೀರಿಗೆ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ." : "Mix 5ml cold-pressed Neem Oil with 1ml liquid soap in 1L water; spray at sunset."}
                                        </div>
                                        <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300">
                                            <span className="font-bold text-emerald-400 block mb-1">2. Panchagavya Foliar</span>
                                            {isKn ? "3% ಪಂಚಗವ್ಯ ದ್ರಾವಣವನ್ನು ಸಿಂಪಡಿಸಿ ಸಸ್ಯದ ರೋಗನಿರೋಧಕ ಶಕ್ತಿಯನ್ನು ಹೆಚ್ಚಿಸಿ." : "Apply 3% fermented Panchagavya solution to boost plant systemic immunity."}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 2: Chemical Prescriptions */}
                        {activeTreatmentTab === 'chemical' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                                        <FlaskConical className="w-4 h-4" />
                                        <span>{isKn ? "ಶಿಫಾರಸು ಮಾಡಿದ ಔಷಧ" : "Prescribed Fungicide / Medicine"}</span>
                                    </div>
                                    <p className="text-base font-bold text-white">
                                        {currentText(result.treatment?.medicineName) || (isKn ? "ಮ್ಯಾಂಕೋಜೆಬ್ ಅಥವಾ ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್" : "Mancozeb 75% WP or Copper Oxychloride 50% WP")}
                                    </p>
                                </div>

                                {instructionsList.length > 0 && (
                                    <div className="space-y-2">
                                        <h5 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                                            {isKn ? "ಬಳಕೆಯ ಮಾರ್ಗಸೂಚಿಗಳು ಮತ್ತು ಪ್ರಮಾಣ:" : "Dosage & Spraying Schedule:"}
                                        </h5>
                                        <div className="space-y-2">
                                            {instructionsList.map((inst, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs sm:text-sm text-neutral-300">
                                                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs shrink-0 mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <span>{inst}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* TAB 3: Prevention & Cultural Practices */}
                        {activeTreatmentTab === 'prevention' && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="space-y-2">
                                    <h5 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                                        {isKn ? "ರೋಗ ಹರಡುವಿಕೆ ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳು:" : "Field Prevention & Sanitization:"}
                                    </h5>
                                    <div className="space-y-2">
                                        {preventionList.map((prev, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs sm:text-sm text-neutral-300">
                                                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                                <span>{prev}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Symptoms Checklist Card */}
                    {symptomsList.length > 0 && (
                        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wide text-neutral-200 flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-emerald-400" />
                                {isKn ? "ರೋಗದ ಲಕ್ಷಣಗಳು (Observed Symptoms)" : "Observed Pathological Symptoms"}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {symptomsList.map((sym, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/80 text-xs text-neutral-300 flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                                        <span>{sym}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bhoomi AI Consultation Action Banner */}
                    <div className="p-5 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 non-printable">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0 shadow-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">
                                    {isKn ? "ಭೂಮಿ AI ಜೊತೆ ಈ ರೋಗದ ಬಗ್ಗೆ ಮಾತನಾಡಿ" : "Discuss Diagnosis with Bhoomi AI"}
                                </h4>
                                <p className="text-xs text-neutral-400">
                                    {isKn ? "ಸ್ಥಳೀಯ ಔಷಧ ಲಭ್ಯತೆ, ರೋಗ ಪರಿಹಾರಗಳ ಬಗ್ಗೆ ತಕ್ಷಣ ಪ್ರಶ್ನೆ ಕೇಳಿ." : "Get instant answers on where to buy medicines, dosage, and crop recovery."}
                                </p>
                            </div>
                        </div>

                        {onConsultAssistant && (
                            <Button
                                type="button"
                                onClick={() => onConsultAssistant(currentText(result.diseaseName))}
                                className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shrink-0"
                            >
                                {isKn ? "AI ಸಲಹೆ ಪಡೆಯಿರಿ" : "Ask Bhoomi AI"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlantAnalysisResult;