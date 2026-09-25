import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, UserProfile, UIStringContent, ChatMessage } from '../types';
import { uiStrings } from '../constants';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import { getPlantDiseaseAnalysis, generateSpeech, getBhoomiResponseStream } from '../services/geminiService';
import { generateSarvamSpeech, transcribeSarvamAudio } from '../services/sarvamService';
import { getGroqBhoomiStream } from '../services/groqService';
import {
    ArrowLeftIcon, PaperClipIcon, XCircleIcon, MicrophoneIcon, PaperAirplaneIcon, SparklesIcon,
    SpeakerWaveIcon, SpeakerXMarkIcon, UserCircleIcon
} from './common/IconComponents';
import ListeningAnimation from './common/ListeningAnimation';
import GeneratingAnimation from './common/GeneratingAnimation';
import MarkdownRenderer from './common/MarkdownRenderer';
import LanguageToggle from './common/LanguageToggle';
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

// High-Accuracy Speech Recognition Hook powered by Sarvam AI Saaras:v3
const useSarvamAudioRecorder = (
    onResult: (t: string) => void,
    onRecordingChange: (recording: boolean) => void,
    onTranscribingChange: (transcribing: boolean) => void,
    onError: (e: string) => void,
    lang: Language
) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<any>(null);

    const startRecording = useCallback(async () => {
        try {
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/mp4')
                ? 'audio/mp4'
                : '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                onRecordingChange(false);
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                const audioBlob = new Blob(audioChunksRef.current, {
                    type: recorder.mimeType || 'audio/webm'
                });

                if (audioBlob.size < 500) {
                    return;
                }

                onTranscribingChange(true);
                try {
                    console.log("Transcribing audio with Sarvam Saaras:v3...");
                    const transcript = await transcribeSarvamAudio(audioBlob, lang);
                    onTranscribingChange(false);
                    if (transcript && transcript.trim()) {
                        onResult(transcript.trim());
                    } else {
                        onError("No speech detected. Please speak closer to the mic.");
                    }
                } catch (err: any) {
                    onTranscribingChange(false);
                    console.warn("Sarvam STT failed:", err);
                    onError("Could not transcribe speech. Please try again or type.");
                }
            };

            recorder.start(200);
            onRecordingChange(true);

            // Auto stop after 8 seconds of continuous recording
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
            }, 8000);

        } catch (err: any) {
            console.error("Microphone access error:", err);
            onRecordingChange(false);
            onError("Microphone permission needed to use voice input.");
        }
    }, [lang, onResult, onRecordingChange, onTranscribingChange, onError]);

    const stopRecording = useCallback(() => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const toggleRecording = useCallback((isCurrentlyRecording: boolean) => {
        if (isCurrentlyRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [startRecording, stopRecording]);

    return { startRecording, stopRecording, toggleRecording };
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

// Demo Limit / Auth Prompt Modal
const AuthGateModal: React.FC<{
    currentLanguage: Language;
    onSignIn: () => void;
    onClose?: () => void;
}> = ({ currentLanguage, onSignIn, onClose }) => {
    const isKn = currentLanguage === Language.KN;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="relative w-full max-w-md bg-neutral-950 border border-neutral-700 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl overflow-hidden"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
            >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <SparklesIcon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold tracking-tight mb-2">
                    {isKn ? "ಉಚಿತ ಡೆಮೊ ಮಿತಿ ತಲುಪಿದೆ!" : "Free Demo Limit Reached!"}
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed mb-6">
                    {isKn
                        ? "ನೀವು ಭೂಮಿ AI ಯ 3 ಉಚಿತ ಪ್ರಶ್ನೆಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ. ಅನಿಯಮಿತ ಧ್ವನಿ ಸಂಭಾಷಣೆಗಳು, ಬೆಳೆ ರೋಗ ರಕ್ಷಣೆ ಮತ್ತು ಮಂಡಿ ದರಗಳನ್ನು ಪಡೆಯಲು ಖಾತೆಗೆ ಲಾಗ್ ಇನ್ ಅಥವಾ ಸೈನ್ ಅಪ್ ಮಾಡಿ."
                        : "You've used all 3 free trial questions with Bhoomi AI. Create a free account or sign in to unlock unlimited voice consultations, crop health tracking, and live mandi rates."}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onSignIn}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-base shadow-lg shadow-purple-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <span>{isKn ? "ಸೈನ್ ಇನ್ / ನೋಂದಾಯಿಸಿ" : "Sign In / Register to Continue"}</span>
                        <ArrowRightIcon className="w-5 h-5" />
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

// Listening View
const ListeningView: React.FC<{
    texts: UIStringContent;
    speechError: string | null;
    isTranscribing?: boolean;
    onStop?: () => void;
}> = ({ texts, speechError, isTranscribing, onStop }) => {
    return (
        <motion.div
            key="listening-view"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center listening-overlay-bg rounded-2xl backdrop-blur-xl bg-black/70 cursor-pointer"
            onClick={onStop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.2 }}
        >
            <motion.p
                className="text-white text-3xl font-light mb-12 tracking-wide text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            >
                {isTranscribing ? "Recognizing speech with Sarvam AI..." : texts.listening}
            </motion.p>

            <ListeningAnimation />

            <motion.div
                className="absolute bottom-16 flex flex-col items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.2 } }}
            >
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onStop?.();
                    }}
                    className="w-20 h-20 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Stop recording"
                >
                    <MicrophoneIcon className="w-10 h-10 text-white" />
                </button>
                <span className="text-sm text-blue-200/80 font-medium bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    Click anywhere or mic to Stop & Send
                </span>
            </motion.div>

            {speechError && (
                <div className="absolute top-10 text-red-200 bg-red-900/50 border border-red-500/30 px-6 py-3 rounded-xl backdrop-blur-md">
                    {speechError}
                </div>
            )}
        </motion.div>
    );
};

