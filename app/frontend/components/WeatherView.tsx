

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { UIStringContent, WeatherData, Language, AirQualityData, AgriWeatherInsight } from '../types';
import { karnatakaDistricts } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import * as weatherService from '../services/weatherService';
import {
    SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, CloudSnowIcon,
    MagnifyingGlassIcon, ThermometerIcon, SunriseIcon, SunsetIcon, WindIcon, HumidityIcon, CompassIcon, LeafIcon, SparklesIcon,
    MapPinIcon, ArrowUpRightIcon, ArrowDownRightIcon, CheckBadgeIcon, BugIcon, DropletIcon
} from './common/IconComponents';

// --- Styled Components & Sub-components ---

const glassClass = "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-3xl";

const WeatherIcon: React.FC<{ code: number | undefined; className?: string; animated?: boolean }> = ({ code, className, animated = false }) => {
    const { icon } = weatherService.getWeatherInfoFromCode(code);
    const baseClass = `${className} drop-shadow-lg`;

    // Google-style animated icons (simplified with Framer Motion)
    const sunVariant: Variants = {
        animate: { rotate: 360, transition: { duration: 12, repeat: Infinity, ease: "linear" as const } }
    };
    const cloudVariant: Variants = {
        animate: { x: [0, 10, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const } }
    };
    const rainVariant: Variants = {
        animate: { y: [0, 5, 0], opacity: [0.5, 1, 0.5], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const } }
    };

    switch (icon) {
        case 'sun': return <motion.div variants={animated ? sunVariant : {}} animate="animate"><SunIcon className={`${baseClass} text-yellow-400`} /></motion.div>;
        case 'cloud': return <motion.div variants={animated ? cloudVariant : {}} animate="animate"><CloudIcon className={`${baseClass} text-gray-200`} /></motion.div>;
        case 'rain': return <motion.div variants={animated ? rainVariant : {}} animate="animate"><CloudRainIcon className={`${baseClass} text-blue-300`} /></motion.div>;
        case 'thunder': return <CloudLightningIcon className={`${baseClass} text-yellow-300`} />;
        case 'snow': return <CloudSnowIcon className={`${baseClass} text-white`} />;
        case 'fog': return <CloudIcon className={`${baseClass} text-gray-300 opacity-70`} />;
        default: return <CloudIcon className={`${baseClass} text-white`} />;
    }
};

const ForecastRow: React.FC<{ day: string; min: number; max: number; code: number; unit: 'C' | 'F' }> = ({ day, min, max, code, unit }) => {
    const range = 15; // Assumed visual range span
    const leftPos = Math.max(0, Math.min(100, ((min - 10) / 30) * 100)); // Normalize min temp (10C to 40C)
    const width = Math.max(10, Math.min(100, ((max - min) / 30) * 100));

    return (
        <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
            <span className="w-16 font-medium text-white">{day}</span>
            <div className="flex-1 flex items-center gap-4 px-4">
                <WeatherIcon code={code} className="w-6 h-6" />
                <div className="flex-1 h-1.5 bg-black/20 rounded-full relative">
                    <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-500 opacity-80"
                        style={{ left: `${leftPos}%`, width: `${width}%` }}
                    />
                </div>
            </div>
            <div className="w-20 text-right text-white tabular-nums text-sm">
                <span className="opacity-70">{min}°</span> <span className="font-bold ml-1">{max}°</span>
            </div>
        </div>
    );
};

