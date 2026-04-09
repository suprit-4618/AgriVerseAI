

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, SoilData, SoilAnalysisReport, CropRecommendation, DistrictData, Taluk, Village, NutrientDetail, SavedSoilReport } from '../types';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import { getSoilAnalysis } from '../services/geminiService';
import { CheckBadgeIcon, CircleStackIcon, SparklesIcon, MapPinIcon, ExclamationTriangleIcon, ClockIcon, PhotoIcon, InformationCircleIcon, XCircleIcon } from './common/IconComponents';
import { karnatakaLocationData } from '../data/karnatakaLocationData';
import { soilDatasetInfo } from '../data/soilDataset';
import Select from './common/Select';
import GaugeChart from './common/charts/GaugeChart';

import SoilAnalysisHistory from './SoilAnalysisHistory';
import SoilImageAnalysis from './SoilImageAnalysis';


interface SoilAnalysisProps {
    texts: UIStringContent;
}

const initialSoilData: SoilData = {

    ph: 6.5,
    temperature: 26,
    humidity: 75,
    rainfall: 1200,
};

// --- Sub-components ---

const DatasetInfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{soilDatasetInfo.title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="p-6 overflow-y-auto dark-scrollbar">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{soilDatasetInfo.description}</p>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{soilDatasetInfo.sampleTitle}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{soilDatasetInfo.sampleDescription}</p>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    {soilDatasetInfo.headers.map(header => (
                                        <th key={header} scope="col" className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {soilDatasetInfo.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-200">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </motion.div>
        </motion.div>
    );
};

interface ParameterSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (value: number) => void;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({ label, value, min, max, step, unit, onChange }) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return (
        <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-baseline">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <span className="text-lg font-bold text-green-500">{value.toFixed(label === 'pH Level' ? 1 : 0)} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{unit}</span></span>
            </div>
            <div className="relative h-2">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                        background: `linear-gradient(to right, #22c55e ${percentage}%, #374151 ${percentage}%)`
                    }}
                />
            </div>
        </div>
    );
};

const SuitabilityGauge: React.FC<{ score: number }> = ({ score }) => {
    const circumference = 2 * Math.PI * 18; // r=18
    const offset = circumference - (score / 100) * circumference;
    const color = score > 80 ? 'text-green-500' : score > 60 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90">
                <circle className="text-gray-300 dark:text-gray-700" strokeWidth="4" stroke="currentColor" fill="transparent" r="18" cx="24" cy="24" />
                <motion.circle
                    className={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="18"
                    cx="24"
                    cy="24"
                    style={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                />
            </svg>
            <span className={`text-sm font-bold ${color}`}>{score}</span>
        </div>
    );
};

const CropCard: React.FC<{ recommendation: CropRecommendation, texts: UIStringContent }> = ({ recommendation, texts }) => {
    return (
        <motion.div
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col gap-3 h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{recommendation.crop}</h4>
                <div className="flex flex-col items-center">
                    <SuitabilityGauge score={recommendation.suitabilityScore} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">{texts.suitability}</span>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-grow">{recommendation.reason}</p>
            <div>
                <h5 className="font-semibold text-sm mb-1 text-gray-800 dark:text-gray-200">{texts.plantingTips}:</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{recommendation.plantingTips}</p>
            </div>
        </motion.div>
    );
};

const NutrientStatusCard: React.FC<{
    title: string;
    detail: NutrientDetail;
    unit: string;
    texts: UIStringContent;
    currentValue?: number;
    targetValue?: number;
}> = ({ title, detail, unit, texts, currentValue, targetValue }) => {
    const statusColor = () => {
        const s = detail.status.toLowerCase();
        if (s.includes('optimal') || s.includes('adequate') || s.includes('neutral')) return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-300';
        if (s.includes('deficient') || s.includes('low')) return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-300';
        if (s.includes('surplus') || s.includes('high')) return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-300';
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-400';
    };

    const isPhCard = title === texts.ph;
    const deviation = currentValue !== undefined && targetValue !== undefined ? Math.abs(currentValue - targetValue) : 0;
    const hasDeviation = isPhCard && deviation > 0.5;

    return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
            <div className={`mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusColor()}`}>
                {detail.status}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Ideal: {detail.idealRange[0]} - {detail.idealRange[1]} {unit}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{detail.analysis}</p>
            {hasDeviation && (
                <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '8px' }}
                    className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-md flex items-start gap-2 overflow-hidden"
                >
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                        Current pH of <strong>{currentValue?.toFixed(1)}</strong> deviates from your goal of <strong>{targetValue?.toFixed(1)}</strong>.
                    </p>
                </motion.div>
            )}
        </div>
    );
};

