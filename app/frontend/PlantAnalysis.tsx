

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, Language, PlantAnalysisReport } from './types';
import FileUpload from './components/common/FileUpload';
import LoadingSpinner from './components/common/LoadingSpinner';
import { getPlantDiseaseAnalysis } from './services/geminiService';
import Button from './components/common/Button';
import { BugIcon, CameraIcon, CloudUploadIcon, XCircleIcon, BarChartIcon } from './components/common/IconComponents';
import CameraCapture from './CameraCapture';
import PlantHealthDashboard from './components/PlantHealthDashboard';
import PlantAnalysisResult from './components/PlantAnalysisResult';


// Helper to convert file to base64
const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const fileToBase64 = (dataUrl: string): string => dataUrl.split(',')[1];

interface PlantAnalysisProps {
    texts: UIStringContent;
    currentLanguage: Language;
}

const PlantAnalysis: React.FC<PlantAnalysisProps> = ({ texts, currentLanguage }) => {
    const [view, setView] = useState<'upload' | 'camera' | 'loading' | 'results' | 'error' | 'dashboard'>('upload');
    const [analysisResult, setAnalysisResult] = useState<PlantAnalysisReport | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [displayLang, setDisplayLang] = useState<Language>(currentLanguage);

    const performAnalysis = useCallback(async (imageDataUrl: string, mimeType: string) => {
        setView('loading');
        setUploadedImage(imageDataUrl);
        try {
            const base64Image = fileToBase64(imageDataUrl);
            const result = await getPlantDiseaseAnalysis(base64Image, mimeType);
            setAnalysisResult(result);
            setView('results');
        } catch (err: any) {
            setErrorMessage(err.message || texts.errorAnalysis);
            setView('error');
        }
    }, [texts.errorAnalysis]);

    const handleFileAccepted = useCallback(async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        const imageDataUrl = await fileToDataURL(file);
        performAnalysis(imageDataUrl, file.type);
    }, [performAnalysis]);

    const handleCameraCapture = useCallback((imageDataUrl: string) => {
        performAnalysis(imageDataUrl, 'image/jpeg');
    }, [performAnalysis]);

    const handleReset = () => {
        setAnalysisResult(null);
        setUploadedImage(null);
        setErrorMessage('');
        setView('upload');
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-poppins">
            <header className="p-4 text-center border-b border-gray-200 dark:border-gray-700 non-printable">
                <h2 className="text-2xl font-bold">{texts.plantAnalysisTitle}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl mx-auto">
                    {view === 'results' ? texts.analysisResults : view === 'dashboard' ? texts.plantHealthDashboardTitle : texts.plantAnalysisDescription}
                </p>
            </header>

            <main className="flex-1 overflow-y-auto dark-scrollbar relative">
                <AnimatePresence mode="wait">
                    {view === 'upload' && (
                        <motion.div key="upload" className="w-full h-full flex flex-col items-center justify-center p-8" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="text-center">
                                <BugIcon className="w-16 h-16 text-green-500 mb-4 inline-block" />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-4xl">
                                <div className="flex-1 w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center">
                                    <CloudUploadIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                                    <FileUpload onFileAccepted={handleFileAccepted} promptText={texts.uploadPlantImagePrompt} />
                                </div>
                                <span className="font-semibold text-gray-500 dark:text-gray-400">{texts.or}</span>
                                <div className="flex-1 w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center">
                                    <CameraIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                                    <Button onClick={() => setView('camera')} variant="primary" size="lg" className="w-full !bg-purple-600 hover:!bg-purple-700">
                                        {texts.captureWithCamera}
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 w-full max-w-4xl pt-6 text-center">
                                <Button onClick={() => setView('dashboard')} variant="ghost" size="lg" leftIcon={<BarChartIcon className="w-5 h-5" />}>
                                    {texts.viewHealthDashboard}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                    {view === 'camera' && (
                        <motion.div key="camera" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <CameraCapture onCapture={handleCameraCapture} onBack={() => setView('upload')} texts={texts} />
                        </motion.div>
                    )}
                    {view === 'loading' && (
                        <motion.div key="loading" className="w-full h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <LoadingSpinner size="lg" text={texts.analyzingPlant} color="text-green-500" />
                        </motion.div>
                    )}
                    {view === 'results' && analysisResult && uploadedImage && (
                        <motion.div key="results" className="relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="absolute top-2 right-16 flex items-center bg-gray-200 dark:bg-gray-900/50 rounded-full p-1 non-printable z-10">
                                <button onClick={() => setDisplayLang(Language.EN)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${displayLang === Language.EN ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>EN</button>
                                <button onClick={() => setDisplayLang(Language.KN)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${displayLang === Language.KN ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>KN</button>
                            </div>
                            <PlantAnalysisResult result={analysisResult} uploadedImage={uploadedImage} texts={texts} language={displayLang} onReset={handleReset} />
                        </motion.div>
                    )}
                    {view === 'dashboard' && (
                        <motion.div key="dashboard" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <PlantHealthDashboard texts={texts} onBack={() => setView('upload')} language={currentLanguage} />
                        </motion.div>
                    )}
                    {view === 'error' && (
                        <motion.div key="error" className="w-full h-full flex flex-col items-center justify-center p-8 text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
                            <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Analysis Failed</h3>
                            <p className="text-red-600 dark:text-red-300 mt-2 max-w-md">{errorMessage}</p>
                            <Button onClick={handleReset} variant="danger" className="mt-6">
                                Try Again
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default PlantAnalysis;