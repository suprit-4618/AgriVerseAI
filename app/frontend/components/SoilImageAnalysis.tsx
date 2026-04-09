
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, SoilImageAnalysisReport } from '../types';
import { getSoilAnalysisFromImage } from '../services/geminiService';
import FileUpload from './common/FileUpload';
import LoadingSpinner from './common/LoadingSpinner';
import Button from './common/Button';
import { SparklesIcon, XCircleIcon, CheckCircleIcon, DocumentTextIcon } from './common/IconComponents';
import SoilImageAnalysisResult from './SoilImageAnalysisResult';

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const fileToBase64 = (dataUrl: string): string => dataUrl.split(',')[1];

const GuidelineList: React.FC<{ title: string, items: string[], isPossible: boolean }> = ({ title, items, isPossible }) => (
    <div className={`p-4 rounded-lg ${isPossible ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        <h4 className={`font-bold flex items-center gap-2 ${isPossible ? 'text-green-400' : 'text-red-400'}`}>
            {isPossible ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5" />}
            {title}
        </h4>
        <ul className="mt-2 ml-1 space-y-1 text-sm text-gray-300">
            {items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-500 mt-1">&rarr;</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

const InitialUploadView: React.FC<{ onFileAccepted: (files: File[]) => void, texts: UIStringContent }> = ({ onFileAccepted, texts }) => {
    const possibleItems = [
        "Soil Color Analysis → Organic matter, iron content",
        "Visual Texture Estimation → Sandy, Loamy, Clay",
        "Moisture Detection → Darker (wet) vs. lighter (dry)",
        "Surface Features → Stones, erosion, cracks",
    ];
    const notPossibleItems = [
        "Exact Nutrient Levels (N, P, K)",
        "Soil pH (acidity/alkalinity)",
        "Heavy metal contamination",
        "These require professional laboratory soil testing.",
    ];
    
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-xl bg-gray-800/50">
                <h3 className="text-xl font-bold text-center text-white mb-2">Analyze Soil from an Image</h3>
                <p className="text-center text-gray-400 mb-6">Upload a clear, well-lit photo of a soil sample for an instant qualitative analysis powered by AI vision.</p>
                
                <div className="p-6 bg-gray-800 rounded-xl shadow-md">
                     <FileUpload onFileAccepted={onFileAccepted} promptText="Click to upload or drag & drop a soil image" />
                </div>

                <div className="mt-6 border-t border-gray-700 pt-6">
                     <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                        Understanding Image Analysis
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <GuidelineList title="What's Possible with an Image" items={possibleItems} isPossible={true} />
                        <GuidelineList title="What's NOT Possible" items={notPossibleItems} isPossible={false} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface SoilImageAnalysisProps {
    texts: UIStringContent;
}

const SoilImageAnalysis: React.FC<SoilImageAnalysisProps> = ({ texts }) => {
    const [report, setReport] = useState<SoilImageAnalysisReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    const handleFileAccepted = useCallback(async (files: File[]) => {
        const file = files[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            const dataUrl = await fileToDataURL(file);
            setUploadedImage(dataUrl);
            const base64Image = fileToBase64(dataUrl);
            const result = await getSoilAnalysisFromImage(base64Image, file.type);
            setReport(result);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred during image analysis.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleReset = () => {
        setReport(null);
        setIsLoading(false);
        setError(null);
        setUploadedImage(null);
    };

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center">
                    <LoadingSpinner size="lg" text="Analyzing soil image..." color="text-green-500"/>
                </motion.div>
            )}
            {error && (
                 <motion.div key="error" className="h-full flex flex-col items-center justify-center text-center p-4 bg-red-900/50 rounded-lg max-w-lg mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <XCircleIcon className="w-12 h-12 text-red-400 mb-4" />
                    <h3 className="text-xl font-bold text-red-300">Analysis Failed</h3>
                    <p className="text-red-200 mt-2">{error}</p>
                    <Button onClick={handleReset} variant="danger" className="mt-4">Try Again</Button>
                </motion.div>
            )}
            {report && uploadedImage && !isLoading && (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SoilImageAnalysisResult report={report} image={uploadedImage} onReset={handleReset} />
                </motion.div>
            )}
            {!isLoading && !error && !report && (
                <motion.div key="initial">
                     <InitialUploadView onFileAccepted={handleFileAccepted} texts={texts} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SoilImageAnalysis;
