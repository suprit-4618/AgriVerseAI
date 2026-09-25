"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, UserProfile, UIStringContent, ChatMessage } from '../types';
import { uiStrings } from '../constants';
import { getPlantDiseaseAnalysis, generateSpeech, getBhoomiResponseStream } from '../services/geminiService';
import { generateSarvamSpeech, transcribeSarvamAudio } from '../services/sarvamService';
import { getGroqBhoomiStream } from '../services/groqService';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Sparkles, Paperclip, ArrowUp, ArrowLeft, Mic, MicOff, Volume2, VolumeX,
    Sprout, TrendingUp, FlaskConical, CloudRain, Bug, Building2, X, Check,
    Copy, RotateCcw, Info, ShieldCheck, ArrowRight, UserCircle2, CornerDownLeft
} from 'lucide-react';
import LanguageToggle from './common/LanguageToggle';
import ListeningAnimation from './common/ListeningAnimation';
import GeneratingAnimation from './common/GeneratingAnimation';
import MarkdownRenderer from './common/MarkdownRenderer';
import PlantAnalysisResult from './PlantAnalysisResult';
import './BhoomiGalaxyTheme.css';

// Global declarations for Web Speech and Web Audio APIs
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
        webkitAudioContext: any;
    }
}

// Auto-resizing Textarea Hook
interface AutoResizeProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(textarea.scrollHeight, maxHeight ?? 160)
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
    }, [minHeight]);

    return { textareaRef, adjustHeight };
}

const fileToDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
});

const removeMarkdown = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^\s*[\-\*]\s/gm, '')
        .replace(/^\s*\d+\.\s/gm, '')
        .replace(/^#+\s/gm, '');
};

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

// Pure in-browser standard 16kHz 16-bit Mono PCM WAV Encoder
const encodeWAV = (samples: Float32Array, sampleRate: number = 16000): Blob => {
    const numChannels = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
};

