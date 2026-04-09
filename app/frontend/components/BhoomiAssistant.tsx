import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Language, UIStringContent, ChatMessage, PlantAnalysisReport } from '../types';
import { uiStrings } from '../constants';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import { createChatSession, getPlantDiseaseAnalysis } from '../services/geminiService';
import { Chat } from '@google/genai';
import {
    ArrowLeftIcon, PaperClipIcon, XCircleIcon, MicrophoneIcon, PaperAirplaneIcon, SparklesIcon,
    SpeakerWaveIcon, SpeakerXMarkIcon, UserCircleIcon
} from './common/IconComponents';
import ListeningAnimation from './common/ListeningAnimation';
import GeneratingAnimation from './common/GeneratingAnimation';
import MarkdownRenderer from './common/MarkdownRenderer';
import LanguageToggle from './common/LanguageToggle';
import PlantAnalysisResult from './PlantAnalysisResult';
import './BhoomiGalaxyTheme.css'; // Import the new theme

// Global declarations
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
        .replace(/^\s*[\-\*]\s/gm, '')
        .replace(/^\s*\d+\.\s/gm, '')
        .replace(/^#+\s/gm, '');
};


// Speech Recognition Hook
const useSpeechRecognition = (onResult: (t: string) => void, onEnd: () => void, onError: (e: string) => void, lang: Language) => {
    const recRef = useRef<any>(null);
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { return; }
        const r = new SpeechRecognition();
        r.continuous = false; r.interimResults = false;
        r.lang = lang === Language.KN ? 'kn-IN' : 'en-US';
        r.onresult = (e: any) => onResult(e.results[0][0].transcript);
        r.onend = onEnd;
        r.onerror = (e: any) => { onError(e.error); onEnd(); };
        recRef.current = r;
    }, [lang, onResult, onEnd, onError]);
    return { startRecognition: useCallback(() => { if (recRef.current) { try { recRef.current.start(); } catch (e) { console.error(e); onEnd(); } } }, [onEnd]) };
};

// Component to render the Gemini-like typing effect with FASTER speed
const TypingEffect: React.FC<{ text: string; language: Language }> = ({ text, language }) => {
    const [displayedText, setDisplayedText] = useState('');
    const charsPerFrame = 3; // Show 3 characters per frame for faster typing

    useEffect(() => {
        if (displayedText.length < text.length) {
            const timer = setTimeout(() => {
                // Add multiple characters per frame for faster typing
                const nextLength = Math.min(displayedText.length + charsPerFrame, text.length);
                setDisplayedText(text.substring(0, nextLength));
            }, 10); // Ultra-fast: 10ms per 3 characters = ~300 chars/sec
            return () => clearTimeout(timer);
        }
    }, [text, displayedText]);

    // Safeguard to reset if the parent component sends an empty text
    useEffect(() => {
        if (text === '') {
            setDisplayedText('');
        }
    }, [text]);

    const showCursor = displayedText.length === text.length;
    const isEmpty = displayedText.length === 0;

    return (
        <p className={`whitespace-pre-wrap text-sm md:text-base leading-relaxed ${language === Language.KN ? 'font-kannada' : ''} ${showCursor ? '' : 'typing-cursor-animated'}`}>
            {displayedText}
            {isEmpty && showCursor && '\u00A0'}
        </p>
    );
};


interface BhoomiAssistantProps {
    user: UserProfile;
    currentLanguage: Language;
    setCurrentLanguage: (lang: Language) => void;
}

// Listening View
const ListeningView: React.FC<{ texts: UIStringContent; speechError: string | null }> = ({ texts, speechError }) => {
    return (
        <motion.div
            key="listening-view"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center listening-overlay-bg rounded-2xl backdrop-blur-xl bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 0.2 }}
        >
            <motion.p
                className="text-white text-3xl font-light mb-12 tracking-wide"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            >
                {texts.listening}
            </motion.p>

            <ListeningAnimation />

            <motion.div
                className="absolute bottom-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.3 } }}
            >
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                    <MicrophoneIcon className="w-10 h-10 text-white" />
                </div>
            </motion.div>

            {speechError && <div className="absolute top-10 text-red-200 bg-red-900/40 border border-red-500/30 px-6 py-3 rounded-xl backdrop-blur-md">{speechError}</div>}
        </motion.div>
    );
};


