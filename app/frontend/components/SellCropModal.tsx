
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent, CropCategory, UserProfile, WeatherData } from '../types';
import { karnatakaMarkets } from '../constants';
import { getPriceEstimate } from '../services/geminiService';
import { marketService } from '../services/marketService';
import * as weatherService from '../services/weatherService';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import FileUpload from './common/FileUpload';
import Select from './common/Select';
import { MapPinIcon, CloudIcon, CameraIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, PencilIcon } from './common/IconComponents';

interface SellCropModalProps {
    onClose: () => void;
    user: UserProfile;
    texts: UIStringContent;
}

// Comprehensive list of crops categorized
const cropData: Record<CropCategory, string[]> = {
    'Yields': [
        'Rice (Paddy)', 'Wheat', 'Jowar (Sorghum)', 'Ragi (Finger Millet)', 'Maize',
        'Bajra (Pearl Millet)', 'Tur Dal (Red Gram)', 'Bengal Gram (Chickpea)', 'Urad Dal (Black Gram)', 'Green Gram (Moong)',
        'Groundnut', 'Cotton', 'Sugarcane', 'Tobacco', 'Sunflower', 'Soybean', 'Castor',
        'Coffee', 'Tea', 'Rubber', 'Arecanut (Betel Nut)', 'Coconut'
    ],
    'Fruits': [
        'Mango', 'Banana', 'Pomegranate', 'Grapes', 'Sapota (Chikoo)', 'Guava',
        'Papaya', 'Watermelon', 'Muskmelon', 'Jackfruit', 'Pineapple', 'Orange', 'Sweet Lime (Mosambi)',
        'Lime/Lemon', 'Apple', 'Custard Apple', 'Fig', 'Strawberry', 'Avocado'
    ],
    'Vegetables': [
        'Tomato', 'Onion', 'Potato', 'Brinjal (Eggplant)', 'Chilli (Green)',
        'Chilli (Red)', 'Okra (Ladies Finger)', 'Cabbage', 'Cauliflower', 'Beans',
        'Carrot', 'Beetroot', 'Capsicum', 'Cucumber', 'Drumstick', 'Garlic',
        'Ginger', 'Spinach (Palak)', 'Coriander', 'Pumpkin', 'Bottle Gourd', 'Bitter Gourd',
        'Ridge Gourd', 'Radish', 'Sweet Potato', 'Tapioca'
    ]
};