// Assistant Home Screen
const AssistantHomeScreen: React.FC<{
    user?: UserProfile;
    texts: UIStringContent;
    currentLanguage: Language;
    onStartConversation: (p: string, a: File | null) => void;
    isRecording: boolean;
    isTranscribing: boolean;
    onToggleRecording: () => void;
    speechError: string | null;
    isDemoMode?: boolean;
    demoCount: number;
    onRequireAuth?: () => void;
    onClose?: () => void;
    setCurrentLanguage: (lang: Language) => void;
}> = ({ 
    user, texts, currentLanguage, onStartConversation, isRecording, 
    isTranscribing, onToggleRecording, speechError, isDemoMode, 
    demoCount, onRequireAuth, onClose, setCurrentLanguage 
}) => {
    const [userInput, setUserInput] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [factIndex, setFactIndex] = useState(0);

    const isKn = currentLanguage === Language.KN;
    const remainingPrompts = Math.max(0, DEMO_PROMPT_LIMIT - demoCount);

    useEffect(() => {
        const interval = setInterval(() => {
            setFactIndex((prevIndex) => (prevIndex + 1) % (texts.agriculturalFacts.length || 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [texts.agriculturalFacts.length]);

    const handleSubmit = () => {
        if (userInput.trim() || attachment) {
            onStartConversation(userInput, attachment);
            setUserInput('');
            setAttachment(null);
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setAttachment(e.target.files[0]);
    };

    return (
        <div className="flex flex-col h-full bhoomi-galaxy-container text-white p-4 md:p-8 overflow-hidden relative">
            <div className="stars-bg"></div>

            {/* Top Navigation & Demo Badge Bar */}
            <div className="w-full flex justify-between items-center z-20 relative mb-2">
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition-colors text-xs flex items-center gap-1.5 font-mono"
                            aria-label="Close Assistant"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{isKn ? "ಮುಖ್ಯ ಪುಟ" : "Back to Home"}</span>
                        </button>
                    )}
                </div>

                {/* Demo Quota Badge */}
                {isDemoMode && (
                    <div className="flex items-center gap-2">
                        {remainingPrompts > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-medium animate-pulse shadow-sm">
                                <SparklesIcon className="w-3.5 h-3.5 text-blue-400" />
                                <span>
                                    {isKn 
                                        ? `ಉಚಿತ ಡೆಮೊ: ${remainingPrompts}/${DEMO_PROMPT_LIMIT} ಪ್ರಶ್ನೆಗಳು ಬಾಕಿ`
                                        : `Free Demo: ${remainingPrompts}/${DEMO_PROMPT_LIMIT} prompts left`}
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={onRequireAuth}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
                            >
                                <span>🔒 {isKn ? "ಮಿತಿ ಮುಗಿದಿದೆ • ಸೈನ್ ಇನ್ ಮಾಡಿ" : "Limit Reached • Sign In"}</span>
                            </button>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <LanguageToggle currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} size="sm" />
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition-colors"
                            aria-label="Close"
                        >
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center z-10 relative">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, type: "spring" }}
                    className="mb-8 relative"
                >
                    <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-blue-400 to-purple-500 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                        BHOOMI
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="mt-2 max-w-xl text-xl text-blue-100/80 font-light tracking-wide"
                >
                    {texts.assistantWelcome}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="mt-16 w-full max-w-3xl"
                >
                    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-10 tracking-tight">
                        How can I help you today?
                    </h2>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="relative group">
                        <div className="relative flex items-center input-field-glow rounded-2xl p-2 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder={isTranscribing ? "Recognizing speech with Sarvam AI..." : isRecording ? "Listening... Click mic again to stop" : isDemoMode && remainingPrompts === 0 ? "Demo limit reached. Click Sign In to continue." : texts.messagePlaceholder}
                                disabled={isDemoMode && remainingPrompts === 0}
                                className="relative w-full pl-6 pr-40 py-4 bg-transparent text-white placeholder-blue-200/50 text-lg border-none focus:ring-0 focus:outline-none disabled:opacity-60"
                            />
                            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,application/pdf,.doc,.docx" />

                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isRecording || (isDemoMode && remainingPrompts === 0)} className="p-3 rounded-xl text-blue-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40" aria-label={texts.attachFile}>
                                    <PaperClipIcon className="w-6 h-6" />
                                </button>

                                <button
                                    type="button"
                                    onClick={onToggleRecording}
                                    disabled={isDemoMode && remainingPrompts === 0}
                                    className={`p-3 rounded-xl transition-all disabled:opacity-40 ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40 ring-2 ring-red-400' : isTranscribing ? 'bg-purple-600 text-white animate-spin' : 'text-blue-300 hover:text-white hover:bg-white/10'}`}
                                    aria-label={texts.askWithVoice}
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>

                                <button type="submit" disabled={(!userInput.trim() && !attachment) || (isDemoMode && remainingPrompts === 0)} className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:shadow-none transition-all transform hover:scale-105">
                                    <PaperAirplaneIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </form>

                    {attachment && (
                        <div className="mt-4 text-left animate-fade-in-up">
                            <div className="inline-flex items-center justify-between bg-white/10 border border-white/10 backdrop-blur-md text-blue-100 px-4 py-2 rounded-xl text-sm shadow-lg">
                                <PaperClipIcon className="w-4 h-4 mr-2 text-blue-400" />
                                <span className="truncate max-w-[200px] font-medium">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)} className="ml-3 text-blue-300 hover:text-white transition-colors"><XCircleIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}
                    {speechError && <div className="mt-3 text-red-300 text-sm font-medium bg-red-900/30 py-1 px-3 rounded-lg inline-block">{speechError}</div>}
                </motion.div>
            </div>

            <div className="h-24 flex flex-col justify-end items-center text-center z-10 relative pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={factIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="glass-panel px-6 py-3 rounded-full"
                    >
                        <p className={`text-sm text-blue-200/80 max-w-2xl ${currentLanguage === 'kn' ? 'font-kannada' : ''}`}>
                            <SparklesIcon className="w-4 h-4 inline mr-2 text-yellow-400" />
                            {texts.agriculturalFacts[factIndex]}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// Assistant Chat Screen
const ChatScreen: React.FC<{
    texts: UIStringContent;
    currentLanguage: Language;
    history: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (m: string, a: File | null) => void;
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (e: boolean) => void;
    isRecording: boolean;
    isTranscribing: boolean;
    onToggleRecording: () => void;
    isSpeaking: boolean;
    onCancelSpeak: () => void;
    setCurrentLanguage: (l: Language) => void;
    onGoHome: () => void;
    speechError: string | null;
    isDemoMode?: boolean;
    demoCount: number;
    onRequireAuth?: () => void;
    onClose?: () => void;
}> = (props) => {
    const {
        texts, currentLanguage, history, isLoading, onSendMessage,
        isVoiceEnabled, setIsVoiceEnabled, isRecording, isTranscribing,
        onToggleRecording, isSpeaking, onCancelSpeak, setCurrentLanguage,
        onGoHome, speechError, isDemoMode, demoCount, onRequireAuth, onClose
    } = props;
    const [userInput, setUserInput] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [displayLang, setDisplayLang] = useState<Language>(currentLanguage);

    const isKn = currentLanguage === Language.KN;
    const remainingPrompts = Math.max(0, DEMO_PROMPT_LIMIT - demoCount);

    useEffect(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [history]);

    const handleSendClick = () => {
        if (userInput.trim() || attachment) {
            onSendMessage(userInput, attachment);
            setUserInput('');
            setAttachment(null);
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setAttachment(e.target.files[0]);
    };

    const isGenerating = isLoading && history.length > 0 && history[history.length - 1].role === 'user';

    return (
        <div className="flex flex-col h-full bhoomi-galaxy-container text-white overflow-hidden">
            <div className="stars-bg"></div>

            <header className="flex-shrink-0 glass-panel p-4 z-20 rounded-t-xl relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button onClick={onGoHome} variant="subtle" size="sm" className="!text-blue-200 hover:!text-white hover:!bg-white/10 !rounded-xl">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="font-bold text-white text-lg">B</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight">Bhoomi AI</h3>
                                <p className="text-xs text-blue-300 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    {isDemoMode ? (isKn ? "ಉಚಿತ ಡೆಮೊ" : "Free Demo Mode") : "Online"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Center: Demo Badge */}
                    {isDemoMode && (
                        <div className="hidden sm:flex items-center">
                            {remainingPrompts > 0 ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-medium shadow-sm">
                                    <SparklesIcon className="w-3.5 h-3.5 text-blue-400" />
                                    <span>
                                        {isKn 
                                            ? `${remainingPrompts}/${DEMO_PROMPT_LIMIT} ಪ್ರಶ್ನೆಗಳು ಬಾಕಿ`
                                            : `${remainingPrompts}/${DEMO_PROMPT_LIMIT} prompts left`}
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={onRequireAuth}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
                                >
                                    <span>🔒 {isKn ? "ಸೈನ್ ಇನ್ ಮಾಡಿ" : "Sign In to Continue"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <LanguageToggle currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} />

                        {isSpeaking ? (
                            <Button
                                onClick={onCancelSpeak}
                                variant="danger"
                                size="sm"
                                className="!rounded-full !pl-3 !pr-4 !bg-red-500/80 hover:!bg-red-600 backdrop-blur-md border border-red-400/30 animate-pulse shadow-lg shadow-red-500/20"
                                aria-label={texts.cancelVoiceOutput}
                                leftIcon={<SpeakerXMarkIcon className="w-5 h-5" />}
                            >
                                <span className="hidden sm:inline">{texts.cancel}</span>
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                                variant="subtle"
                                size="sm"
                                className={`!rounded-full !p-2 hover:!bg-white/10 border ${isVoiceEnabled ? 'border-green-500/30 bg-green-500/10 !text-green-400' : 'border-white/10 !text-gray-400'}`}
                                aria-label={texts.voiceOutput}
                            >
                                {isVoiceEnabled ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
                            </Button>
                        )}

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto galaxy-scrollbar relative z-10">
                <div className="max-w-4xl mx-auto space-y-8 pb-4">
                    <AnimatePresence>
                        {history.map((msg, index) => {
                            const isLastMessage = index === history.length - 1;
                            const isCurrentlySpeaking = isLastMessage && msg.role === 'model' && isSpeaking;

                            return (
                                <motion.div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                >
                                    <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-center gap-2 mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${msg.role === 'model' ? 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 text-white' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 text-white'} ${isCurrentlySpeaking ? 'speaking-indicator ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}`}>
                                                {msg.role === 'model' ? <SparklesIcon className={`w-4 h-4 ${isCurrentlySpeaking ? 'animate-pulse' : ''}`} /> : <UserCircleIcon className="w-5 h-5" />}
                                            </div>
                                            <span className={`text-xs font-medium ${msg.role === 'model' ? 'text-cyan-300/80' : 'text-purple-300/80'}`}>{msg.role === 'model' ? 'Bhoomi AI' : 'You'}</span>
                                            {isCurrentlySpeaking && <SpeakerWaveIcon className="w-4 h-4 text-cyan-400 animate-pulse" />}
                                        </div>

                                        <div className={`rounded-2xl p-5 ${msg.role === 'user' ? 'msg-bubble-user text-white rounded-tr-none' : 'msg-bubble-ai text-gray-100 rounded-tl-none'}`}>
                                            {/* MODEL RESPONSE: ANALYSIS REPORT */}
                                            {msg.role === 'model' && msg.analysisReport && history[index - 1]?.attachment?.dataUrl && (
                                                <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                                                    <div className="relative">
                                                        <div className="absolute top-2 right-2 flex items-center bg-black/40 backdrop-blur-md rounded-full p-1 z-10 border border-white/10">
                                                            <button onClick={() => setDisplayLang(Language.EN)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${displayLang === Language.EN ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}>EN</button>
                                                            <button onClick={() => setDisplayLang(Language.KN)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${displayLang === Language.KN ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}>KN</button>
                                                        </div>
                                                        <PlantAnalysisResult
                                                            result={msg.analysisReport}
                                                            uploadedImage={history[index - 1].attachment!.dataUrl!}
                                                            texts={texts}
                                                            language={displayLang}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* MODEL RESPONSE: TEXT */}
                                            {msg.role === 'model' && !msg.analysisReport && msg.text && (
                                                <MarkdownRenderer content={msg.text} language={currentLanguage} />
                                            )}

                                            {/* USER MESSAGE */}
                                            {msg.role === 'user' && (
                                                <>
                                                    {msg.text && <MarkdownRenderer content={msg.text} language={currentLanguage} />}
                                                    {msg.attachment?.dataUrl && (
                                                        <div className="mt-3 relative group">
                                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                                            <img src={msg.attachment.dataUrl} alt={msg.attachment.name} className="relative rounded-lg max-w-xs max-h-60 border border-white/20 shadow-lg" />
                                                        </div>
                                                    )}
                                                    {msg.attachment && !msg.attachment.dataUrl && (
                                                        <div className="mt-2 inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-xl text-sm border border-white/10">
                                                            <PaperClipIcon className="w-4 h-4" /><span className="truncate">{msg.attachment.name}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {isGenerating && (
                        <motion.div
                            className="flex justify-start"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="msg-bubble-ai rounded-2xl rounded-tl-none p-5 flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                                <span className="text-sm text-gray-400 animate-pulse">Bhoomi is thinking...</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            <footer className="input-glow-container p-4 z-20 relative">
                <div className="max-w-4xl mx-auto">
                    {attachment && (
                        <div className="mb-3 animate-fade-in-up">
                            <div className="inline-flex items-center justify-between bg-blue-500/20 border border-blue-500/30 text-blue-100 px-4 py-2 rounded-xl text-sm backdrop-blur-md">
                                <PaperClipIcon className="w-4 h-4 mr-2" />
                                <span className="truncate max-w-[200px]">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)} className="ml-3 text-blue-300 hover:text-white"><XCircleIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-md shadow-xl">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,application/pdf,.doc,.docx" />

                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-3 rounded-xl text-blue-300 hover:text-white hover:bg-white/10 transition-colors" aria-label={texts.attachFile}>
                            <PaperClipIcon className="w-6 h-6" />
                        </button>

                        <input
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && !isLoading && handleSendClick()}
                            placeholder={isTranscribing ? "Recognizing speech with Sarvam AI..." : isRecording ? "Listening... Click mic to send" : texts.messagePlaceholder}
                            disabled={isLoading || isTranscribing}
                            className="flex-grow px-3 py-2 text-base bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-blue-200/50"
                        />

                        <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                        <button 
                            type="button"
                            onClick={onToggleRecording} 
                            disabled={isLoading || isTranscribing} 
                            className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40 ring-2 ring-red-400' : isTranscribing ? 'bg-purple-600 text-white animate-spin' : 'text-blue-300 hover:text-white hover:bg-white/10'}`} 
                            aria-label={texts.askWithVoice}
                        >
                            <MicrophoneIcon className="w-6 h-6" />
                        </button>

                        <button onClick={handleSendClick} disabled={isLoading || (!userInput.trim() && !attachment)} className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:shadow-none transition-all transform hover:scale-105">
                            <PaperAirplaneIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {speechError && <p className="mt-2 text-xs text-red-400 text-center font-medium">{speechError}</p>}
                </div>
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
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
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

    // Initial load/cleanup
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

    // Get or initialize AudioContext
    const getAudioContext = (): AudioContext => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    };

    // Native browser Web Speech API fallback
    const speakBrowserFallback = useCallback((text: string, onEnd: () => void) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = currentLanguage === Language.KN ? 'kn-IN' : 'en-IN';
            utterance.rate = 1.0;
            utterance.pitch = 1.05;
            utterance.onend = () => onEnd();
            utterance.onerror = () => onEnd();
            window.speechSynthesis.speak(utterance);
        } else {
            onEnd();
        }
    }, [currentLanguage]);

    // Stop speaking, clear state and increment session ID to invalidate pending TTS requests
    const handleCancelSpeak = useCallback(() => {
        currentSessionIdRef.current += 1;
        playlistRef.current = [];
        nextPlayIndexRef.current = 0;
        isPlayingAudioRef.current = false;
        setIsSpeaking(false);

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        if (activeSourceNodeRef.current) {
            try {
                activeSourceNodeRef.current.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            activeSourceNodeRef.current = null;
        }
    }, []);

    // Core play PCM or WAV via Web Audio API
    const playAudioBuffer = async (base64Data: string, isWav: boolean, text: string, sessionId: number) => {
        isPlayingAudioRef.current = true;
        setIsSpeaking(true);

        try {
            const audioCtx = getAudioContext();
            const arrayBuffer = base64ToArrayBuffer(base64Data);
            let audioBuffer: AudioBuffer;

            if (isWav) {
                // Sarvam AI returns standard WAV audio
                audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            } else {
                // Gemini TTS returns raw 24kHz PCM16 audio
                const float32Data = convertPCM16ToFloat32(arrayBuffer);
                audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
                audioBuffer.copyToChannel(float32Data, 0);
            }

            if (currentSessionIdRef.current !== sessionId) return;

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            activeSourceNodeRef.current = source;

            source.onended = () => {
                if (currentSessionIdRef.current !== sessionId) return;
                activeSourceNodeRef.current = null;
                isPlayingAudioRef.current = false;
                processPlaylist(sessionId);
            };

            source.start(0);
        } catch (err) {
            console.warn("AudioBuffer decode error, falling back to Web Speech:", err);
            speakBrowserFallback(text, () => {
                if (currentSessionIdRef.current === sessionId) {
                    isPlayingAudioRef.current = false;
                    processPlaylist(sessionId);
                }
            });
        }
    };

    // Play next item in the playlist
    const processPlaylist = useCallback((sessionId: number) => {
        if (currentSessionIdRef.current !== sessionId) return;
        if (isPlayingAudioRef.current) return;

        const nextItem = playlistRef.current.find(p => p.index === nextPlayIndexRef.current);
        if (!nextItem) {
            const allCompleted = playlistRef.current.every(p => p.status === 'resolved' || p.status === 'failed');
            if (allCompleted && playlistRef.current.length > 0) {
                setIsSpeaking(false);
            }
            return;
        }

        if (nextItem.status === 'resolved' && nextItem.base64Data) {
            nextPlayIndexRef.current++;
            playAudioBuffer(nextItem.base64Data, !!nextItem.isWav, nextItem.text, sessionId);
        } else if (nextItem.status === 'failed') {
            nextPlayIndexRef.current++;
            // Use instant browser speech synthesis fallback for failed chunks
            isPlayingAudioRef.current = true;
            setIsSpeaking(true);
            speakBrowserFallback(nextItem.text, () => {
                if (currentSessionIdRef.current === sessionId) {
                    isPlayingAudioRef.current = false;
                    processPlaylist(sessionId);
                }
            });
        }
    }, [speakBrowserFallback]);

    // Async fetch TTS chunk from Sarvam AI with fallback to Gemini TTS
    const fetchSpeech = async (text: string, index: number, sessionId: number) => {
        try {
            // 1. Primary: Sarvam AI Bulbul (ultra-natural Indian conversational voice)
            let base64 = await generateSarvamSpeech(text, currentLanguage);
            let isWav = true;

            // 2. Secondary: Gemini 2.5 Flash TTS
            if (!base64) {
                base64 = await generateSpeech(text);
                isWav = false;
            }

            if (currentSessionIdRef.current !== sessionId) return;

            const entry = playlistRef.current.find(p => p.index === index);
            if (entry) {
                entry.base64Data = base64 || undefined;
                entry.isWav = isWav;
                entry.status = base64 ? 'resolved' : 'failed';
            }
            processPlaylist(sessionId);
        } catch (err) {
            console.error(`[TTS Fetch Error] Index: ${index}`, err);
            if (currentSessionIdRef.current !== sessionId) return;

            const entry = playlistRef.current.find(p => p.index === index);
            if (entry) {
                entry.status = 'failed';
            }
            processPlaylist(sessionId);
        }
    };

    // Single-shot queue speech (for disease detection summary)
    const queueSpeech = useCallback((text: string) => {
        if (!text || !text.trim()) return;
        const sessionId = currentSessionIdRef.current;
        const idx = playlistRef.current.length;
        playlistRef.current.push({ index: idx, text, status: 'pending' });
        fetchSpeech(text, idx, sessionId);
    }, [currentLanguage]);

    const handleSendMessage = useCallback(async (message: string, attachment: File | null) => {
        if (isSendingRef.current || isLoading) return;

        // Check if Demo Quota limit reached
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
        handleCancelSpeak(); // Clear previous speech & reset session
        setCurrentView('chat');
        setIsLoading(true);

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: message };
        if (attachment) {
            const dataUrl = await fileToDataURL(attachment);
            userMessage.attachment = { name: attachment.name, type: attachment.type, dataUrl };
        }
        setHistory(prev => [...prev, userMessage]);

        // Specific logic for plant disease analysis
        if (attachment?.type.startsWith('image/')) {
            try {
                const base64Image = await fileToBase64(attachment);
                const analysisReport = await getPlantDiseaseAnalysis(base64Image, attachment.type);
                const modelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', text: '', analysisReport };
                setHistory(prev => [...prev, modelMessage]);
                // Speak summary if voice is enabled
                if (isVoiceEnabled && analysisReport) {
                    const summary = analysisReport.isDiseaseFound ?
                        `${analysisReport.diseaseName[currentLanguage]} detected. Severity is ${analysisReport.severity[currentLanguage]}.` :
                        "The plant appears to be healthy.";
                    queueSpeech(summary);
                }
            } catch (e: any) {
                setHistory(prev => [...prev, { id: `model-err-${Date.now()}`, role: 'model', text: `${texts.errorPrefix} ${e.message}` }]);
            } finally {
                setIsLoading(false);
                isSendingRef.current = false;
            }
            return;
        }

        // Standard text-based chat with Ultra-Fast Groq / Gemini Streaming & Sentence TTS Pipelining
        try {
            const modelMessageId = `model-${Date.now()}`;
            setHistory(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

            // Initialize/unlock audio context on user interaction
            if (isVoiceEnabled) {
                try {
                    getAudioContext();
                } catch (e) {
                    console.warn("Failed to unlock AudioContext:", e);
                }
            }

            let fullResponse = '';
            let chunkBuffer = '';
            let sentenceIndex = 0;
            const sessionIdAtStreamStart = currentSessionIdRef.current;

            // Try Groq streaming first (sub-200ms latency)
            let usedGroq = false;
            try {
                const groqStream = getGroqBhoomiStream(
                    [...history, userMessage],
                    currentLanguage
                );

                for await (const chunk of groqStream) {
                    usedGroq = true;
                    if (currentSessionIdRef.current !== sessionIdAtStreamStart) break;

                    const text = chunk.text;
                    if (text) {
                        fullResponse += text;
                        chunkBuffer += text;

                        // Update UI immediately (streaming response)
                        setHistory(prev => prev.map(m => m.id === modelMessageId ? { ...m, text: fullResponse } : m));

                        if (isVoiceEnabled) {
                            const delimiters = /[.?!।\n]/;
                            if (delimiters.test(chunkBuffer)) {
                                const parts = chunkBuffer.split(/([.?!।\n])/);
                                while (parts.length > 2) {
                                    const sentenceText = (parts.shift() || '') + (parts.shift() || '');
                                    const trimmed = sentenceText.trim();
                                    if (trimmed && trimmed.length > 1) {
                                        const plainSentence = removeMarkdown(trimmed)
                                            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                                            .trim();
                                        
                                        if (plainSentence) {
                                            const idx = sentenceIndex++;
                                            playlistRef.current.push({ index: idx, text: plainSentence, status: 'pending' });
                                            fetchSpeech(plainSentence, idx, sessionIdAtStreamStart);
                                        }
                                    }
                                }
                                chunkBuffer = parts.join('');
                            }
                        }
                    }
                }
            } catch (groqErr) {
                console.warn("Groq streaming failed, falling back to Gemini 2.5 Flash:", groqErr);
            }

            // Fallback to Gemini 2.5 Flash if Groq was not used or failed before producing tokens
            if (!usedGroq || !fullResponse) {
                fullResponse = '';
                chunkBuffer = '';
                const responseStream = await getBhoomiResponseStream(
                    [...history, userMessage],
                    currentLanguage
                );

                for await (const chunk of responseStream) {
                    if (currentSessionIdRef.current !== sessionIdAtStreamStart) break;

                    const text = chunk.text;
                    if (text) {
                        fullResponse += text;
                        chunkBuffer += text;

                        setHistory(prev => prev.map(m => m.id === modelMessageId ? { ...m, text: fullResponse } : m));

                        if (isVoiceEnabled) {
                            const delimiters = /[.?!।\n]/;
                            if (delimiters.test(chunkBuffer)) {
                                const parts = chunkBuffer.split(/([.?!।\n])/);
                                while (parts.length > 2) {
                                    const sentenceText = (parts.shift() || '') + (parts.shift() || '');
                                    const trimmed = sentenceText.trim();
                                    if (trimmed && trimmed.length > 1) {
                                        const plainSentence = removeMarkdown(trimmed)
                                            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                                            .trim();
                                        
                                        if (plainSentence) {
                                            const idx = sentenceIndex++;
                                            playlistRef.current.push({ index: idx, text: plainSentence, status: 'pending' });
                                            fetchSpeech(plainSentence, idx, sessionIdAtStreamStart);
                                        }
                                    }
                                }
                                chunkBuffer = parts.join('');
                            }
                        }
                    }
                }
            }

            // Flush remaining buffer after stream finishes
            if (isVoiceEnabled && chunkBuffer.trim() && currentSessionIdRef.current === sessionIdAtStreamStart) {
                const plainSentence = removeMarkdown(chunkBuffer)
                    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                    .trim();
                if (plainSentence) {
                    const idx = sentenceIndex++;
                    playlistRef.current.push({ index: idx, text: plainSentence, status: 'pending' });
                    fetchSpeech(plainSentence, idx, sessionIdAtStreamStart);
                }
            }

        } catch (e: any) {
            console.error("Streaming Error:", e);
            setHistory(prev => [...prev, { id: `model-err-${Date.now()}`, role: 'model', text: `${texts.errorPrefix} ${e.message}` }]);
        } finally {
            setIsLoading(false);
            isSendingRef.current = false;
        }
    }, [currentLanguage, history, isVoiceEnabled, queueSpeech, texts, isLoading, isDemoMode, demoCount]);

    const handleVoiceResult = useCallback((transcript: string) => {
        if (transcript && transcript.trim()) {
            handleSendMessage(transcript.trim(), null);
        }
    }, [handleSendMessage]);

    const handleSpeechError = useCallback((error: string) => {
        let message = texts.errorSpeechGeneric;
        if (error === 'network') message = texts.errorSpeechNetwork;
        else if (error) message = error;
        setSpeechError(message);
        setTimeout(() => setSpeechError(null), 4000);
    }, [texts]);

    const { stopRecording, toggleRecording } = useSarvamAudioRecorder(
        handleVoiceResult,
        setIsRecording,
        setIsTranscribing,
        handleSpeechError,
        currentLanguage
    );

    const handleMicToggle = useCallback(() => {
        handleCancelSpeak();
        setSpeechError(null);
        toggleRecording(isRecording);
    }, [handleCancelSpeak, toggleRecording, isRecording]);

    const goHome = () => {
        handleCancelSpeak();
        setHistory([]);
        setIsLoading(false);
        setCurrentView('home');
    };

    return (
        <div className="w-full h-full relative">
            <AnimatePresence mode="wait">
                {currentView === 'home' ? (
                    <motion.div key="home" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AssistantHomeScreen
                            user={user}
                            texts={texts}
                            currentLanguage={currentLanguage}
                            onStartConversation={handleSendMessage}
                            isRecording={isRecording}
                            isTranscribing={isTranscribing}
                            onToggleRecording={handleMicToggle}
                            speechError={speechError}
                            isDemoMode={isDemoMode}
                            demoCount={demoCount}
                            onRequireAuth={() => {
                                handleCancelSpeak();
                                onRequireAuth?.();
                            }}
                            onClose={onClose}
                            setCurrentLanguage={setCurrentLanguage}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="chat" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ChatScreen
                            texts={texts}
                            currentLanguage={currentLanguage}
                            history={history}
                            isLoading={isLoading}
                            onSendMessage={handleSendMessage}
                            isVoiceEnabled={isVoiceEnabled}
                            setIsVoiceEnabled={setIsVoiceEnabled}
                            isRecording={isRecording}
                            isTranscribing={isTranscribing}
                            onToggleRecording={handleMicToggle}
                            isSpeaking={isSpeaking}
                            onCancelSpeak={handleCancelSpeak}
                            setCurrentLanguage={setCurrentLanguage}
                            onGoHome={goHome}
                            speechError={speechError}
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
                {isRecording && (
                    <ListeningView
                        texts={texts}
                        speechError={speechError}
                        isTranscribing={isTranscribing}
                        onStop={stopRecording}
                    />
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