// Assistant Home Screen
const AssistantHomeScreen: React.FC<{
    user: UserProfile; texts: UIStringContent; currentLanguage: Language;
    onStartConversation: (p: string, a: File | null) => void;
    isRecording: boolean; setIsRecording: (i: boolean) => void;
    speechError: string | null; setSpeechError: (e: string | null) => void;
    onSpeechError: (e: string) => void;
    onCancelSpeak: () => void;
}> = ({ user, texts, currentLanguage, onStartConversation, isRecording, setIsRecording, speechError, setSpeechError, onSpeechError, onCancelSpeak }) => {
    const [userInput, setUserInput] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [factIndex, setFactIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFactIndex((prevIndex) => (prevIndex + 1) % (texts.agriculturalFacts.length || 1));
        }, 5000); // Change fact every 5 seconds
        return () => clearInterval(interval);
    }, [texts.agriculturalFacts.length]);

    const handleVoiceResult = (transcript: string) => onStartConversation(transcript, null);
    const handleVoiceEnd = () => setIsRecording(false);
    const { startRecognition } = useSpeechRecognition(handleVoiceResult, handleVoiceEnd, onSpeechError, currentLanguage);

    const handleMicClick = () => {
        onCancelSpeak();
        setSpeechError(null);
        setIsRecording(true);
        startRecognition();
    };
    const handleSubmit = () => { if (userInput.trim() || attachment) onStartConversation(userInput, attachment); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setAttachment(e.target.files[0]); };

    return (
        <div className="flex flex-col h-full bhoomi-galaxy-container text-white p-4 md:p-8 overflow-hidden">
            <div className="stars-bg"></div>

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
                                placeholder={texts.messagePlaceholder}
                                className="relative w-full pl-6 pr-40 py-4 bg-transparent text-white placeholder-blue-200/50 text-lg border-none focus:ring-0 focus:outline-none"
                            />
                            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,application/pdf,.doc,.docx" />

                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isRecording} className="p-3 rounded-xl text-blue-300 hover:text-white hover:bg-white/10 transition-all" aria-label={texts.attachFile}>
                                    <PaperClipIcon className="w-6 h-6" />
                                </button>

                                <button type="button" onClick={handleMicClick} disabled={isRecording} className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40' : 'text-blue-300 hover:text-white hover:bg-white/10'}`} aria-label={texts.askWithVoice}>
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>

                                <button type="submit" disabled={!userInput.trim() && !attachment} className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:shadow-none transition-all transform hover:scale-105">
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
    texts: UIStringContent; currentLanguage: Language; history: ChatMessage[]; isLoading: boolean;
    onSendMessage: (m: string, a: File | null) => void; isVoiceEnabled: boolean; setIsVoiceEnabled: (e: boolean) => void;
    isRecording: boolean; setIsRecording: (i: boolean) => void; isSpeaking: boolean; onCancelSpeak: () => void; setCurrentLanguage: (l: Language) => void;
    onGoHome: () => void; speechError: string | null; setSpeechError: (e: string | null) => void;
    onSpeechError: (e: string) => void;
}> = (props) => {
    const { texts, currentLanguage, history, isLoading, onSendMessage, isVoiceEnabled, setIsVoiceEnabled, isRecording, setIsRecording, isSpeaking, onCancelSpeak, setCurrentLanguage, onGoHome, speechError, setSpeechError, onSpeechError } = props;
    const [userInput, setUserInput] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [displayLang, setDisplayLang] = useState<Language>(currentLanguage);

    useEffect(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [history]);

    const handleSendClick = () => { onSendMessage(userInput, attachment); setUserInput(''); setAttachment(null); };
    const handleVoiceResult = (transcript: string) => onSendMessage(transcript, null);
    const handleVoiceEnd = () => setIsRecording(false);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setAttachment(e.target.files[0]); };
    const { startRecognition } = useSpeechRecognition(handleVoiceResult, handleVoiceEnd, onSpeechError, currentLanguage);
    const handleMicClick = () => {
        onCancelSpeak();
        setSpeechError(null);
        setIsRecording(true);
        startRecognition();
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
                                    Online
                                </p>
                            </div>
                        </div>
                    </div>

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
                    </div>
                </div>
            </header>

            <main ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto galaxy-scrollbar relative z-10">
                <div className="max-w-4xl mx-auto space-y-8 pb-4">
                    <AnimatePresence>
                        {history.map((msg, index) => {
                            const isLastMessage = index === history.length - 1;
                            const isStreaming = isLastMessage && isLoading && msg.role === 'model' && !msg.analysisReport;
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
                                                isStreaming ? (
                                                    <TypingEffect text={msg.text} language={currentLanguage} />
                                                ) : (
                                                    <MarkdownRenderer content={msg.text} language={currentLanguage} />
                                                )
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
                            placeholder={texts.messagePlaceholder}
                            disabled={isLoading}
                            className="flex-grow px-3 py-2 text-base bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-blue-200/30"
                        />

                        <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                        <button onClick={handleMicClick} disabled={isRecording || isLoading} className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'text-blue-300 hover:text-white hover:bg-white/10'}`} aria-label={texts.askWithVoice}>
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

// Bhoomi AI Assistant Main Component
const BhoomiAssistant: React.FC<BhoomiAssistantProps> = (props) => {
    const { currentLanguage, user, setCurrentLanguage } = props;
    const texts = uiStrings[currentLanguage];
    const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);

    // ============ INSTANT BROWSER TTS - ZERO LATENCY ============
    // Using browser's built-in SpeechSynthesis for INSTANT speech
    const speechQueueRef = useRef<string[]>([]);
    const isProcessingQueueRef = useRef(false);

    useEffect(() => {
        try {
            setChat(createChatSession());
            setHistory([]);
        } catch (error) { console.error(error); }

        // Preload browser voices
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }

        return () => handleCancelSpeak();
    }, [currentLanguage]);

    const handleCancelSpeak = useCallback(() => {
        speechQueueRef.current = [];
        isProcessingQueueRef.current = false;
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    // INSTANT speech using browser's native TTS
    const processSpeechQueue = useCallback(() => {
        if (isProcessingQueueRef.current || speechQueueRef.current.length === 0) {
            if (speechQueueRef.current.length === 0) setIsSpeaking(false);
            return;
        }

        if (!window.speechSynthesis) {
            console.warn('SpeechSynthesis not available');
            return;
        }

        isProcessingQueueRef.current = true;
        setIsSpeaking(true);

        const textToSpeak = speechQueueRef.current.shift();
        if (!textToSpeak) {
            isProcessingQueueRef.current = false;
            setIsSpeaking(false);
            return;
        }

        const plainText = removeMarkdown(textToSpeak).trim();
        if (!plainText) {
            isProcessingQueueRef.current = false;
            processSpeechQueue();
            return;
        }

        // Create utterance - INSTANT, no network call!
        const utterance = new SpeechSynthesisUtterance(plainText);

        // Find best voice for the language
        const voices = window.speechSynthesis.getVoices();
        const langCode = currentLanguage === Language.KN ? 'kn' : 'en';

        // Try to find a female voice
        let voice = voices.find(v => v.lang.startsWith(langCode) && v.name.toLowerCase().includes('female'));
        if (!voice) voice = voices.find(v => v.lang.startsWith(langCode));
        if (!voice && currentLanguage === Language.KN) {
            // Fallback: Hindi or any Indian voice for Kannada
            voice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
        }
        if (!voice) voice = voices.find(v => v.lang.startsWith('en'));

        if (voice) utterance.voice = voice;

        // Optimize for natural, fast speech
        utterance.rate = 1.1; // Slightly faster
        utterance.pitch = 1.05; // Slightly higher for friendly tone
        utterance.volume = 1.0;
        utterance.lang = currentLanguage === Language.KN ? 'kn-IN' : 'en-US';

        utterance.onend = () => {
            isProcessingQueueRef.current = false;
            processSpeechQueue(); // Continue with next in queue
        };

        utterance.onerror = () => {
            isProcessingQueueRef.current = false;
            processSpeechQueue(); // Try next
        };

        // Speak IMMEDIATELY - no waiting!
        window.speechSynthesis.speak(utterance);
    }, [currentLanguage]);

    const queueSpeech = useCallback((text: string) => {
        if (!text || !text.trim()) return;
        speechQueueRef.current.push(text);
        processSpeechQueue();
    }, [processSpeechQueue]);

    const handleSpeechError = (error: string) => {
        let message = texts.errorSpeechGeneric;
        if (error === 'network') message = texts.errorSpeechNetwork;
        setSpeechError(message);
        setTimeout(() => setSpeechError(null), 4000);
    };

    const handleSendMessage = useCallback(async (message: string, attachment: File | null) => {
        if (!chat) return;

        handleCancelSpeak(); // Clear previous speech
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
            }
            return;
        }

        // Standard text-based chat with Streaming TTS
        try {
            const stream = await chat.sendMessageStream({ message });
            let fullResponse = '';
            let chunkBuffer = '';
            const modelMessageId = `model-${Date.now()}`;
            setHistory(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

            for await (const chunk of stream) {
                const newText = chunk.text;
                fullResponse += newText;
                chunkBuffer += newText;

                setHistory(prev => prev.map(m => m.id === modelMessageId ? { ...m, text: fullResponse } : m));

                if (isVoiceEnabled) {
                    // INSTANT Browser TTS - speak quickly as text arrives
                    // Use smaller chunks for immediate speech (no network delay)
                    const sentenceEnd = chunkBuffer.match(/[.!?।,]\s*$/);
                    if (sentenceEnd || chunkBuffer.length > 30) {
                        queueSpeech(chunkBuffer);
                        chunkBuffer = '';
                    }
                }
            }

            // Speak any remaining text in buffer
            if (isVoiceEnabled && chunkBuffer.trim()) {
                queueSpeech(chunkBuffer);
            }

        } catch (e) {
            console.error(e);
            setHistory(prev => [...prev, { id: `model-err-${Date.now()}`, role: 'model', text: texts.errorApiGeneric }]);
        } finally {
            setIsLoading(false);
        }
    }, [chat, isVoiceEnabled, queueSpeech, handleCancelSpeak, texts, currentLanguage]);

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
                            setIsRecording={setIsRecording}
                            speechError={speechError}
                            setSpeechError={setSpeechError}
                            onSpeechError={handleSpeechError}
                            onCancelSpeak={handleCancelSpeak}
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
                            setIsRecording={setIsRecording}
                            isSpeaking={isSpeaking}
                            onCancelSpeak={handleCancelSpeak}
                            setCurrentLanguage={setCurrentLanguage}
                            onGoHome={goHome}
                            speechError={speechError}
                            setSpeechError={setSpeechError}
                            onSpeechError={handleSpeechError}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isRecording && <ListeningView texts={texts} speechError={speechError} />}
            </AnimatePresence>
        </div>
    );
};

export default BhoomiAssistant;
