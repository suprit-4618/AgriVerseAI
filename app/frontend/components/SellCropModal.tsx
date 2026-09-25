import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, CropCategory, UserProfile, Language } from '../types';
import { karnatakaMarkets } from '../constants';
import { marketService } from '../services/marketService';
import { SparklesIcon, CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon } from './common/IconComponents';
import { useLanguage } from '../context/LanguageContext';

interface SellCropModalProps {
    isOpen?: boolean;
    onClose: () => void;
    user: UserProfile;
    texts?: UIStringContent;
    onSuccess?: () => void;
}

const cropData: Record<CropCategory, string[]> = {
    'Yields': [
        'Cotton', 'Rice (Paddy)', 'Wheat', 'Ragi (Finger Millet)', 'Maize',
        'Jowar (Sorghum)', 'Tur Dal (Red Gram)', 'Bengal Gram', 'Groundnut', 
        'Sugarcane', 'Coffee', 'Arecanut', 'Coconut', 'Sunflower', 'Soybean'
    ],
    'Fruits': [
        'Mango', 'Banana', 'Pomegranate', 'Grapes', 'Papaya', 'Guava',
        'Watermelon', 'Jackfruit', 'Orange', 'Lime/Lemon', 'Fig', 'Avocado'
    ],
    'Vegetables': [
        'Tomato', 'Onion', 'Potato', 'Chilli (Green)', 'Chilli (Red)', 
        'Brinjal', 'Okra', 'Cabbage', 'Cauliflower', 'Beans', 'Carrot', 
        'Ginger', 'Garlic', 'Cucumber', 'Capsicum', 'Spinach'
    ]
};

const SellCropModal: React.FC<SellCropModalProps> = ({ 
    isOpen = false, 
    onClose, 
    user, 
    onSuccess 
}) => {
    const { sellModalTexts: t, isKannada } = useLanguage();

    // If modal is not explicitly open, render nothing
    if (!isOpen) return null;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [category, setCategory] = useState<CropCategory>('Yields');
    const [selectedCrop, setSelectedCrop] = useState<string>('Cotton');
    const [quantity, setQuantity] = useState<string>('');
    const [expectedPrice, setExpectedPrice] = useState<string>('');
    const [selectedMarket, setSelectedMarket] = useState<string>(karnatakaMarkets[0] || 'Haveri APMC');
    const [districtLocation, setDistrictLocation] = useState<string>('Haveri, Karnataka');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!quantity || !expectedPrice) {
            setError(t.validationError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await marketService.createRequest({
                cropName: selectedCrop,
                category: category,
                quantity: parseFloat(quantity),
                expectedPrice: parseFloat(expectedPrice),
                market: selectedMarket,
                location: districtLocation,
                farmerId: user.id,
                farmerName: user.fullName || 'Verified Farmer',
                farmerContact: user.details?.phoneNumber || user.email || ''
            });

            setStep(3); // Success step
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error('Error submitting sell request:', err);
            setError(err.message || 'Failed to submit harvest listing.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetAndClose = () => {
        setStep(1);
        setQuantity('');
        setExpectedPrice('');
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans selection:bg-white selection:text-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-950 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <header className="p-5 border-b border-neutral-900 flex justify-between items-center bg-neutral-900/40">
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-0.5">
                            {t.tag}
                        </div>
                        <h2 className="text-base font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                            <span>{t.title}</span>
                        </h2>
                    </div>
                    <button 
                        onClick={handleResetAndClose} 
                        className="text-neutral-500 hover:text-white p-1 transition-colors text-sm font-mono"
                    >
                        ✕
                    </button>
                </header>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: CROP & CATEGORY */}
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
                                        {t.cropCategory}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['Yields', 'Fruits', 'Vegetables'] as CropCategory[]).map((cat) => {
                                            const catLabel = cat === 'Yields' ? t.yields : cat === 'Fruits' ? t.fruits : t.vegetables;
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategory(cat);
                                                        setSelectedCrop(cropData[cat][0]);
                                                    }}
                                                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                                                        category === cat 
                                                            ? 'bg-white text-black border-white shadow-md' 
                                                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                                                    }`}
                                                >
                                                    {catLabel}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                        {t.selectCrop}
                                    </label>
                                    <select
                                        value={selectedCrop}
                                        onChange={(e) => setSelectedCrop(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                                    >
                                        {cropData[category].map((crop) => (
                                            <option key={crop} value={crop} className="bg-neutral-900 text-white">
                                                {crop}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                        {t.batchVolume}
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 50"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all placeholder:text-neutral-600"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs font-mono text-red-300">
                                        {error}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        disabled={!quantity}
                                        onClick={() => {
                                            if (!quantity) {
                                                setError(t.validationError);
                                                return;
                                            }
                                            setError(null);
                                            setStep(2);
                                        }}
                                        className="w-full bg-white text-black hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
                                    >
                                        <span>{t.continuePricing}</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: PRICING & MARKET */}
                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                        {t.expectedPrice}
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 7450"
                                        value={expectedPrice}
                                        onChange={(e) => setExpectedPrice(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all placeholder:text-neutral-600"
                                    />
                                    <p className="text-[10px] text-neutral-500 font-mono mt-1">
                                        {t.totalEstimatedValue}: ₹{quantity && expectedPrice ? (parseFloat(quantity) * parseFloat(expectedPrice)).toLocaleString('en-IN') : '0'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                        {t.marketBenchmark}
                                    </label>
                                    <select
                                        value={selectedMarket}
                                        onChange={(e) => setSelectedMarket(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                                    >
                                        {karnatakaMarkets.map((m) => (
                                            <option key={m} value={m} className="bg-neutral-900 text-white">
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                        {t.location}
                                    </label>
                                    <input
                                        type="text"
                                        value={districtLocation}
                                        onChange={(e) => setDistrictLocation(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs font-mono text-red-300">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-1/3 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-mono font-bold text-xs uppercase py-3.5 rounded-xl transition-all"
                                    >
                                        {t.backBtn}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={loading || !expectedPrice}
                                        onClick={handleSubmit}
                                        className="w-2/3 bg-white text-black hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
                                    >
                                        {loading ? (
                                            <span className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4" />
                                        ) : (
                                            <span>{t.submitBtn}</span>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: SUCCESS */}
                        {step === 3 && (
                            <motion.div
                                key="step-3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6 space-y-4"
                            >
                                <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center mx-auto text-xl font-bold font-mono">
                                    ✓
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold uppercase text-white font-mono">
                                        {t.successTitle}
                                    </h3>
                                    <p className="text-xs text-neutral-400 font-mono mt-1 max-w-xs mx-auto">
                                        {isKannada ? `${quantity} ಕ್ವಿಂಟಾಲ್ ${selectedCrop} ಬೆಳೆ ಪಟ್ಟಿಯು ಈಗ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿದೆ.` : `Your listing for ${quantity} Quintals of ${selectedCrop} is now live on the APMC Marketplace.`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResetAndClose}
                                    className="bg-white text-black font-mono font-bold text-xs uppercase px-6 py-3 rounded-xl hover:bg-neutral-200 transition-all shadow-md"
                                >
                                    {t.returnDashboard}
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Step Indicators */}
                {step < 3 && (
                    <div className="p-3 bg-neutral-900/40 border-t border-neutral-900 flex justify-center gap-1.5">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    i <= step ? 'w-8 bg-white' : 'w-2 bg-neutral-800'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default SellCropModal;