// Real-Time In-Input Speech-to-Text Dictation Hook (WebSpeech API + 16kHz WAV Sarvam STT Fallback)
const useSpeechDictation = ({
    lang,
    onTextChange,
    getCurrentText,
    onCancelAudio
}: {
    lang: Language;
    onTextChange: (text: string) => void;
    getCurrentText: () => string;
    onCancelAudio?: () => void;
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Float32Array[]>([]);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const baseTextRef = useRef<string>('');
    const isListeningRef = useRef<boolean>(false);
    const activeMethodRef = useRef<'webspeech' | 'audioContext' | null>(null);

    const cleanup = useCallback(() => {
        if (scriptProcessorRef.current) {
            try { scriptProcessorRef.current.disconnect(); } catch {}
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try { audioContextRef.current.close(); } catch {}
            audioContextRef.current = null;
        }
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            recognitionRef.current = null;
        }
    }, []);

    const stopListening = useCallback(async () => {
        if (!isListeningRef.current) return;
        isListeningRef.current = false;
        setIsListening(false);

        if (activeMethodRef.current === 'webspeech' && recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
        } else if (activeMethodRef.current === 'audioContext') {
            cleanup();
            const totalSamples = audioChunksRef.current.reduce((acc, c) => acc + c.length, 0);
            if (totalSamples > 8000) {
                setIsTranscribing(true);
                try {
                    const merged = new Float32Array(totalSamples);
                    let offset = 0;
                    for (const chunk of audioChunksRef.current) {
                        merged.set(chunk, offset);
                        offset += chunk.length;
                    }
                    const wavBlob = encodeWAV(merged, 16000);
                    const sarvamTranscript = await transcribeSarvamAudio(wavBlob, lang);
                    setIsTranscribing(false);
                    if (sarvamTranscript && sarvamTranscript.trim()) {
                        const base = baseTextRef.current.trim();
                        const result = base ? `${base} ${sarvamTranscript.trim()}` : sarvamTranscript.trim();
                        onTextChange(result);
                    }
                } catch (err) {
                    setIsTranscribing(false);
                    console.warn("Sarvam STT fallback error:", err);
                }
            }
        }
        cleanup();
    }, [cleanup, lang, onTextChange]);

    const startListening = useCallback(async () => {
        cleanup();
        onCancelAudio?.();
        setSpeechError(null);
        baseTextRef.current = getCurrentText();
        isListeningRef.current = true;
        setIsListening(true);

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRec) {
            try {
                activeMethodRef.current = 'webspeech';
                const recognition = new SpeechRec();
                recognitionRef.current = recognition;
                recognition.lang = lang === Language.KN ? 'kn-IN' : 'en-IN';
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event: any) => {
                    let fullSpoken = '';
                    for (let i = 0; i < event.results.length; i++) {
                        fullSpoken += event.results[i][0].transcript;
                    }
                    const base = baseTextRef.current.trim();
                    const combined = base ? `${base} ${fullSpoken.trim()}` : fullSpoken.trim();
                    onTextChange(combined);
                };

                recognition.onerror = (event: any) => {
                    console.warn("WebSpeech recognition error:", event.error);
                    if (event.error === 'not-allowed') {
                        setSpeechError(lang === Language.KN ? "ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಿ." : "Microphone permission denied.");
                        isListeningRef.current = false;
                        setIsListening(false);
                    }
                };

                recognition.onend = () => {
                    if (isListeningRef.current) {
                        isListeningRef.current = false;
                        setIsListening(false);
                    }
                };

                recognition.start();
                return;
            } catch (recErr) {
                console.warn("SpeechRecognition init failed, falling back to AudioContext + Sarvam AI:", recErr);
            }
        }

        // Fallback: AudioContext + 16kHz WAV + Sarvam STT
        try {
            activeMethodRef.current = 'audioContext';
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            mediaStreamRef.current = stream;

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioCtx({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;
            audioChunksRef.current = [];

            processor.onaudioprocess = (e) => {
                if (!isListeningRef.current) return;
                const channelData = e.inputBuffer.getChannelData(0);
                audioChunksRef.current.push(new Float32Array(channelData));
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
        } catch (mediaErr: any) {
            console.error("Microphone access error:", mediaErr);
            isListeningRef.current = false;
            setIsListening(false);
            setSpeechError(lang === Language.KN ? "ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಿ." : "Microphone access denied.");
        }
    }, [cleanup, getCurrentText, lang, onCancelAudio, onTextChange]);

    const toggleListening = useCallback(() => {
        if (isListeningRef.current) {
            stopListening();
        } else {
            startListening();
        }
    }, [startListening, stopListening]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        isListening,
        isTranscribing,
        speechError,
        startListening,
        stopListening,
        toggleListening,
    };
};

const DEMO_PROMPT_LIMIT = 3;

const getStoredDemoCount = (): number => {
    try {
        const stored = sessionStorage.getItem('ava_bhoomi_demo_count') || localStorage.getItem('ava_bhoomi_demo_count');
        return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
        return 0;
    }
};

const setStoredDemoCount = (count: number) => {
    try {
        sessionStorage.setItem('ava_bhoomi_demo_count', count.toString());
        localStorage.setItem('ava_bhoomi_demo_count', count.toString());
    } catch {}
};

// Demo Limit / Auth Prompt Modal (Monochrome Dark Theme)
const AuthGateModal: React.FC<{
    currentLanguage: Language;
    onSignIn: () => void;
    onClose?: () => void;
}> = ({ currentLanguage, onSignIn, onClose }) => {
    const isKn = currentLanguage === Language.KN;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl overflow-hidden"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
            >
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-bold tracking-tight mb-2 text-white">
                    {isKn ? "ಉಚಿತ ಡೆಮೊ ಮಿತಿ ತಲುಪಿದೆ" : "Free Demo Limit Reached"}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
                    {isKn
                        ? "ನೀವು ಭೂಮಿ AI ಯ 3 ಉಚಿತ ಪ್ರಶ್ನೆಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ. ಅನಿಯಮಿತ ಧ್ವನಿ ಸಂಭಾಷಣೆಗಳು, ಬೆಳೆ ರೋಗ ರಕ್ಷಣೆ ಮತ್ತು ಮಂಡಿ ದರಗಳನ್ನು ಪಡೆಯಲು ಖಾತೆಗೆ ಲಾಗ್ ಇನ್ ಅಥವಾ ಸೈನ್ ಅಪ್ ಮಾಡಿ."
                        : "You've used all 3 free trial questions with Bhoomi AI. Create a free account or sign in to unlock unlimited voice consultations, crop health tracking, and live mandi rates."}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onSignIn}
                        className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-base shadow-lg transform hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                        <span>{isKn ? "ಸೈನ್ ಇನ್ / ನೋಂದಾಯಿಸಿ" : "Sign In / Register to Continue"}</span>
                        <ArrowRight className="w-5 h-5 text-black" />
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 px-4 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                        >
                            {isKn ? "ಮುಚ್ಚಿ" : "Close"}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

interface BhoomiAssistantProps {
    user?: UserProfile;
    currentLanguage: Language;
    setCurrentLanguage: (lang: Language) => void;
    isDemoMode?: boolean;
    onRequireAuth?: () => void;
    onClose?: () => void;
}

// Redesigned Monochrome Quick Action Pill Component
interface QuickActionPillProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

const QuickActionPill: React.FC<QuickActionPillProps> = ({ icon, label, onClick, disabled }) => {
    return (
        <Button
            type="button"
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white shadow-lg backdrop-blur-md transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
        >
            <span className="text-neutral-400">{icon}</span>
            <span className="text-xs sm:text-sm font-medium">{label}</span>
        </Button>
    );
};

// Assistant Home Screen (Clean Monochrome Celestial Design)
const AssistantHomeScreen: React.FC<{
    user?: UserProfile;
    texts: UIStringContent;
    currentLanguage: Language;
    onStartConversation: (p: string, a: File | null) => void;
    isDemoMode?: boolean;
    demoCount: number;
    onRequireAuth?: () => void;
    onClose?: () => void;
    setCurrentLanguage: (lang: Language) => void;
    onCancelAudio?: () => void;
}> = ({ 
    user, texts, currentLanguage, onStartConversation, isDemoMode, 
    demoCount, onRequireAuth, onClose, setCurrentLanguage, onCancelAudio 
}) => {
    const [userInput, setUserInput] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [factIndex, setFactIndex] = useState(0);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52,
        maxHeight: 160
    });

    const isKn = currentLanguage === Language.KN;
    const remainingPrompts = Math.max(0, DEMO_PROMPT_LIMIT - demoCount);
    const isQuotaLocked = isDemoMode && remainingPrompts === 0;

    const {
        isListening,
        isTranscribing,
        speechError,
        toggleListening,
        stopListening
    } = useSpeechDictation({
        lang: currentLanguage,
        onTextChange: (newText) => {
            setUserInput(newText);
            setTimeout(() => adjustHeight(), 10);
        },
        getCurrentText: () => userInput,
        onCancelAudio
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setFactIndex((prevIndex) => (prevIndex + 1) % (texts.agriculturalFacts.length || 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [texts.agriculturalFacts.length]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);
            try {
                const preview = await fileToDataURL(file);
                setAttachmentPreview(preview);
            } catch {
                setAttachmentPreview(null);
            }
        }
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isListening) stopListening();
        if (isQuotaLocked) {
            onRequireAuth?.();
            return;
        }
        if (userInput.trim() || attachment) {
            onStartConversation(userInput.trim(), attachment);
            setUserInput('');
            setAttachment(null);
            setAttachmentPreview(null);
            adjustHeight(true);
        }
    };

    const handleQuickAction = (promptText: string) => {
        if (isQuotaLocked) {
            onRequireAuth?.();
            return;
        }
        onStartConversation(promptText, null);
    };

    const quickActions = [
        {
            icon: <Sprout className="w-4 h-4 text-white" />,
            label: isKn ? "ಬೆಳೆ ರೋಗ ಪರೀಕ್ಷೆ" : "Crop Disease Diagnosis",
            prompt: isKn ? "ನನ್ನ ಬೆಳೆಯಲ್ಲಿ ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿವೆ ಮತ್ತು ಕಲೆಗಳು ಕಾಣಿಸುತ್ತಿವೆ. ಇದಕ್ಕೆ ಪರಿಹಾರ ಮತ್ತು ಔಷಧಿ ತಿಳಿಸಿ." : "How to diagnose and cure leaf yellowing and fungal spots on crops?"
        },
        {
            icon: <TrendingUp className="w-4 h-4 text-white" />,
            label: isKn ? "ಇಂದಿನ ಮಂಡಿ ದರಗಳು" : "Live Mandi Prices",
            prompt: isKn ? "ಕರ್ನಾಟಕದ ಇಂದಿನ ಪ್ರಮುಖ ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ ಟೊಮೆಟೊ, ಈರುಳ್ಳಿ ಮತ್ತು ಭತ್ತದ ದರಗಳೇನು?" : "What are today's market mandi prices for Tomato, Onion, and Paddy in Karnataka?"
        },
        {
            icon: <FlaskConical className="w-4 h-4 text-white" />,
            label: isKn ? "ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ ಸಲಹೆ" : "Soil Health & NPK",
            prompt: isKn ? "ಹೆಚ್ಚಿನ ಇಳುವರಿಗಾಗಿ ಜಮೀನಿನಲ್ಲಿ NPK ಗೊಬ್ಬರದ ಸಮತೋಲನ ಪ್ರಮಾಣ ಮತ್ತು ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಸಲಹೆ ನೀಡಿ." : "What is the recommended NPK fertilizer schedule and soil fertility improvement tips?"
        },
        {
            icon: <CloudRain className="w-4 h-4 text-white" />,
            label: isKn ? "ಹವಾಮಾನ & ನೀರಾವರಿ" : "Weather & Irrigation",
            prompt: isKn ? "ಮುಂಬರುವ ದಿನಗಳ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ಆಧರಿಸಿ ಕೃಷಿ ನೀರಾವರಿ ಹೇಗೆ ನಿರ್ವಹಿಸಬೇಕು?" : "How should I plan drip irrigation based on upcoming weather and rainfall forecasts?"
        },
        {
            icon: <Bug className="w-4 h-4 text-white" />,
            label: isKn ? "ಸಾವಯವ ಕೀಟನಾಶಕ" : "Organic Pest Control",
            prompt: isKn ? "ರಾಸಾಯನಿಕ ಮುಕ್ತ ಸಾವಯವ ಕೀಟನಾಶಕ ಮತ್ತು ನೀಮ್ ಕಷಾಯ ತಯಾರಿಸುವ ವಿಧಾನ ತಿಳಿಸಿ." : "How to prepare effective organic neem-based pest control remedies at home?"
        },
        {
            icon: <Building2 className="w-4 h-4 text-white" />,
            label: isKn ? "ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳು" : "Govt Subsidies (Kisan)",
            prompt: isKn ? "ರೈತರಿಗಾಗಿ ಲಭ್ಯವಿರುವ ಪ್ರಮುಖ ಕೃಷಿ ಯೋಜನೆಗಳು, ಸಬ್ಸಿಡಿಗಳು ಮತ್ತು ಪಿಎಂ ಕಿಸಾನ್ ಪ್ರಯೋಜನಗಳ ಮಾಹಿತಿ ನೀಡಿ." : "What government schemes, subsidies, and PM-Kisan financial aids are available for farmers?"
        }
    ];

    return (
        <div 
            className="relative w-full h-full min-h-screen bg-cover bg-center flex flex-col justify-between p-4 sm:p-6 overflow-y-auto galaxy-scrollbar bg-black"
            style={{
                backgroundImage: "url('/bhoomi_planet_bg.jpg')",
                backgroundAttachment: "fixed"
            }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-none" />

            {/* Top Navigation Bar */}
            <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-lg tracking-tight">Bhoomi AI</span>
                </div>

                <div className="flex items-center gap-2.5">
                    {isDemoMode && (
                        <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-mono font-medium border backdrop-blur-md",
                            isQuotaLocked
                                ? "bg-neutral-900 border-neutral-800 text-neutral-400"
                                : "bg-neutral-900 border-neutral-800 text-neutral-300"
                        )}>
                            {isQuotaLocked ? "Limit Reached" : `Demo: ${remainingPrompts}/3 prompts`}
                        </div>
                    )}

                    {/* Standard Language Toggle */}
                    <LanguageToggle
                        currentLanguage={currentLanguage}
                        setCurrentLanguage={setCurrentLanguage}
                        size="sm"
                    />

                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800/80"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </header>

            {/* Center Content Section */}
            <main className="relative z-10 w-full max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center my-6 text-center">
                {/* Hero Title */}
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-md"
                >
                    {isKn ? "ಭೂಮಿ AI" : "Ask Bhoomi AI"}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-2 text-sm sm:text-base text-neutral-400 max-w-xl font-normal leading-relaxed"
                >
                    {isKn 
                        ? "ಬೆಳೆ ರೋಗ ಪರೀಕ್ಷೆ, ಮಾರುಕಟ್ಟೆ ದರಗಳು ಮತ್ತು ಕೃಷಿ ಸಲಹೆಗಳನ್ನು ಕನ್ನಡದಲ್ಲೇ ಧ್ವನಿ ಅಥವಾ ಪಠ್ಯದ ಮೂಲಕ ಪಡೆಯಿರಿ."
                        : "Ask anything about crop diagnosis, live mandi prices, soil health, and weather in English or Kannada."}
                </motion.p>

                {/* Daily Agricultural Fact Pill */}
                {texts.agriculturalFacts && texts.agriculturalFacts.length > 0 && (
                    <motion.div
                        key={factIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 px-4 py-2 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 max-w-lg flex items-center gap-2 backdrop-blur-md shadow-inner"
                    >
                        <Sparkles className="w-4 h-4 text-neutral-300 shrink-0" />
                        <span className="truncate">{texts.agriculturalFacts[factIndex]}</span>
                    </motion.div>
                )}

                {/* Center Auto-Expanding Input Container */}
                <div className="w-full mt-8">
                    <form onSubmit={handleSubmit} className="relative">
                        <div className={cn(
                            "relative bg-black/80 backdrop-blur-2xl rounded-2xl border transition-all shadow-2xl p-2",
                            isListening
                                ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.25)]"
                                : isQuotaLocked
                                ? "border-neutral-800 bg-neutral-950/60"
                                : "border-neutral-800 focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-700/50"
                        )}>
                            {/* Attachment Thumbnail Preview if file attached */}
                            {attachment && (
                                <div className="flex items-center gap-2 p-2 mb-1 bg-neutral-900 rounded-xl border border-neutral-800 w-fit">
                                    {attachmentPreview ? (
                                        <img src={attachmentPreview} alt="upload preview" className="w-10 h-10 object-cover rounded-lg border border-neutral-700" />
                                    ) : (
                                        <Paperclip className="w-5 h-5 text-neutral-400" />
                                    )}
                                    <span className="text-xs text-neutral-200 max-w-[150px] truncate">{attachment.name}</span>
                                    <button type="button" onClick={handleRemoveAttachment} className="p-1 hover:text-white text-neutral-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Auto Resizing Textarea */}
                            <Textarea
                                ref={textareaRef}
                                value={userInput}
                                onChange={(e) => {
                                    setUserInput(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                disabled={isQuotaLocked}
                                placeholder={
                                    isQuotaLocked
                                        ? isKn ? "ಉಚಿತ ಡೆಮೊ ಮಿತಿ ತಲುಪಿದೆ. ಮುಂದುವರಿಯಲು ಸೈನ್ ಇನ್ ಮಾಡಿ." : "Free demo limit reached. Sign In to continue."
                                        : isTranscribing
                                        ? (isKn ? "ಧ್ವನಿ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ..." : "Transcribing speech...")
                                        : isListening
                                        ? (isKn ? "🎙️ ಧ್ವನಿ ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ... ಮಾತನಾಡಿ (ನಿಲ್ಲಿಸಲು ಮೈಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ)" : "🎙️ Listening... Speak now (click mic to stop)")
                                        : isKn ? "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ..." : "Ask your crop question, paste image, or click mic..."
                                }
                                className={cn(
                                    "w-full px-4 py-2 resize-none border-none",
                                    "bg-transparent text-white text-sm sm:text-base",
                                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "placeholder:text-neutral-500 min-h-[52px]"
                                )}
                                style={{ overflow: "hidden" }}
                            />

                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            {/* Bottom Input Controls Toolbar */}
                            <div className="flex items-center justify-between pt-1 px-2 pb-1">
                                <div className="flex items-center gap-1.5">
                                    {/* Attach Image Button */}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isQuotaLocked}
                                        className="text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-xl"
                                        title={texts.attachFile}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </Button>

                                    {/* Microphone Voice Button */}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleListening}
                                        disabled={isQuotaLocked}
                                        className={cn(
                                            "rounded-xl transition-all",
                                            isListening
                                                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-lg shadow-red-500/40"
                                                : isTranscribing
                                                ? "bg-neutral-700 text-white animate-spin"
                                                : "text-neutral-400 hover:text-white hover:bg-neutral-800/80"
                                        )}
                                        title={isListening ? (isKn ? "ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ" : "Stop Listening") : (isKn ? "ಧ್ವನಿ ಮೂಲಕ ಟೈಪ್ ಮಾಡಿ" : "Speak to Type")}
                                    >
                                        <Mic className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isQuotaLocked ? (
                                        <Button
                                            type="button"
                                            onClick={onRequireAuth}
                                            className="bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-4 py-2 rounded-xl shadow-lg"
                                        >
                                            {isKn ? "ಸೈನ್ ಇನ್" : "Sign In"}
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={!userInput.trim() && !attachment}
                                            className={cn(
                                                "px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg",
                                                (userInput.trim() || attachment)
                                                    ? "bg-white hover:bg-neutral-200 text-black font-medium"
                                                    : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                                            )}
                                        >
                                            <ArrowUp className="w-4 h-4 text-current" />
                                            <span className="text-xs font-medium hidden sm:inline">{isKn ? "ಕಳುಹಿಸಿ" : "Send"}</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>

                    {speechError && (
                        <p className="mt-2 text-xs text-red-300 text-center font-medium bg-neutral-900 py-1 px-3 rounded-full border border-red-500/30 inline-block">
                            {speechError}
                        </p>
                    )}
                </div>

                {/* Quick Action Suggestion Pills Grid */}
                <div className="w-full flex items-center justify-center flex-wrap gap-2.5 mt-8">
                    {quickActions.map((action, idx) => (
                        <QuickActionPill
                            key={idx}
                            icon={action.icon}
                            label={action.label}
                            onClick={() => handleQuickAction(action.prompt)}
                            disabled={isQuotaLocked}
                        />
                    ))}
                </div>
            </main>

            {/* Bottom Footer Credits */}
            <footer className="relative z-10 w-full max-w-3xl mx-auto text-center py-2 text-xs font-mono text-neutral-500">
                AgriVerse Bhoomi AI • Powered by Gemini 2.5 Flash & Sarvam Voice AI
            </footer>
        </div>
    );
};

// Redesigned Chat Conversation Screen (Clean Monochrome Celestial Design)
const ChatScreen: React.FC<{
    texts: UIStringContent;
    currentLanguage: Language;
    history: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (p: string, a: File | null) => void;
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (enabled: boolean) => void;
    isSpeaking: boolean;
    onCancelSpeak: () => void;
    setCurrentLanguage: (lang: Language) => void;
    onGoHome: () => void;
    isDemoMode?: boolean;
    demoCount: number;
    onRequireAuth?: () => void;
    onClose?: () => void;
}> = ({
    texts, currentLanguage, history, isLoading, onSendMessage,
    isVoiceEnabled, setIsVoiceEnabled, isSpeaking, onCancelSpeak, setCurrentLanguage,
    onGoHome, isDemoMode, demoCount, onRequireAuth, onClose
}) => {
    const [userInput, setUserInput] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 48,
        maxHeight: 140
    });

    const isKn = currentLanguage === Language.KN;
    const remainingPrompts = Math.max(0, DEMO_PROMPT_LIMIT - demoCount);
    const isQuotaLocked = isDemoMode && remainingPrompts === 0;

    const {
        isListening,
        isTranscribing,
        speechError,
        toggleListening,
        stopListening
    } = useSpeechDictation({
        lang: currentLanguage,
        onTextChange: (newText) => {
            setUserInput(newText);
            setTimeout(() => adjustHeight(), 10);
        },
        getCurrentText: () => userInput,
        onCancelAudio: onCancelSpeak
    });

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);
            try {
                const preview = await fileToDataURL(file);
                setAttachmentPreview(preview);
            } catch {
                setAttachmentPreview(null);
            }
        }
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isListening) stopListening();
        if (isQuotaLocked) {
            onRequireAuth?.();
            return;
        }
        if (userInput.trim() || attachment) {
            onSendMessage(userInput.trim(), attachment);
            setUserInput('');
            setAttachment(null);
            setAttachmentPreview(null);
            adjustHeight(true);
        }
    };

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2500);
    };

    return (
        <div 
            className="relative w-full h-full flex flex-col justify-between bg-cover bg-center overflow-hidden bg-black"
            style={{
                backgroundImage: "url('/bhoomi_planet_bg.jpg')",
                backgroundAttachment: "fixed"
            }}
        >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] pointer-events-none" />

            {/* Chat Floating Header */}
            <header className="relative z-10 w-full px-4 py-3 border-b border-neutral-800 bg-black/60 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onGoHome}
                        className="rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800"
                        title="Back to Home"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <span className="font-semibold text-white text-base tracking-tight">Bhoomi AI</span>
                </div>

                <div className="flex items-center gap-2">
                    {isDemoMode && (
                        <div className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-mono font-medium border backdrop-blur-md hidden sm:block",
                            isQuotaLocked
                                ? "bg-neutral-900 border-neutral-800 text-neutral-400"
                                : "bg-neutral-900 border-neutral-800 text-neutral-300"
                        )}>
                            {isQuotaLocked ? "Limit Reached" : `Demo: ${remainingPrompts}/3 Left`}
                        </div>
                    )}

                    {/* Auto-read Voice Speaker Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (isSpeaking) onCancelSpeak();
                            setIsVoiceEnabled(!isVoiceEnabled);
                        }}
                        className={cn(
                            "rounded-xl transition-all",
                            isVoiceEnabled ? "text-white bg-neutral-800" : "text-neutral-500 hover:text-neutral-300"
                        )}
                        title={isVoiceEnabled ? "Voice Enabled" : "Voice Muted"}
                    >
                        {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>

                    {/* Standard Language Toggle */}
                    <LanguageToggle
                        currentLanguage={currentLanguage}
                        setCurrentLanguage={setCurrentLanguage}
                        size="sm"
                    />

                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </header>

            {/* Chat Messages Flow */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 galaxy-scrollbar max-w-4xl w-full mx-auto">
                {history.map((message, idx) => {
                    const isUser = message.role === 'user';
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-3",
                                isUser ? "justify-end" : "justify-start"
                            )}
                        >
                            {/* AI Avatar */}
                            {!isUser && (
                                <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0 shadow-lg mt-1">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div className={cn(
                                "max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xl backdrop-blur-xl relative group",
                                isUser 
                                    ? "bg-white text-black font-medium rounded-tr-sm border border-neutral-200 shadow-md"
                                    : "bg-neutral-900/90 text-neutral-100 rounded-tl-sm border border-neutral-800/90"
                            )}>
                                {/* User Uploaded Attachment in Chat */}
                                {message.attachment && (
                                    <div className="mb-3 rounded-xl overflow-hidden border border-neutral-300 max-w-xs shadow-md">
                                        <img 
                                            src={typeof message.attachment === 'string' ? message.attachment : URL.createObjectURL(message.attachment)} 
                                            alt="Crop Upload" 
                                            className="w-full h-auto object-cover max-h-60"
                                        />
                                    </div>
                                )}

                                {/* Message Content */}
                                <div className="text-sm sm:text-base leading-relaxed break-words">
                                    <MarkdownRenderer content={message.parts[0]?.text || ''} />
                                </div>

                                {/* Plant Disease Diagnostic Card if available */}
                                {message.plantAnalysis && (
                                    <div className="mt-4 pt-3 border-t border-neutral-800">
                                        <PlantAnalysisResult result={message.plantAnalysis} texts={texts} />
                                    </div>
                                )}

                                {/* Copy / Actions bar on AI messages */}
                                {!isUser && (
                                    <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                                        <div className="flex items-center gap-2">
                                            {isSpeaking && (
                                                <span className="flex items-center gap-1.5 text-neutral-300 font-mono">
                                                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                                                    <span>Speaking...</span>
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(message.parts[0]?.text || '', idx)}
                                            className="flex items-center gap-1 hover:text-white text-neutral-400 transition-colors p-1"
                                            title="Copy answer"
                                        >
                                            {copiedIndex === idx ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                    <span className="text-white">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* User Avatar */}
                            {isUser && (
                                <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0 shadow-lg mt-1">
                                    <UserCircle2 className="w-5 h-5 text-neutral-300" />
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {/* Loading / Generating Animation */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 items-center"
                    >
                        <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0">
                            <Sparkles className="w-4 h-4 animate-spin text-white" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 backdrop-blur-md shadow-lg flex items-center gap-3">
                            <GeneratingAnimation />
                            <span className="text-xs font-mono text-neutral-400">
                                {isKn ? "ಭೂಮಿ AI ಯೋಚಿಸುತ್ತಿದೆ..." : "Bhoomi AI is analyzing..."}
                            </span>
                        </div>
                    </motion.div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Floating Bottom Input Dock */}
            <footer className="relative z-10 w-full max-w-4xl mx-auto p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="relative">
                    <div className={cn(
                        "relative bg-black/80 backdrop-blur-2xl rounded-2xl border transition-all shadow-2xl p-2",
                        isQuotaLocked
                            ? "border-neutral-800 bg-neutral-950/60"
                            : "border-neutral-800 focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-700/50"
                    )}>
                        {/* Attachment Thumbnail Preview */}
                        {attachment && (
                            <div className="flex items-center gap-2 p-2 mb-1 bg-neutral-900 rounded-xl border border-neutral-800 w-fit">
                                {attachmentPreview ? (
                                    <img src={attachmentPreview} alt="upload preview" className="w-10 h-10 object-cover rounded-lg border border-neutral-700" />
                                ) : (
                                    <Paperclip className="w-5 h-5 text-neutral-400" />
                                )}
                                <span className="text-xs text-neutral-200 max-w-[150px] truncate">{attachment.name}</span>
                                <button type="button" onClick={handleRemoveAttachment} className="p-1 hover:text-white text-neutral-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Auto-Resizing Textarea */}
                        <Textarea
                            ref={textareaRef}
                            value={userInput}
                            onChange={(e) => {
                                setUserInput(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            disabled={isQuotaLocked}
                            placeholder={
                                isQuotaLocked
                                    ? isKn ? "ಉಚಿತ ಡೆಮೊ ಮಿತಿ ತಲುಪಿದೆ. ಮುಂದುವರಿಯಲು ಸೈನ್ ಇನ್ ಮಾಡಿ." : "Free demo limit reached. Sign In to continue."
                                    : isTranscribing
                                    ? (isKn ? "ಧ್ವನಿ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ..." : "Transcribing speech...")
                                    : isListening
                                    ? (isKn ? "🎙️ ಧ್ವನಿ ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ... ಮಾತನಾಡಿ (ನಿಲ್ಲಿಸಲು ಮೈಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ)" : "🎙️ Listening... Speak now (click mic to stop)")
                                    : isKn ? "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ..." : "Ask your crop question or click mic..."
                            }
                            className={cn(
                                "w-full px-4 py-2 resize-none border-none",
                                "bg-transparent text-white text-sm sm:text-base",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-neutral-500 min-h-[48px]"
                            )}
                            style={{ overflow: "hidden" }}
                        />

                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        {/* Footer Controls */}
                        <div className="flex items-center justify-between pt-1 px-2 pb-1">
                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isQuotaLocked}
                                    className="text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-xl"
                                    title={texts.attachFile}
                                >
                                    <Paperclip className="w-5 h-5" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleListening}
                                    disabled={isQuotaLocked}
                                    className={cn(
                                        "rounded-xl transition-all",
                                        isListening
                                            ? "bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-lg shadow-red-500/40"
                                            : isTranscribing
                                            ? "bg-neutral-700 text-white animate-spin"
                                            : "text-neutral-400 hover:text-white hover:bg-neutral-800/80"
                                    )}
                                    title={isListening ? (isKn ? "ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ" : "Stop Listening") : (isKn ? "ಧ್ವನಿ ಮೂಲಕ ಟೈಪ್ ಮಾಡಿ" : "Speak to Type")}
                                >
                                    <Mic className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                {isQuotaLocked ? (
                                    <Button
                                        type="button"
                                        onClick={onRequireAuth}
                                        className="bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-4 py-2 rounded-xl shadow-lg"
                                    >
                                        {isKn ? "ಸೈನ್ ಇನ್" : "Sign In"}
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={!userInput.trim() && !attachment}
                                        className={cn(
                                            "px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg",
                                            (userInput.trim() || attachment)
                                                ? "bg-white hover:bg-neutral-200 text-black font-medium"
                                                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                                        )}
                                    >
                                        <ArrowUp className="w-4 h-4 text-current" />
                                        <span className="text-xs font-medium hidden sm:inline">{isKn ? "ಕಳುಹಿಸಿ" : "Send"}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {speechError && (
                    <p className="mt-2 text-xs text-red-300 text-center font-medium bg-neutral-900 py-1 px-3 rounded-full border border-red-500/30 inline-block">
                        {speechError}
                    </p>
                )}
            </footer>
        </div>
    );
};

interface TTSPlaylistItem {
    index: number;
    text: string;
    base64Data?: string;
    isWav?: boolean;
    status: 'pending' | 'resolved' | 'failed';
}

// Bhoomi AI Assistant Main Component
const BhoomiAssistant: React.FC<BhoomiAssistantProps> = (props) => {
    const { currentLanguage, user, setCurrentLanguage, isDemoMode = false, onRequireAuth, onClose } = props;
    const texts = uiStrings[currentLanguage];
    const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [demoCount, setDemoCount] = useState<number>(() => isDemoMode ? getStoredDemoCount() : 0);
    const [showAuthGate, setShowAuthGate] = useState<boolean>(false);
    const isSendingRef = useRef(false);

    // ============ WEB AUDIO API & STREAMING TTS PIPELINE ============
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const playlistRef = useRef<TTSPlaylistItem[]>([]);
    const nextPlayIndexRef = useRef<number>(0);
    const isPlayingAudioRef = useRef<boolean>(false);
    const currentSessionIdRef = useRef<number>(0);

    useEffect(() => {
        setHistory([]);
        return () => {
            handleCancelSpeak();
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
                audioContextRef.current = null;
            }
        };
    }, []);

    const getAudioContext = (): AudioContext => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(err => console.error("AudioContext resume error:", err));
        }
        return audioContextRef.current;
    };

    const handleCancelSpeak = useCallback(() => {
        currentSessionIdRef.current += 1;
        playlistRef.current = [];
        nextPlayIndexRef.current = 0;
        isPlayingAudioRef.current = false;
        setIsSpeaking(false);

        if (activeSourceNodeRef.current) {
            try {
                activeSourceNodeRef.current.stop();
                activeSourceNodeRef.current.disconnect();
            } catch {}
            activeSourceNodeRef.current = null;
        }
    }, []);

    const playNextAudio = useCallback(async (sessionId: number) => {
        if (sessionId !== currentSessionIdRef.current) return;

        const nextIndex = nextPlayIndexRef.current;
        const item = playlistRef.current.find(i => i.index === nextIndex);

        if (!item) {
            isPlayingAudioRef.current = false;
            setIsSpeaking(false);
            return;
        }

        if (item.status === 'pending') {
            isPlayingAudioRef.current = true;
            setIsSpeaking(true);
            return;
        }

        if (item.status === 'failed' || !item.base64Data) {
            nextPlayIndexRef.current += 1;
            playNextAudio(sessionId);
            return;
        }

        isPlayingAudioRef.current = true;
        setIsSpeaking(true);

        try {
            const ctx = getAudioContext();
            const arrayBuffer = base64ToArrayBuffer(item.base64Data);

            let audioBuffer: AudioBuffer;
            if (item.isWav) {
                audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            } else {
                const float32Data = convertPCM16ToFloat32(arrayBuffer);
                audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
                audioBuffer.copyToChannel(float32Data, 0);
            }

            if (sessionId !== currentSessionIdRef.current) return;

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            activeSourceNodeRef.current = source;

            source.onended = () => {
                if (sessionId === currentSessionIdRef.current) {
                    activeSourceNodeRef.current = null;
                    nextPlayIndexRef.current += 1;
                    playNextAudio(sessionId);
                }
            };

            source.start(0);
        } catch (error) {
            console.error("Audio playback error:", error);
            if (sessionId === currentSessionIdRef.current) {
                nextPlayIndexRef.current += 1;
                playNextAudio(sessionId);
            }
        }
    }, []);

    const queueSpeech = useCallback((text: string, index: number, sessionId: number) => {
        if (!isVoiceEnabled || sessionId !== currentSessionIdRef.current) return;

        playlistRef.current.push({
            index,
            text,
            status: 'pending'
        });

        (async () => {
            try {
                let base64Audio = await generateSarvamSpeech(text, currentLanguage);
                let isWav = true;

                if (!base64Audio) {
                    base64Audio = await generateSpeech(text, currentLanguage);
                    isWav = false;
                }

                if (sessionId !== currentSessionIdRef.current) return;

                const targetItem = playlistRef.current.find(i => i.index === index);
                if (targetItem) {
                    if (base64Audio) {
                        targetItem.base64Data = base64Audio;
                        targetItem.isWav = isWav;
                        targetItem.status = 'resolved';
                    } else {
                        targetItem.status = 'failed';
                    }
                }

                if (!isPlayingAudioRef.current && nextPlayIndexRef.current === index) {
                    playNextAudio(sessionId);
                } else if (isPlayingAudioRef.current && nextPlayIndexRef.current === index) {
                    playNextAudio(sessionId);
                }
            } catch (err) {
                console.error("Speech synthesis error for chunk:", err);
                const targetItem = playlistRef.current.find(i => i.index === index);
                if (targetItem) targetItem.status = 'failed';
                if (nextPlayIndexRef.current === index) {
                    nextPlayIndexRef.current += 1;
                    playNextAudio(sessionId);
                }
            }
        })();
    }, [currentLanguage, isVoiceEnabled, playNextAudio]);

    const handleSendMessage = useCallback(async (prompt: string, attachment: File | null) => {
        if ((!prompt && !attachment) || isLoading || isSendingRef.current) return;

        if (isDemoMode && demoCount >= DEMO_PROMPT_LIMIT) {
            setShowAuthGate(true);
            return;
        }

        if (isDemoMode) {
            const nextCount = demoCount + 1;
            setDemoCount(nextCount);
            setStoredDemoCount(nextCount);
        }

        isSendingRef.current = true;
        handleCancelSpeak();
        setCurrentView('chat');
        setIsLoading(true);

        const newSessionId = currentSessionIdRef.current;

        const userMessage: ChatMessage = {
            role: 'user',
            parts: [{ text: prompt }],
            attachment: attachment ? attachment : undefined,
        };

        const currentHistory = [...history, userMessage];
        setHistory(currentHistory);

        const modelMessagePlaceholder: ChatMessage = {
            role: 'model',
            parts: [{ text: '' }],
        };
        setHistory([...currentHistory, modelMessagePlaceholder]);

        try {
            if (attachment) {
                const imageBase64 = await fileToBase64(attachment);
                const analysisResult = await getPlantDiseaseAnalysis(
                    imageBase64,
                    attachment.type
                );

                const isKn = currentLanguage === Language.KN;
                const diseaseName = analysisResult.diseaseName?.[currentLanguage] || analysisResult.diseaseName?.en || (isKn ? 'ಆರೋಗ್ಯಕರ ಸಸ್ಯ' : 'Healthy Plant');
                const confidencePct = Math.round((analysisResult.confidenceScore || 0) * 100);
                const medicine = analysisResult.treatment?.medicineName?.[currentLanguage] || analysisResult.treatment?.medicineName?.en || (isKn ? 'ಯಾವುದೇ ಔಷಧಿ ಅಗತ್ಯವಿಲ್ಲ' : 'No medicine needed');
                const preventionList = (analysisResult.prevention?.[currentLanguage] || analysisResult.prevention?.en || []).join('\n• ');

                const botResponseText = analysisResult.isDiseaseFound
                    ? `### ${diseaseName}\n\n**${texts.diagnosisConfidence}:** ${confidencePct}%\n\n**${texts.organicRemedy}:**\n${medicine}\n\n**${texts.preventiveMeasures}:**\n• ${preventionList}`
                    : texts.noDiseaseFound;

                setHistory(prev => {
                    const next = [...prev];
                    next[next.length - 1] = {
                        role: 'model',
                        parts: [{ text: botResponseText }],
                        plantAnalysis: analysisResult,
                    };
                    return next;
                });

                if (isVoiceEnabled) {
                    const clean = removeMarkdown(botResponseText).slice(0, 300);
                    queueSpeech(clean, 0, newSessionId);
                }
            } else {
                let accumulatedFullText = '';
                let sentenceBuffer = '';
                let chunkIndex = 0;

                const sentenceEndRegex = /([.!?\n\u0964\u0965]+|\.\s+|\?\s+|\!\s+)/;

                let streamSuccess = false;
                try {
                    const stream = await getBhoomiResponseStream(currentHistory, currentLanguage, user);
                    for await (const chunk of stream) {
                        if (newSessionId !== currentSessionIdRef.current) break;
                        const chunkText = chunk.text || '';
                        accumulatedFullText += chunkText;
                        sentenceBuffer += chunkText;

                        setHistory(prev => {
                            const next = [...prev];
                            next[next.length - 1] = {
                                role: 'model',
                                parts: [{ text: accumulatedFullText }],
                            };
                            return next;
                        });

                        if (isVoiceEnabled) {
                            const parts = sentenceBuffer.split(sentenceEndRegex);
                            if (parts.length > 2) {
                                const completeSentence = parts.slice(0, -1).join('').trim();
                                sentenceBuffer = parts[parts.length - 1];

                                const cleanSentence = removeMarkdown(completeSentence).trim();
                                if (cleanSentence.length > 3) {
                                    queueSpeech(cleanSentence, chunkIndex, newSessionId);
                                    chunkIndex++;
                                }
                            }
                        }
                    }
                    streamSuccess = true;
                } catch (geminiError) {
                    console.warn("Gemini Stream failed, falling back to Groq stream:", geminiError);
                }

                if (!streamSuccess) {
                    const groqStream = await getGroqBhoomiStream(currentHistory, currentLanguage, user);
                    for await (const chunk of groqStream) {
                        if (newSessionId !== currentSessionIdRef.current) break;
                        const chunkText = chunk.text || '';
                        accumulatedFullText += chunkText;
                        sentenceBuffer += chunkText;

                        setHistory(prev => {
                            const next = [...prev];
                            next[next.length - 1] = {
                                role: 'model',
                                parts: [{ text: accumulatedFullText }],
                            };
                            return next;
                        });

                        if (isVoiceEnabled) {
                            const parts = sentenceBuffer.split(sentenceEndRegex);
                            if (parts.length > 2) {
                                const completeSentence = parts.slice(0, -1).join('').trim();
                                sentenceBuffer = parts[parts.length - 1];

                                const cleanSentence = removeMarkdown(completeSentence).trim();
                                if (cleanSentence.length > 3) {
                                    queueSpeech(cleanSentence, chunkIndex, newSessionId);
                                    chunkIndex++;
                                }
                            }
                        }
                    }
                }

                if (isVoiceEnabled && sentenceBuffer.trim() && newSessionId === currentSessionIdRef.current) {
                    const cleanSentence = removeMarkdown(sentenceBuffer).trim();
                    if (cleanSentence.length > 1) {
                        queueSpeech(cleanSentence, chunkIndex, newSessionId);
                    }
                }
            }
        } catch (error) {
            console.error("Error in handleSendMessage:", error);
            setHistory(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                    role: 'model',
                    parts: [{ text: texts.errorAssistant }],
                };
                return next;
            });
        } finally {
            setIsLoading(false);
            isSendingRef.current = false;
        }
    }, [currentLanguage, history, isVoiceEnabled, queueSpeech, texts, isLoading, isDemoMode, demoCount, user]);

    const goHome = () => {
        handleCancelSpeak();
        setHistory([]);
        setIsLoading(false);
        setCurrentView('home');
    };

    return (
        <div className="w-full h-full relative overflow-hidden">
            <AnimatePresence mode="wait">
                {currentView === 'home' ? (
                    <motion.div key="home" className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AssistantHomeScreen
                            user={user}
                            texts={texts}
                            currentLanguage={currentLanguage}
                            onStartConversation={handleSendMessage}
                            isDemoMode={isDemoMode}
                            demoCount={demoCount}
                            onRequireAuth={() => {
                                handleCancelSpeak();
                                onRequireAuth?.();
                            }}
                            onClose={onClose}
                            setCurrentLanguage={setCurrentLanguage}
                            onCancelAudio={handleCancelSpeak}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="chat" className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ChatScreen
                            texts={texts}
                            currentLanguage={currentLanguage}
                            history={history}
                            isLoading={isLoading}
                            onSendMessage={handleSendMessage}
                            isVoiceEnabled={isVoiceEnabled}
                            setIsVoiceEnabled={setIsVoiceEnabled}
                            isSpeaking={isSpeaking}
                            onCancelSpeak={handleCancelSpeak}
                            setCurrentLanguage={setCurrentLanguage}
                            onGoHome={goHome}
                            isDemoMode={isDemoMode}
                            demoCount={demoCount}
                            onRequireAuth={() => {
                                handleCancelSpeak();
                                onRequireAuth?.();
                            }}
                            onClose={onClose}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAuthGate && (
                    <AuthGateModal
                        currentLanguage={currentLanguage}
                        onSignIn={() => {
                            setShowAuthGate(false);
                            handleCancelSpeak();
                            onRequireAuth?.();
                        }}
                        onClose={() => setShowAuthGate(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default BhoomiAssistant;