const AgriInsightCard: React.FC<{ insight: AgriWeatherInsight }> = ({ insight }) => {
    const colors = {
        low: "border-green-400 bg-green-500/20 text-green-100",
        moderate: "border-yellow-400 bg-yellow-500/20 text-yellow-100",
        high: "border-red-400 bg-red-500/20 text-red-100"
    };

    const icons = {
        water: <DropletIcon className="w-6 h-6" />,
        plant: <LeafIcon className="w-6 h-6" />,
        bug: <BugIcon className="w-6 h-6" />,
        sun: <SunIcon className="w-6 h-6" />,
        warning: <ArrowUpRightIcon className="w-6 h-6" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border-l-4 ${colors[insight.riskLevel]} backdrop-blur-sm mb-3`}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/10">{icons[insight.icon]}</div>
                    <div>
                        <h4 className="font-bold text-lg capitalize">{insight.type} Alert</h4>
                        <p className="text-sm opacity-90 mt-1">{insight.message}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {insight.crops.map(c => (
                                <span key={c} className="text-xs px-2 py-0.5 bg-white/20 rounded-full">{c}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <span className="text-xs font-bold uppercase px-2 py-1 bg-black/20 rounded">{insight.riskLevel}</span>
            </div>
        </motion.div>
    );
};

const DistrictGrid: React.FC<{ onSelect: (d: any) => void }> = ({ onSelect }) => {
    // Simulation of a heatmap. In a real app, this would color code based on live data.
    // Here we map random "heat" to demo the UI visual.
    const getHeatClass = (index: number) => {
        const mod = index % 4;
        if (mod === 0) return "bg-orange-500/30 border-orange-400/50 hover:bg-orange-500/50"; // Hot
        if (mod === 1) return "bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/50"; // Rain/Cool
        if (mod === 2) return "bg-green-500/30 border-green-400/50 hover:bg-green-500/50"; // Normal
        return "bg-yellow-500/30 border-yellow-400/50 hover:bg-yellow-500/50"; // Warm
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {karnatakaDistricts.map((district, idx) => (
                <button
                    key={district.name}
                    onClick={() => onSelect(district)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 backdrop-blur-sm ${getHeatClass(idx)}`}
                >
                    <span className="font-bold text-sm text-white truncate w-full">{district.name}</span>
                    <div className="flex items-end justify-between w-full">
                        <span className="text-2xl font-thin text-white">{Math.floor(22 + Math.random() * 10)}°</span>
                        <WeatherIcon code={idx % 4 === 0 ? 0 : idx % 4 === 1 ? 61 : 2} className="w-6 h-6" />
                    </div>
                </button>
            ))}
        </div>
    );
};