const AnalysisResultView: React.FC<{
    result: SoilAnalysisReport;
    texts: UIStringContent;
    currentSoilData: SoilData;
    targetPh: number;
}> = ({ result, texts, currentSoilData, targetPh }) => {



    const phDeviation = Math.abs(currentSoilData.ph - targetPh);
    const isPhDeviated = phDeviation > 0.5;

    return (
        <AnimatePresence>
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
            >
                <div className="flex justify-end">
                    <Button onClick={() => window.print()} variant="primary" size="sm" className="non-printable">Download Report</Button>
                </div>
                <div className="printable-area">
                    <div className="hidden print:block mb-4 text-center">
                        <h1 className="text-2xl font-bold">Soil Analysis Report</h1>
                        <p className="text-sm">Generated on: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Score and Summary */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col items-center justify-center text-center">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{texts.soilHealthScoreTitle}</h3>
                                <GaugeChart value={result.soilHealthScore} />
                                {isPhDeviated && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-md text-xs text-yellow-800 dark:text-yellow-300 w-full"
                                    >
                                        <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                        <span>pH is off target</span>
                                    </motion.div>
                                )}
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl shadow-lg">
                                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">{texts.soilHealthSummary}</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-200">{result.soilHealthSummary}</p>
                            </motion.div>
                        </div>

                        {/* Right Column: Radar Chart and Nutrient Details */}
                        <div className="lg:col-span-2 flex flex-col gap-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <NutrientStatusCard title={texts.ph} detail={result.nutrientAnalysis.ph} unit="" texts={texts} currentValue={currentSoilData.ph} targetValue={targetPh} />
                            </div>
                        </div>
                    </div>

                    {/* Crop Recommendations */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 mt-6">{texts.cropRecommendations}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {result.recommendations.slice(0, 3).map(rec => (
                                <CropCard key={rec.crop} recommendation={rec} texts={texts} />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};


// --- Main Component ---
const SoilAnalysis: React.FC<SoilAnalysisProps> = ({ texts }) => {
    const [soilData, setSoilData] = useState<SoilData>(initialSoilData);
    const [analysisResult, setAnalysisResult] = useState<SoilAnalysisReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [targetPh, setTargetPh] = useState<number>(6.8);
    const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);

    // View state
    const [view, setView] = useState<'parameters' | 'image' | 'history'>('parameters');
    const [historicalReports, setHistoricalReports] = useState<SavedSoilReport[]>([]);

    // Location state
    const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
    const [selectedTaluk, setSelectedTaluk] = useState<Taluk | null>(null);
    const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
    const [availableTaluks, setAvailableTaluks] = useState<Taluk[]>([]);
    const [availableVillages, setAvailableVillages] = useState<Village[]>([]);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('soilAnalysisHistory');
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                // Filter out reports with missing soilData to prevent crashes
                const validHistory = Array.isArray(parsedHistory)
                    ? parsedHistory.filter((r: any) => r && r.soilData)
                    : [];
                setHistoricalReports(validHistory);
            }
        } catch (e) {
            console.error("Failed to load history from localStorage", e);
            localStorage.removeItem('soilAnalysisHistory');
        }
    }, []);

    useEffect(() => {
        if (selectedDistrict) {
            setAvailableTaluks(selectedDistrict.taluks);
            setSelectedTaluk(null);
            setSelectedVillage(null);
        } else {
            setAvailableTaluks([]);
        }
    }, [selectedDistrict]);

    useEffect(() => {
        if (selectedTaluk) {
            setAvailableVillages(selectedTaluk.villages);
            setSelectedVillage(null);
        } else {
            setAvailableVillages([]);
        }
    }, [selectedTaluk]);


    const handleSliderChange = useCallback((param: keyof SoilData, value: number) => {
        setSoilData(prev => ({ ...prev, [param]: value }));
    }, []);

    const handleAnalyzeClick = async () => {
        if (!selectedDistrict || !selectedTaluk || !selectedVillage) {
            setError("Please select a complete location (District, Taluk, and Village).");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await getSoilAnalysis(soilData, {
                district: selectedDistrict.name,
                taluk: selectedTaluk.name,
                village: selectedVillage.name
            });

            const newSavedReport: SavedSoilReport = {
                id: new Date().toISOString(),
                date: new Date().toISOString(),
                location: { district: selectedDistrict.name, taluk: selectedTaluk.name, village: selectedVillage.name },
                report: result,
                soilData: soilData,
            };
            const updatedHistory = [...historicalReports, newSavedReport];
            setHistoricalReports(updatedHistory);
            localStorage.setItem('soilAnalysisHistory', JSON.stringify(updatedHistory));

            setAnalysisResult(result);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to delete all saved reports? This action cannot be undone.")) {
            setHistoricalReports([]);
            localStorage.removeItem('soilAnalysisHistory');
            setView('parameters');
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            <AnimatePresence>
                {isDatasetModalOpen && <DatasetInfoModal onClose={() => setIsDatasetModalOpen(false)} />}
            </AnimatePresence>
            <header className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-gray-700 non-printable">
                <h2 className="text-2xl sm:text-3xl font-bold">{texts.soilAnalysisTitle}</h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 max-w-2xl mx-auto">{texts.soilAnalysisDescription}</p>
                <div className="mt-4 flex justify-center items-center gap-2 bg-gray-200 dark:bg-gray-800 p-1 rounded-full w-fit mx-auto">
                    <Button onClick={() => setView('parameters')} className={`!rounded-full ${view === 'parameters' ? '!bg-white dark:!bg-gray-700 !shadow-sm' : '!bg-transparent'}`}><span className="text-sm">Parameters</span></Button>
                    <Button onClick={() => setView('image')} className={`!rounded-full ${view === 'image' ? '!bg-white dark:!bg-gray-700 !shadow-sm' : '!bg-transparent'}`} leftIcon={<PhotoIcon className="w-4 h-4" />}><span className="text-sm">Image Analysis</span></Button>
                    <Button onClick={() => setView('history')} disabled={historicalReports.length === 0} className={`!rounded-full ${view === 'history' ? '!bg-white dark:!bg-gray-700 !shadow-sm' : '!bg-transparent'}`} leftIcon={<ClockIcon className="w-4 h-4" />}><span className="text-sm">History</span></Button>
                </div>
            </header>

            <main className={`flex-1 overflow-y-auto dark-scrollbar ${view === 'parameters' ? 'grid md:grid-cols-12 gap-6 p-4 sm:p-6' : 'p-4 sm:p-6'}`}>
                {/* Input Panel for Parameter View */}
                {view === 'parameters' && (
                    <aside className="md:col-span-4 lg:col-span-3 space-y-5 p-4 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm h-fit sticky top-6">

                        {/* Location Selection */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5 text-green-500" /> {texts.locationTitle}
                            </h3>
                            <Select
                                items={karnatakaLocationData}
                                selectedItem={selectedDistrict}
                                onSelectItem={setSelectedDistrict}
                                getLabel={(item) => item.name}
                                placeholder={texts.selectDistrict}
                            />
                            <Select
                                items={availableTaluks}
                                selectedItem={selectedTaluk}
                                onSelectItem={setSelectedTaluk}
                                getLabel={(item) => item.name}
                                placeholder={texts.selectTaluk}
                                disabled={!selectedDistrict}
                            />
                            <Select
                                items={availableVillages}
                                selectedItem={selectedVillage}
                                onSelectItem={setSelectedVillage}
                                getLabel={(item) => item.name}
                                placeholder={texts.selectVillage}
                                disabled={!selectedTaluk}
                            />
                        </div>

                        {/* Soil Parameters */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">{texts.soilParamTitle}</h3>

                            <ParameterSlider label={texts.ph} value={soilData.ph} min={3} max={10} step={0.1} unit="" onChange={(v) => handleSliderChange('ph', v)} />
                            <div className="flex flex-col space-y-2 pt-2">
                                <label htmlFor="targetPh" className="text-sm font-medium text-gray-700 dark:text-gray-300">Target pH Goal</label>
                                <input
                                    id="targetPh"
                                    type="number"
                                    step="0.1"
                                    min="3"
                                    max="10"
                                    value={targetPh}
                                    onChange={(e) => setTargetPh(parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-center font-bold text-green-500"
                                />
                            </div>
                            <ParameterSlider label={texts.temperature} value={soilData.temperature} min={0} max={50} step={1} unit="°C" onChange={(v) => handleSliderChange('temperature', v)} />
                            <ParameterSlider label={texts.humidity} value={soilData.humidity} min={0} max={100} step={1} unit="%" onChange={(v) => handleSliderChange('humidity', v)} />
                            <ParameterSlider label={texts.rainfall} value={soilData.rainfall} min={200} max={3000} step={10} unit="mm" onChange={(v) => handleSliderChange('rainfall', v)} />
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleAnalyzeClick}
                                disabled={isLoading || !selectedVillage}
                                className="w-full !bg-green-600 hover:!bg-green-700 !text-white !text-base !font-bold disabled:!bg-green-400 disabled:cursor-not-allowed"
                                leftIcon={<SparklesIcon className="w-5 h-5" />}
                            >
                                {isLoading ? texts.loadingAnalysis.split('...')[0] : texts.soilAnalysisButton}
                            </Button>
                        </div>
                        <div className="pt-2 text-center">
                            <button
                                onClick={() => setIsDatasetModalOpen(true)}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors flex items-center gap-1.5 mx-auto"
                            >
                                <InformationCircleIcon className="w-4 h-4" />
                                Model Accuracy & Data Source
                            </button>
                        </div>
                    </aside>
                )}

                {/* Results Panel */}
                <div className={view === 'parameters' ? "md:col-span-8 lg:col-span-9 p-4 sm:p-6 rounded-xl bg-gray-100 dark:bg-gray-800/50" : ""}>
                    <AnimatePresence mode="wait">
                        {view === 'parameters' && (
                            <motion.div key="parameters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {isLoading && (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <LoadingSpinner size="lg" text={texts.loadingAnalysis} color="text-green-500" />
                                    </div>
                                )}
                                {error && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                        <h3 className="text-xl font-bold text-red-700 dark:text-red-300">Analysis Failed</h3>
                                        <p className="text-red-600 dark:text-red-200 mt-2">{error}</p>
                                        <Button onClick={handleAnalyzeClick} variant="danger" className="mt-4">Try Again</Button>
                                    </div>
                                )}
                                {analysisResult && <AnalysisResultView result={analysisResult} texts={texts} currentSoilData={soilData} targetPh={targetPh} />}
                                {!isLoading && !error && !analysisResult && (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                                        <CircleStackIcon className="w-24 h-24 mb-4" />
                                        <h3 className="text-xl font-semibold">Ready for Analysis</h3>
                                        <p className="mt-2 max-w-sm">Select your location and adjust the parameters on the left, then click the "Analyze" button to get personalized crop recommendations.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {view === 'image' && (
                            <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SoilImageAnalysis texts={texts} />
                            </motion.div>
                        )}

                        {view === 'history' && (
                            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SoilAnalysisHistory reports={historicalReports} texts={texts} onClearHistory={handleClearHistory} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default SoilAnalysis;