import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketRateRecord, Language, UIStringContent } from '../types';
import { mandiRateService } from '../services/mandiRateService';
import { useLanguage } from '../context/LanguageContext';
import { 
    Search, TrendingUp, TrendingDown, Minus, Filter, MapPin, 
    ArrowUpRight, Calculator, IndianRupee, RefreshCw, Sparkles, 
    CheckCircle2, ShieldCheck, Scale, Truck, Layers
} from 'lucide-react';

interface LiveMandiRadarProps {
    onListHarvest?: (commodity?: string, district?: string, modalPrice?: number) => void;
    compact?: boolean;
}

const CATEGORIES = ['all', 'Cash Crops', 'Vegetables', 'Cereals', 'Pulses', 'Oilseeds', 'Spices', 'Plantation', 'Fruits'];

const KARNATAKA_DISTRICTS = [
    'all', 'Haveri', 'Kolar', 'Belagavi', 'Mandya', 'Davanagere', 
    'Shivamogga', 'Kalaburagi', 'Raichur', 'Chikkamagaluru', 
    'Gadag', 'Chamarajanagar', 'Bagalkot', 'Tumakuru'
];

export const LiveMandiRadar: React.FC<LiveMandiRadarProps> = ({ onListHarvest, compact = false }) => {
    const { language, isKannada } = useLanguage();
    const [rates, setRates] = useState<MarketRateRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [calcModalRate, setCalcModalRate] = useState<number | null>(null);
    const [calcCropName, setCalcCropName] = useState<string>('');
    const [calcQuantity, setCalcQuantity] = useState<string>('25'); // Default 25 Quintals
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const unsub = mandiRateService.subscribeLiveMandiRates((liveRates) => {
            setRates(liveRates);
        });
        return () => unsub();
    }, []);

    const filteredRates = useMemo(() => {
        return mandiRateService.filterRates(rates, searchTerm, selectedDistrict, selectedCategory);
    }, [rates, searchTerm, selectedDistrict, selectedCategory]);

    const topGainers = useMemo(() => {
        return [...rates]
            .filter(r => r.priceTrend === 'UP')
            .sort((a, b) => parseFloat(b.changePercentage) - parseFloat(a.changePercentage))
            .slice(0, 4);
    }, [rates]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        const live = await mandiRateService.getLiveRates();
        setRates(live);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleOpenCalculator = (rate: MarketRateRecord) => {
        setCalcModalRate(rate.modalPrice);
        setCalcCropName(isKannada && rate.commodityKn ? rate.commodityKn : rate.commodity);
    };

    const estimatedRevenue = useMemo(() => {
        if (!calcModalRate) return 0;
        const q = parseFloat(calcQuantity) || 0;
        return q * calcModalRate;
    }, [calcModalRate, calcQuantity]);

    return (
        <div className="w-full space-y-6">
            {/* Header with Live Ticker Bar */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                                {isKannada ? "ಕರ್ನಾಟಕ ಎಪಿಎಂಸಿ ನೇರ ಮಾರುಕಟ್ಟೆ ದರಗಳು" : "KARNATAKA APMC LIVE MANDI RADAR"}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {isKannada ? "ದೈನಂದಿನ ಬೆಳೆ ಬೆಲೆ ಮತ್ತು ಆಗಮನ ಮಾಹಿತಿ" : "Daily APMC Commodity Rates & Arrivals"}
                        </h2>
                        <p className="text-xs text-neutral-400 font-mono mt-1">
                            {isKannada 
                                ? "ಕರ್ನಾಟಕದ 31 ಜಿಲ್ಲೆಗಳ ಪ್ರಮುಖ ಎಪಿಎಂಸಿ ಮಂಡಿಗಳಿಂದ ನೇರ ದರಗಳು • 0% ಮಧ್ಯವರ್ತಿ ಕಮಿಷನ್"
                                : "Real-time modal prices and daily arrivals across Karnataka APMC market yards • 0% Middleman Fees"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                            onClick={handleRefresh}
                            className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 hover:bg-neutral-800 transition-all"
                            title="Refresh Rates"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                            <span>{isKannada ? "ನವೀಕರಿಸಿ" : "Refresh"}</span>
                        </button>
                    </div>
                </div>

                {/* Top Gainers Marquee / Highlight Strip */}
                {topGainers.length > 0 && (
                    <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-3.5 mb-6">
                        <div className="flex items-center gap-2 mb-2 text-xs font-mono text-neutral-400">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isKannada ? "ಇಂದಿನ ಗರಿಷ್ಠ ಏರಿಕೆ ಕಂಡ ಬೆಳೆಗಳು (Top Gainers Today):" : "Top Price Gainers in Karnataka Today:"}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {topGainers.map((g, idx) => (
                                <div key={idx} className="bg-neutral-950 border border-neutral-800/60 rounded-xl p-2.5 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">
                                            {isKannada && g.commodityKn ? g.commodityKn : g.commodity}
                                        </p>
                                        <p className="text-[10px] font-mono text-neutral-500 truncate">{g.marketName}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-mono font-bold text-emerald-400">₹{g.modalPrice}/Q</p>
                                        <span className="text-[10px] font-mono text-emerald-500 font-semibold">{g.changePercentage}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Search Input */}
                    <div className="relative sm:col-span-1">
                        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={isKannada ? "ಬೆಳೆ ಅಥವಾ ಮಂಡಿ ಹುಡುಕಿ (ಉದಾ. ಹತ್ತಿ, ಟೊಮ್ಯಾಟೊ)..." : "Search crop or mandi (e.g. Cotton, Tomato)..."}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs font-mono rounded-xl pl-9 pr-4 py-2.5 focus:border-emerald-500 focus:outline-none transition-all"
                        />
                    </div>

                    {/* District Filter */}
                    <div>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs font-mono rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none transition-all"
                        >
                            <option value="all">{isKannada ? "ಎಲ್ಲಾ ಕರ್ನಾಟಕ ಜಿಲ್ಲೆಗಳು (All Districts)" : "All Karnataka Districts"}</option>
                            {KARNATAKA_DISTRICTS.filter(d => d !== 'all').map((d) => (
                                <option key={d} value={d}>{d} APMC</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs font-mono rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none transition-all"
                        >
                            <option value="all">{isKannada ? "ಎಲ್ಲಾ ಬೆಳೆ ವಿಭಾಗಗಳು (All Categories)" : "All Crop Categories"}</option>
                            {CATEGORIES.filter(c => c !== 'all').map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Mandi Rates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRates.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-neutral-950 border border-neutral-800 rounded-3xl">
                        <Scale className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                        <p className="text-sm font-mono text-neutral-400">
                            {isKannada ? "ಯಾವುದೇ ಮಂಡಿ ದರಗಳು ಕಂಡುಬಂದಿಲ್ಲ." : "No APMC commodity rates found matching your filter."}
                        </p>
                    </div>
                ) : (
                    filteredRates.map((rate, idx) => {
                        const isUp = rate.priceTrend === 'UP';
                        const isDown = rate.priceTrend === 'DOWN';
                        const hasMsp = Boolean(rate.mspPrice);
                        const diffMsp = hasMsp ? rate.modalPrice - (rate.mspPrice || 0) : 0;

                        return (
                            <motion.div
                                key={rate.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                                className="bg-neutral-950 border border-neutral-800/90 rounded-3xl p-5 hover:border-neutral-700 transition-all flex flex-col justify-between group shadow-xl"
                            >
                                <div>
                                    {/* Market and Category Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>{rate.marketName}</span>
                                        </div>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                                            {rate.category || 'Agri'}
                                        </span>
                                    </div>

                                    {/* Crop Title */}
                                    <div className="mb-3">
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-emerald-300 transition-colors">
                                            {rate.commodity}
                                        </h3>
                                        {rate.commodityKn && (
                                            <p className="text-xs font-medium text-neutral-400 mt-0.5 font-sans">
                                                {rate.commodityKn}
                                            </p>
                                        )}
                                        {rate.variety && (
                                            <p className="text-[11px] font-mono text-neutral-500 mt-1 line-clamp-1">
                                                {rate.variety} • {rate.grade || 'FAQ'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Main Price Display */}
                                    <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-3.5 mb-4">
                                        <div className="flex items-baseline justify-between mb-1.5">
                                            <span className="text-xs font-mono text-neutral-400">
                                                {isKannada ? "ಮಾದರಿ ದರ (Modal Price):" : "Modal Benchmark Rate:"}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xl font-bold text-white font-mono">
                                                    ₹{rate.modalPrice.toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-xs font-mono text-neutral-400">/ Qtl</span>
                                            </div>
                                        </div>

                                        {/* Min - Max Spread Bar */}
                                        <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                                            <span>{isKannada ? "ಕನಿಷ್ಠ:" : "Min:"} <strong className="text-neutral-300">₹{rate.minPrice}</strong></span>
                                            <div className="flex items-center gap-1">
                                                {isUp && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                                                {isDown && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                                                {!isUp && !isDown && <Minus className="w-3.5 h-3.5 text-neutral-400" />}
                                                <span className={`font-semibold ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-neutral-400'}`}>
                                                    {rate.changePercentage}
                                                </span>
                                            </div>
                                            <span>{isKannada ? "ಗರಿಷ್ಠ:" : "Max:"} <strong className="text-neutral-300">₹{rate.maxPrice}</strong></span>
                                        </div>
                                    </div>

                                    {/* MSP & Arrivals Telemetry */}
                                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-4">
                                        {hasMsp && (
                                            <div className="bg-neutral-900/50 rounded-xl p-2 border border-neutral-800/50">
                                                <span className="text-neutral-500 block text-[10px]">{isKannada ? "ಸರ್ಕಾರಿ ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆ (MSP):" : "Govt MSP:"}</span>
                                                <span className={`font-bold ${diffMsp >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    ₹{rate.mspPrice} ({diffMsp >= 0 ? `+₹${diffMsp}` : `-₹${Math.abs(diffMsp)}`})
                                                </span>
                                            </div>
                                        )}
                                        {rate.arrivalsTonnes && (
                                            <div className="bg-neutral-900/50 rounded-xl p-2 border border-neutral-800/50">
                                                <span className="text-neutral-500 block text-[10px]">{isKannada ? "ಇಂದಿನ ಆಗಮನ:" : "Arrivals Today:"}</span>
                                                <span className="font-bold text-neutral-300 flex items-center gap-1">
                                                    <Truck className="w-3 h-3 text-neutral-400" />
                                                    {rate.arrivalsTonnes} Tonnes
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                                    <button
                                        onClick={() => handleOpenCalculator(rate)}
                                        className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white py-2 px-3 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all"
                                        title="Calculate Expected Earnings"
                                    >
                                        <Calculator className="w-3.5 h-3.5 text-amber-400" />
                                        <span>{isKannada ? "ಲೆಕ್ಕಾಚಾರ" : "Calculate"}</span>
                                    </button>

                                    {onListHarvest && (
                                        <button
                                            onClick={() => onListHarvest(rate.commodity, rate.district, rate.modalPrice)}
                                            className="flex-1 bg-white hover:bg-neutral-200 text-black py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase flex items-center justify-center gap-1 transition-all"
                                        >
                                            <span>{isKannada ? "ಮಾರಾಟ ಮಾಡಿ" : "Sell Crop"}</span>
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Quick Earnings Calculator Modal */}
            <AnimatePresence>
                {calcModalRate !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setCalcModalRate(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-amber-400" />
                                    <h3 className="text-base font-bold text-white font-mono">
                                        {isKannada ? "ಆದಾಯ ಲೆಕ್ಕಾಚಾರ (Earnings Estimator)" : "Harvest Revenue Estimator"}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setCalcModalRate(null)}
                                    className="text-neutral-400 hover:text-white text-sm font-mono"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-mono text-neutral-400 block mb-1">
                                        {isKannada ? "ಆಯ್ಕೆಮಾಡಿದ ಬೆಳೆ ಮತ್ತು ಮಂಡಿ ದರ:" : "Selected Crop & APMC Rate:"}
                                    </label>
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex justify-between items-center font-mono">
                                        <span className="font-bold text-white">{calcCropName}</span>
                                        <span className="text-emerald-400 font-bold">₹{calcModalRate}/Quintal</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-mono text-neutral-400 block mb-1">
                                        {isKannada ? "ನಿಮ್ಮ ಒಟ್ಟು ಬೆಳೆ ತೂಕ (ಕ್ವಿಂಟಾಲ್‌ನಲ್ಲಿ):" : "Your Harvest Quantity (in Quintals):"}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.5"
                                        value={calcQuantity}
                                        onChange={(e) => setCalcQuantity(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-base font-bold rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none"
                                        placeholder="e.g. 50"
                                    />
                                </div>

                                {/* Payout Summary */}
                                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 space-y-2 font-mono">
                                    <div className="flex justify-between text-xs text-neutral-300">
                                        <span>{isKannada ? "ಅಂದಾಜು ಒಟ್ಟು ಮೊತ್ತ (Gross Revenue):" : "Estimated Gross Revenue:"}</span>
                                        <span className="text-white font-bold">₹{estimatedRevenue.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-emerald-400">
                                        <span>{isKannada ? "ವೇದಿಕೆ ಕಮಿಷನ್ ಶುಲ್ಕ (Platform Fee):" : "AgriVerse Platform Fee:"}</span>
                                        <span className="font-bold">₹0 (0% Commission)</span>
                                    </div>
                                    <div className="pt-2 border-t border-emerald-800/40 flex justify-between text-sm text-white font-bold">
                                        <span>{isKannada ? "ನೇರ ಬ್ಯಾಂಕ್ ಪಾವತಿ (Net Payout):" : "Net Direct Payout:"}</span>
                                        <span className="text-emerald-300 text-lg">₹{estimatedRevenue.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCalcModalRate(null)}
                                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-2.5 rounded-xl font-mono text-xs font-medium transition-all"
                                >
                                    {isKannada ? "ಮುಚ್ಚಿ" : "Close"}
                                </button>
                                {onListHarvest && (
                                    <button
                                        onClick={() => {
                                            const crop = calcCropName;
                                            const rate = calcModalRate;
                                            setCalcModalRate(null);
                                            onListHarvest(crop, undefined, rate);
                                        }}
                                        className="flex-1 bg-white hover:bg-neutral-200 text-black py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span>{isKannada ? "ಈಗಲೇ ಪಟ್ಟಿ ಮಾಡಿ" : "List This Batch"}</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LiveMandiRadar;
