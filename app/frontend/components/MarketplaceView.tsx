
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, MarketAnalysisReport, Language } from '../types';
import { karnatakaMarkets, marketCrops } from '../constants';
import { getMarketAnalysis } from '../services/geminiService';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import Select from './common/Select';
import { SparklesIcon, BarChartIcon, MapPinIcon, ArrowUpRightIcon, ArrowDownRightIcon } from './common/IconComponents';
import LineChart from './common/charts/LineChart';
import HorizontalBarChart from './common/charts/HorizontalBarChart';


const PriceCard: React.FC<{ title: string; value: number; trend: 'up' | 'down' | 'neutral' }> = ({ title, value, trend }) => {
    const trendIcon = trend === 'up' ? <ArrowUpRightIcon className="w-5 h-5 text-green-500" /> : trend === 'down' ? <ArrowDownRightIcon className="w-5 h-5 text-red-500" /> : null;
    return (
        <div className="bg-gray-800/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400">{title}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-2xl font-bold text-white">₹{value.toLocaleString('en-IN')}</p>
                {trendIcon}
            </div>
        </div>
    );
};


interface MarketplaceViewProps {
    texts: UIStringContent;
    onClose: () => void;
    currentLanguage: Language;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ texts, onClose, currentLanguage }) => {
    const [selectedMarket, setSelectedMarket] = useState<{ name: string } | null>(null);
    const [selectedCrop, setSelectedCrop] = useState<{ name: string } | null>(null);
    const [analysisResult, setAnalysisResult] = useState<MarketAnalysisReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (!selectedMarket || !selectedCrop) {
            setError("Please select both a market and a crop.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await getMarketAnalysis(selectedCrop.name, selectedMarket.name);
            setAnalysisResult(result);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedMarket, selectedCrop]);
    
    const lineChartData = analysisResult?.priceTrend.map(p => ({
        month: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        detections: p.price
    })) || [];
    
    const comparisonChartData = analysisResult?.comparisonMarkets.map(m => ({
        name: m.marketName,
        value: m.modalPrice
    })) || [];


    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-100">
            <header className="p-4 sm:p-6 text-center border-b border-gray-700">
                <h2 className="text-2xl sm:text-3xl font-bold">{texts.marketplaceTitle}</h2>
                <p className="text-sm sm:text-base text-gray-400 mt-1 max-w-2xl mx-auto">{texts.marketplaceDescription}</p>
            </header>

            <main className="flex-1 grid md:grid-cols-12 gap-6 p-4 sm:p-6 overflow-y-auto dark-scrollbar">
                 {/* Input Panel */}
                <aside className="md:col-span-4 lg:col-span-3 space-y-5 p-4 bg-gray-800/50 rounded-xl shadow-sm h-fit sticky top-6">
                    <div className="space-y-3">
                         <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center gap-2">
                           <MapPinIcon className="w-5 h-5 text-green-500" /> Market & Crop
                        </h3>
                        <Select
                            items={karnatakaMarkets}
                            selectedItem={selectedMarket}
                            onSelectItem={setSelectedMarket}
                            getLabel={(item) => item.name}
                            placeholder={texts.selectMarket}
                        />
                        <Select
                            items={marketCrops}
                            selectedItem={selectedCrop}
                            onSelectItem={setSelectedCrop}
                            getLabel={(item) => item.name}
                            placeholder={texts.selectCrop}
                        />
                    </div>
                    <div className="pt-2">
                        <Button 
                            onClick={handleAnalyze} 
                            disabled={isLoading || !selectedMarket || !selectedCrop}
                            className="w-full !bg-green-600 hover:!bg-green-700 !text-white !text-base !font-bold disabled:!bg-green-400 disabled:cursor-not-allowed"
                            leftIcon={<SparklesIcon className="w-5 h-5"/>}
                        >
                            {isLoading ? texts.loadingMarketAnalysis.split('...')[0] : texts.analyzePrices}
                        </Button>
                    </div>
                </aside>
                
                 {/* Results Panel */}
                <div className="md:col-span-8 lg:col-span-9 p-4 sm:p-6 rounded-xl bg-gray-800/50 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {isLoading && (
                             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center">
                                <LoadingSpinner size="lg" text={texts.loadingMarketAnalysis} color="text-green-500"/>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center p-4 bg-red-900/50 rounded-lg">
                                <h3 className="text-xl font-bold text-red-300">Analysis Failed</h3>
                                <p className="text-red-200 mt-2">{error}</p>
                                <Button onClick={handleAnalyze} variant="danger" className="mt-4">Try Again</Button>
                            </motion.div>
                        )}
                        {analysisResult && !isLoading && (
                            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }} className="space-y-6">
                                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                    <h3 className="text-2xl font-bold text-gradient-green-blue">{texts.priceAnalysisFor} {analysisResult.cropName}</h3>
                                    <p className="text-gray-400">{texts.in} {analysisResult.homeMarket.marketName}</p>
                                </motion.div>

                                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <PriceCard title={texts.minPrice} value={analysisResult.homeMarket.minPrice} trend="neutral" />
                                    <PriceCard title={texts.modalPrice} value={analysisResult.homeMarket.modalPrice} trend="up" />
                                    <PriceCard title={texts.maxPrice} value={analysisResult.homeMarket.maxPrice} trend="neutral" />
                                </motion.div>

                                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-4 bg-gray-800/50 rounded-lg">
                                    <h4 className="font-semibold mb-2">{texts.marketInsight}</h4>
                                    <p className="text-sm text-gray-300 italic">{analysisResult.marketInsight}</p>
                                </motion.div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-4 bg-gray-800/50 rounded-lg">
                                        <h4 className="font-semibold mb-2">{texts.priceTrend30Days}</h4>
                                        <div className="h-64">
                                             <LineChart data={lineChartData} />
                                        </div>
                                    </motion.div>
                                    <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-4 bg-gray-800/50 rounded-lg">
                                        <h4 className="font-semibold mb-2">{texts.marketComparison}</h4>
                                        <div className="h-64">
                                            <HorizontalBarChart data={comparisonChartData} homeValue={analysisResult.homeMarket.modalPrice} homeLabel={analysisResult.homeMarket.marketName} />
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                        {!isLoading && !error && !analysisResult && (
                            <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                <BarChartIcon className="w-24 h-24 mb-4"/>
                                <h3 className="text-xl font-semibold text-white">Market Analysis</h3>
                                <p className="mt-2 max-w-sm">Select a market and a crop to get the latest price analysis and insights.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default MarketplaceView;