const RadarView: React.FC = () => {
    return (
        <div className="relative w-full h-[500px] rounded-3xl overflow-hidden bg-gray-900 border border-white/20 shadow-2xl">
            {/* Static Map Background */}
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Karnataka_relief_map.svg/1200px-Karnataka_relief_map.svg.png')] bg-cover bg-center opacity-60 grayscale" />

            {/* Radar Overlay Animation */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>

            {/* Moving Clouds / Storm Cells */}
            <motion.div
                className="absolute w-64 h-64 bg-blue-600/40 blur-3xl rounded-full"
                animate={{ x: [0, 200, 400], y: [50, 150, 50], opacity: [0.4, 0.7, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ top: '20%', left: '-20%' }}
            />
            <motion.div
                className="absolute w-48 h-48 bg-indigo-600/30 blur-2xl rounded-full"
                animate={{ x: [0, 300], y: [300, 100], opacity: [0, 0.6, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
                style={{ top: '50%', left: '-10%' }}
            />

            {/* UI Controls */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-2 rounded-lg flex flex-col gap-1 text-xs text-white">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" /> Rain Intensity</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white/50 rounded-full" /> Cloud Cover</div>
            </div>
            <div className="absolute top-4 right-4 bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                LIVE RADAR
            </div>
        </div>
    );
}

const WeatherView: React.FC<{ texts: UIStringContent, currentLanguage: Language }> = ({ texts, currentLanguage }) => {
    const [selectedDistrict, setSelectedDistrict] = useState(karnatakaDistricts[4]); // Default to Bangalore Urban
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [agriInsights, setAgriInsights] = useState<AgriWeatherInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'forecast' | 'insights' | 'map' | 'radar'>('forecast');
    const [unit, setUnit] = useState<'C' | 'F'>('C');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Auto-refresh mechanism
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const weather = await weatherService.getWeatherForDistrict(selectedDistrict.lat, selectedDistrict.lon);
                setWeatherData(weather);
                setAgriInsights(weatherService.generateAgriInsights(weather));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
        const interval = setInterval(fetchAll, 300000); // 5 mins
        return () => clearInterval(interval);
    }, [selectedDistrict]);

    // Dynamic Gradient based on weather
    const bgGradient = useMemo(() => {
        if (!weatherData) return 'from-blue-900 to-slate-900';
        const code = weatherService.getLiveWeatherCode(weatherData.current);
        const isDay = weatherData.current.isDay;

        if (!isDay) return 'from-slate-900 via-indigo-950 to-black'; // Night
        if (code <= 2) return 'from-cyan-400 via-blue-500 to-indigo-600'; // Sunny/Clear
        if (code === 3) return 'from-slate-400 via-slate-500 to-slate-600'; // Cloudy
        if (code >= 51) return 'from-gray-700 via-blue-800 to-slate-800'; // Rain/Storm
        return 'from-blue-500 to-cyan-600'; // Default
    }, [weatherData]);

    const convertTemp = (c: number) => unit === 'C' ? c : Math.round((c * 9 / 5) + 32);

    if (loading && !weatherData) return <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${bgGradient}`}><LoadingSpinner text={texts.loadingWeather} color="text-white" /></div>;
    if (!weatherData) return null;

    const current = weatherData.current;

    return (
        <div className={`w-full h-full bg-gradient-to-br ${bgGradient} text-white transition-all duration-1000 ease-in-out overflow-hidden flex flex-col font-poppins`}>

            {/* Header */}
            <header className="p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 text-xl font-semibold hover:opacity-80 transition-opacity">
                        <MapPinIcon className="w-6 h-6" />
                        {selectedDistrict.name}
                    </button>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setUnit(unit === 'C' ? 'F' : 'C')} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold hover:bg-white/30 transition-colors">
                        °{unit}
                    </button>
                </div>
            </header>

            {/* Search Overlay */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md p-6 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Select Location</h3>
                            <button onClick={() => setIsSearchOpen(false)}><div className="p-2 bg-white/10 rounded-full text-white"><ArrowDownRightIcon className="w-6 h-6 rotate-45" /></div></button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {karnatakaDistricts.map(d => (
                                <button key={d.name} onClick={() => { setSelectedDistrict(d); setIsSearchOpen(false); }} className="p-4 text-left bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                    {d.name}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                {/* Left Panel: Main Weather Display */}
                <div className="lg:w-1/2 p-6 flex flex-col justify-center items-center text-center z-10 relative">
                    {/* Simulated "Sun Glow" effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 blur-[100px] rounded-full pointer-events-none"></div>

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="mb-6"
                    >
                        <WeatherIcon code={current.weatherCode} className="w-48 h-48" animated={true} />
                    </motion.div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <h1 className="text-9xl font-thin tracking-tighter drop-shadow-xl">
                            {convertTemp(current.temperature)}°
                        </h1>
                        <p className="text-2xl font-medium opacity-90 mt-2 flex items-center justify-center gap-2">
                            {texts.weatherCodes[weatherService.getLiveWeatherCode(current)]}
                            <span className="text-sm opacity-70">H:{convertTemp(weatherData.daily[0].temperatureMax)}° L:{convertTemp(weatherData.daily[0].temperatureMin)}°</span>
                        </p>
                    </motion.div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mt-12 w-full max-w-md">
                        <div className="flex flex-col items-center gap-1">
                            <WindIcon className="w-6 h-6 opacity-70" />
                            <span className="font-bold">{current.windSpeed} km/h</span>
                            <span className="text-xs opacity-60">Wind</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <HumidityIcon className="w-6 h-6 opacity-70" />
                            <span className="font-bold">{current.humidity}%</span>
                            <span className="text-xs opacity-60">Humidity</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <CloudRainIcon className="w-6 h-6 opacity-70" />
                            <span className="font-bold">{weatherData.daily[0].rainSum ?? 0} mm</span>
                            <span className="text-xs opacity-60">Rain</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Tabs & Details */}
                <div className="lg:w-1/2 bg-black/20 backdrop-blur-lg lg:rounded-l-3xl border-l border-white/10 flex flex-col overflow-hidden relative z-20">

                    {/* Tab Nav */}
                    <div className="flex p-4 gap-2 overflow-x-auto no-scrollbar border-b border-white/10">
                        {(['forecast', 'insights', 'map', 'radar'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-900 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                {tab === 'map' ? 'Karnataka Map' : tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <AnimatePresence mode="wait">

                            {/* Forecast Tab */}
                            {activeTab === 'forecast' && (
                                <motion.div key="forecast" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    {/* Hourly Horizontal Scroll */}
                                    <div className={glassClass + " p-4"}>
                                        <h3 className="text-sm font-bold uppercase opacity-60 mb-3 ml-1">{texts.hourlyForecast}</h3>
                                        <div className="flex overflow-x-auto gap-6 pb-2 no-scrollbar">
                                            {weatherData.hourly.slice(0, 24).map((h, i) => (
                                                <div key={i} className="flex flex-col items-center gap-2 min-w-[3rem]">
                                                    <span className="text-xs opacity-70">{i === 0 ? 'Now' : new Date(h.time).getHours() + 'h'}</span>
                                                    <WeatherIcon code={h.weatherCode} className="w-8 h-8" />
                                                    <span className="font-bold text-lg">{convertTemp(h.temperature)}°</span>
                                                    {h.precipitationProbability > 20 && <span className="text-[10px] text-blue-300">{h.precipitationProbability}%</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 7-Day List */}
                                    <div className={glassClass + " p-6"}>
                                        <h3 className="text-sm font-bold uppercase opacity-60 mb-4 ml-1">7-Day Forecast</h3>
                                        <div className="space-y-1">
                                            {weatherData.daily.map((d, i) => (
                                                <ForecastRow
                                                    key={i}
                                                    day={i === 0 ? 'Today' : new Date(d.time).toLocaleDateString(currentLanguage === 'kn' ? 'kn-IN' : 'en-US', { weekday: 'long' })}
                                                    min={convertTemp(d.temperatureMin)}
                                                    max={convertTemp(d.temperatureMax)}
                                                    code={d.weatherCode}
                                                    unit={unit}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Agri Insights Tab */}
                            {activeTab === 'insights' && (
                                <motion.div key="insights" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

                                    {/* Farmer's Daily Brief Section */}
                                    <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-500/30 rounded-2xl p-5 mb-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <LeafIcon className="w-5 h-5 text-green-400" />
                                                Farmer's Daily Brief
                                            </h3>
                                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
                                                {selectedDistrict.name}
                                            </span>
                                        </div>

                                        <p className="text-sm opacity-80 mb-4">
                                            Get a personalized daily summary, actionable suggestions, and critical alerts for your district.
                                        </p>

                                        <button
                                            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-green-500/20 flex items-center justify-center gap-2 group"
                                            onClick={() => {
                                                // Trigger a "check" animation or logic
                                                const btn = document.getElementById('check-weather-btn');
                                                if (btn) {
                                                    btn.innerText = "Analyzing...";
                                                    setTimeout(() => {
                                                        btn.innerText = "Check Today's Weather";
                                                        // Scroll to alerts or show a toast could go here
                                                    }, 1500);
                                                }
                                            }}
                                            id="check-weather-btn"
                                        >
                                            <MagnifyingGlassIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            Check Today's Weather
                                        </button>

                                        {/* Generated Brief Content */}
                                        <div className="mt-4 space-y-3 bg-black/20 rounded-xl p-4 border border-white/5">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300 mt-1">
                                                    <CloudIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-blue-200">Weather Summary</h4>
                                                    <p className="text-sm opacity-90">
                                                        Today in <span className="font-semibold text-white">{selectedDistrict.name}</span>, expect
                                                        <span className="font-semibold text-white"> {texts.weatherCodes[weatherService.getLiveWeatherCode(weatherData.current)]} </span>
                                                        conditions with a high of {convertTemp(weatherData.daily[0].temperatureMax)}°.
                                                        {weatherData.daily[0].rainSum && weatherData.daily[0].rainSum > 0 ? ` Rainfall of ${weatherData.daily[0].rainSum}mm is expected.` : ' No significant rainfall expected.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-300 mt-1">
                                                    <SparklesIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-yellow-200">Farmer's Suggestion</h4>
                                                    <p className="text-sm opacity-90">
                                                        {(weatherData.daily[0].rainSum || 0) > 5
                                                            ? "Heavy rain expected. Ensure drainage channels are clear. Delay fertilizer application."
                                                            : weatherData.current.windSpeed > 20
                                                                ? "Strong winds detected. Avoid spraying pesticides today to prevent drift."
                                                                : "Conditions are favorable for field operations. Good day for irrigation and monitoring crop health."}
                                                    </p>
                                                </div>
                                            </div>

                                            {(weatherData.current.temperature > 35 || (weatherData.daily[0].rainSum || 0) > 10 || weatherData.current.windSpeed > 25) && (
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-red-500/20 rounded-lg text-red-300 mt-1">
                                                        <ArrowUpRightIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-red-200">Critical Alert</h4>
                                                        <p className="text-sm opacity-90 text-red-100">
                                                            {weatherData.current.temperature > 35 ? "Heatwave warning! Protect young saplings and ensure hydration." : ""}
                                                            {(weatherData.daily[0].rainSum || 0) > 10 ? "Heavy rainfall alert! Risk of waterlogging in low-lying areas." : ""}
                                                            {weatherData.current.windSpeed > 25 ? "High wind alert! Secure loose structures and banana plantations." : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">Farming Advisory</h3>
                                    {agriInsights.length > 0 ? (
                                        agriInsights.map((insight, i) => (
                                            <AgriInsightCard key={i} insight={insight} />
                                        ))
                                    ) : (
                                        <div className="p-8 text-center bg-white/10 rounded-2xl">
                                            <CheckBadgeIcon className="w-12 h-12 text-green-400 mx-auto mb-2" />
                                            <p>Conditions are optimal. No specific alerts at this time.</p>
                                        </div>
                                    )}

                                    {/* Static General Advice */}
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className={glassClass + " p-4 flex flex-col items-center text-center"}>
                                            <SparklesIcon className="w-8 h-8 text-yellow-300 mb-2" />
                                            <h4 className="font-bold text-sm">Best Sowing Time</h4>
                                            <p className="text-xs mt-1 opacity-80">June - July (Kharif)</p>
                                        </div>
                                        <div className={glassClass + " p-4 flex flex-col items-center text-center"}>
                                            <LeafIcon className="w-8 h-8 text-green-400 mb-2" />
                                            <h4 className="font-bold text-sm">Fertilizer Window</h4>
                                            <p className="text-xs mt-1 opacity-80">Avoid if rain {">"} 50%</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Map Heatmap Tab */}
                            {activeTab === 'map' && (
                                <motion.div key="map" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                    <h3 className="text-xl font-bold mb-4">Karnataka District Heatmap</h3>
                                    <p className="text-sm opacity-70 mb-4">Real-time temperature monitoring. Click to view district details.</p>
                                    <DistrictGrid onSelect={(d) => { setSelectedDistrict(d); setActiveTab('forecast'); }} />
                                </motion.div>
                            )}

                            {/* Radar Tab */}
                            {activeTab === 'radar' && (
                                <motion.div key="radar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <h3 className="text-xl font-bold mb-4">Live Cloud & Rain Radar</h3>
                                    <RadarView />
                                    <p className="text-xs opacity-60 mt-2 text-center">*Simulation based on forecast models.</p>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WeatherView;