const SellCropModal: React.FC<SellCropModalProps> = ({ onClose, user, texts }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [category, setCategory] = useState<CropCategory | null>(null);
    const [cropName, setCropName] = useState<{ name: string } | null>(null);
    const [quantity, setQuantity] = useState<string>('');
    const [selectedMarket, setSelectedMarket] = useState<{ name: string } | null>(null);
    const [location, setLocation] = useState<{ lat: number, lon: number, name: string } | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [estimatedPrice, setEstimatedPrice] = useState<{ min: number, max: number } | null>(null);

    // Manual Location State
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [manualLocationQuery, setManualLocationQuery] = useState('');

    // Reset crop selection when category changes
    useEffect(() => {
        setCropName(null);
    }, [category]);

    // Handlers
    const handleManualLocationSearch = async () => {
        if (!manualLocationQuery.trim()) return;
        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationQuery)}&limit=1`, {
                headers: { 'User-Agent': 'AgriVerseAI/1.0' }
            });
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                const name = result.display_name.split(',')[0]; // Take the first part of the name

                // Fetch weather for new location
                const newWeather = await weatherService.getWeatherForDistrict(lat, lon);

                setLocation({ lat, lon, name });
                setWeather(newWeather);
                setIsEditingLocation(false);
            } else {
                alert("Location not found. Please try a different name.");
            }
        } catch (error) {
            console.error("Error searching location:", error);
            alert("Failed to search location.");
        } finally {
            setLoading(false);
        }
    };

    const handleDetectLocation = async () => {
        setLoading(true);

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        const successCallback = async (pos: GeolocationPosition) => {
            const { latitude, longitude } = pos.coords;

            // Default fallback name
            let detectedName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            let fetchedWeather: WeatherData | null = null;

            try {
                // Fetch Weather and Address in parallel, but handle failures independently
                const weatherPromise = weatherService.getWeatherForDistrict(latitude, longitude).catch(e => {
                    console.warn("Weather fetch failed", e);
                    return null;
                });

                const addressPromise = fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                    headers: { 'User-Agent': 'AgriVerseAI/1.0' }
                })
                    .then(async res => {
                        if (!res.ok) throw new Error('Geocoding response not ok');
                        return res.json();
                    })
                    .then(data => {
                        const addr = data.address;
                        // Try to find the most relevant localized name, prioritizing specific locations
                        return addr.village || addr.town || addr.city || addr.suburb || addr.neighbourhood || addr.county || addr.state_district || detectedName;
                    })
                    .catch(e => {
                        console.warn("Reverse geocoding failed", e);
                        return detectedName;
                    });

                // Wait for both
                const [weatherResult, addressResult] = await Promise.all([weatherPromise, addressPromise]);

                fetchedWeather = weatherResult;
                detectedName = addressResult;

                setLocation({ lat: latitude, lon: longitude, name: detectedName });
                setWeather(fetchedWeather);

            } catch (e) {
                console.error("Error in location detection flow:", e);
                // Even if something critical fails, at least set the coordinates if we have them
                setLocation({ lat: latitude, lon: longitude, name: detectedName });
            } finally {
                setLoading(false);
            }
        };

        const errorCallback = (err: GeolocationPositionError) => {
            // Log the actual error object for debugging
            console.error("Geolocation error details:", err);
            setLoading(false);

            let msg = "Could not detect location.";

            // Handle specific error codes explicitly
            switch (err.code) {
                case err.PERMISSION_DENIED: // Code 1
                    msg = "Location access denied. Please enable location permissions in your browser settings.";
                    break;
                case err.POSITION_UNAVAILABLE: // Code 2
                    msg = "Location information is unavailable. Please check your GPS signal.";
                    break;
                case err.TIMEOUT: // Code 3
                    msg = "The request to get user location timed out.";
                    break;
                default:
                    // Fallback for unknown errors
                    msg = err.message ? `Location Error: ${err.message}` : "An unknown error occurred while detecting location.";
                    break;
            }

            alert(msg);
        };

        navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleImageUpload = (files: File[]) => {
        const file = files[0];
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const getEstimate = async () => {
        if (!category || !cropName || !quantity || !location || !selectedMarket) return;
        setLoading(true);
        try {
            const weatherSummary = weather ? `${weather.current.temperature}°C, ${weather.current.humidity}% Humidity` : "Weather data unavailable";
            const estimate = await getPriceEstimate(
                cropName.name,
                category,
                parseFloat(quantity),
                location.name,
                selectedMarket.name,
                weatherSummary
            );
            setEstimatedPrice(estimate);
            setStep(4); // Move to Review/Submit
        } catch (e) {
            console.error(e);
            alert("Failed to generate price estimate. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!estimatedPrice || !location || !category || !selectedMarket || !cropName) return;
        setLoading(true);
        try {
            await marketService.createRequest({
                farmerId: user.id,
                farmerName: user.fullName,
                category: category,
                cropName: cropName.name,
                quantity: parseFloat(quantity),
                marketName: selectedMarket.name,
                location: location,
                weatherSummary: weather ? `${weather.current.temperature}°C, Code ${weather.current.weatherCode}` : "N/A",
                imageUrl: imagePreview || undefined,
                aiEstimatedPrice: estimatedPrice,
            });
            setStep(5); // Success View
        } catch (e) {
            console.error(e);
            alert("Failed to submit request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Crop Details</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Category</label>
                    <div className="flex gap-3">
                        {['Yields', 'Fruits', 'Vegetables'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat as CropCategory)}
                                className={`flex-1 py-2 rounded-lg border transition-all ${category === cat ? 'bg-green-500 border-green-500 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Crop Name</label>
                    <Select
                        items={category ? cropData[category].map(c => ({ name: c })) : []}
                        selectedItem={cropName}
                        onSelectItem={setCropName}
                        getLabel={(item) => item.name}
                        placeholder={category ? "Select Crop" : "Select Category First"}
                        disabled={!category}
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Quantity (Quintals)</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g. 50"
                    />
                </div>
            </div>
            <Button disabled={!category || !cropName || !quantity} onClick={() => setStep(2)} className="w-full !bg-green-600 hover:!bg-green-700">Next</Button>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Location & Weather</h3>

            {!location && !isEditingLocation ? (
                <div className="flex flex-col items-center justify-center py-8 bg-gray-800 rounded-xl border border-dashed border-gray-600">
                    <Button onClick={handleDetectLocation} disabled={loading} leftIcon={loading ? <LoadingSpinner size="sm" /> : <MapPinIcon className="w-5 h-5" />}>
                        {loading ? "Detecting Location & Weather..." : "Auto-detect Live Location"}
                    </Button>
                    <p className="text-xs text-gray-500 mt-3">We use your GPS to fetch local weather and verify origin.</p>
                    <button onClick={() => setIsEditingLocation(true)} className="text-xs text-blue-400 hover:underline mt-2">Or enter location manually</button>
                </div>
            ) : isEditingLocation ? (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
                    <label className="block text-sm text-gray-400">Enter City / Town Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualLocationQuery}
                            onChange={(e) => setManualLocationQuery(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="e.g. Belagavi"
                            onKeyDown={(e) => e.key === 'Enter' && handleManualLocationSearch()}
                        />
                        <Button onClick={handleManualLocationSearch} disabled={loading} isLoading={loading}>Search</Button>
                    </div>
                    <button onClick={() => setIsEditingLocation(false)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-start gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-full text-blue-400"><MapPinIcon className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className="text-sm text-gray-400">Detected Location</p>
                                <div className="flex gap-3">
                                    <button onClick={() => { setIsEditingLocation(true); setManualLocationQuery(location?.name || ''); }} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                        <PencilIcon className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={handleDetectLocation} className="text-xs text-green-400 hover:underline">Refresh</button>
                                </div>
                            </div>
                            <p className="text-lg font-bold text-white">{location!.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{location!.lat.toFixed(4)}, {location!.lon.toFixed(4)}</p>
                        </div>
                    </div>

                    {weather ? (
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2"><CloudIcon className="w-12 h-12 text-gray-600/50" /></div>
                            <div className="relative z-10">
                                <p className="text-sm text-gray-400">Live Weather</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-white">{weather.current.temperature}°C</span>
                                    <span className="text-sm text-gray-300 mb-1">Humidity: {weather.current.humidity}%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Wind: {weather.current.windSpeed} km/h</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-900/20 p-4 rounded-xl border border-yellow-700/50">
                            <p className="text-yellow-200 text-sm">Weather data could not be retrieved. You can still proceed.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="secondary" className="flex-1">Back</Button>
                <Button disabled={!location || isEditingLocation} onClick={() => setStep(3)} className="flex-1 !bg-green-600 hover:!bg-green-700">Next</Button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Market & Media</h3>

            <div>
                <label className="block text-sm text-gray-400 mb-2">Select APMC Market</label>
                <Select
                    items={karnatakaMarkets}
                    selectedItem={selectedMarket}
                    onSelectItem={setSelectedMarket}
                    getLabel={(m) => m.name}
                    placeholder="Choose a market..."
                />
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-2">Upload Crop Photo</label>
                {!imagePreview ? (
                    <div className="bg-gray-800 p-6 rounded-xl border-2 border-dashed border-gray-600 text-center hover:border-gray-500 transition-colors cursor-pointer relative">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleImageUpload([e.target.files[0]])} accept="image/*" />
                        <CameraIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Click to capture or upload</p>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden h-48 bg-black">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                        <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full text-white"><XCircleIcon className="w-5 h-5" /></button>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="secondary" className="flex-1">Back</Button>
                <Button
                    disabled={!selectedMarket || !imageFile || loading}
                    onClick={getEstimate}
                    className="flex-1 !bg-blue-600 hover:!bg-blue-700"
                    leftIcon={loading ? <LoadingSpinner size="sm" color="text-white" /> : <SparklesIcon className="w-4 h-4" />}
                >
                    {loading ? "Analyzing..." : "Get Estimate"}
                </Button>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Confirm Request</h3>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm mb-1">AI Estimated Price Range</p>
                <h2 className="text-3xl font-bold text-green-400">₹{estimatedPrice?.min} - ₹{estimatedPrice?.max}</h2>
                <p className="text-gray-500 text-xs mt-1">Per Quintal</p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Crop:</span> <span className="text-white">{cropName?.name} ({category})</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Quantity:</span> <span className="text-white">{quantity} Qtl</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Market:</span> <span className="text-white">{selectedMarket?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Location:</span> <span className="text-white truncate w-40 text-right">{location?.name}</span></div>
            </div>

            <div className="flex gap-3">
                <Button onClick={() => setStep(3)} variant="secondary" className="flex-1">Back</Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 !bg-green-600 hover:!bg-green-700 shadow-lg shadow-green-900/20"
                >
                    {loading ? "Submitting..." : "Submit Request"}
                </Button>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-10">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
                <CheckCircleIcon className="w-12 h-12 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Request Submitted!</h3>
            <p className="text-gray-400 mb-8">Your crop details have been sent to the marketer. You will be notified once reviewed.</p>
            <Button onClick={onClose} className="!bg-gray-700 hover:!bg-gray-600">Close</Button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]"
            >
                <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-green-500" /> Sell Your Crop
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XCircleIcon className="w-6 h-6" /></button>
                </header>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                            {step === 4 && renderStep4()}
                            {step === 5 && renderSuccess()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {step < 5 && (
                    <div className="p-4 bg-gray-800/30 border-t border-gray-800 flex justify-center gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-green-500' : 'w-2 bg-gray-700'}`} />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default SellCropModal;
