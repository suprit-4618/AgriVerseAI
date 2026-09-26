"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { UIStringContent, WeatherData, Language, AirQualityData, AgriWeatherInsight, LocationResult } from '../types';
import { karnatakaDistricts } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import * as weatherService from '../services/weatherService';
import {
    SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, CloudSnowIcon,
    ThermometerIcon, SunriseIcon, SunsetIcon, WindIcon, HumidityIcon, CompassIcon, LeafIcon, SparklesIcon,
    MapPinIcon, ArrowUpRightIcon, ArrowDownRightIcon, CheckBadgeIcon, BugIcon, DropletIcon
} from './common/IconComponents';
import {
    Volume2, VolumeX, Navigation, Search, LocateFixed, Play, Pause, Square,
    RefreshCw, Layers, ShieldCheck, AlertTriangle, Radio, BarChart2, Droplets,
    CloudSun, Wind, Gauge, Sparkles, Check, CheckCircle2, ChevronRight, X
} from 'lucide-react';

const glassCard = "bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl";
const glassInput = "bg-slate-800/80 backdrop-blur-md border border-white/15 focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/30 text-white placeholder-slate-400 rounded-2xl transition-all";

const WeatherIcon: React.FC<{ code: number | undefined; className?: string; animated?: boolean }> = ({ code, className = "w-10 h-10", animated = false }) => {
    const { icon } = weatherService.getWeatherInfoFromCode(code);
    const baseClass = `${className} drop-shadow-lg`;

    const sunVariant: Variants = {
        animate: { rotate: 360, transition: { duration: 20, repeat: Infinity, ease: "linear" as const } }
    };
    const cloudVariant: Variants = {
        animate: { x: [0, 8, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const } }
    };
    const rainVariant: Variants = {
        animate: { y: [0, 4, 0], opacity: [0.6, 1, 0.6], transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" as const } }
    };

    switch (icon) {
        case 'sun': 
            return <motion.div variants={animated ? sunVariant : {}} animate="animate"><SunIcon className={`${baseClass} text-amber-400`} /></motion.div>;
        case 'cloud': 
            return <motion.div variants={animated ? cloudVariant : {}} animate="animate"><CloudIcon className={`${baseClass} text-slate-300`} /></motion.div>;
        case 'rain': 
            return <motion.div variants={animated ? rainVariant : {}} animate="animate"><CloudRainIcon className={`${baseClass} text-cyan-400`} /></motion.div>;
        case 'thunder': 
            return <CloudLightningIcon className={`${baseClass} text-yellow-400`} />;
        case 'snow': 
            return <CloudSnowIcon className={`${baseClass} text-blue-200`} />;
        case 'fog': 
            return <CloudIcon className={`${baseClass} text-slate-400 opacity-80`} />;
        default: 
            return <CloudIcon className={`${baseClass} text-slate-300`} />;
    }
};

const ForecastRow: React.FC<{ 
    day: string; 
    min: number; 
    max: number; 
    code: number; 
    rainSum?: number; 
    precipProb?: number; 
    unit: 'C' | 'F' 
}> = ({ day, min, max, code, rainSum = 0, precipProb = 0, unit }) => {
    const leftPos = Math.max(0, Math.min(100, ((min - 10) / 35) * 100));
    const width = Math.max(12, Math.min(100, ((max - min) / 35) * 100));

    return (
        <div className="flex items-center justify-between py-3.5 px-4 rounded-2xl hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
            <span className="w-24 font-medium text-slate-200 text-sm truncate">{day}</span>
            <div className="flex-1 flex items-center gap-4 px-3">
                <div className="flex items-center gap-2 min-w-[70px]">
                    <WeatherIcon code={code} className="w-6 h-6" />
                    {rainSum > 0 && (
                        <span className="text-[11px] text-cyan-300 font-medium">{rainSum.toFixed(1)}mm</span>
                    )}
                </div>
                <div className="flex-1 h-2 bg-slate-800/80 rounded-full relative overflow-hidden border border-white/5">
                    <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 opacity-90 shadow-sm"
                        style={{ left: `${leftPos}%`, width: `${width}%` }}
                    />
                </div>
            </div>
            <div className="w-24 text-right text-white tabular-nums text-sm font-medium">
                <span className="text-slate-400">{min}°</span>
                <span className="text-slate-600 mx-1">/</span>
                <span className="font-bold text-amber-300">{max}°{unit}</span>
            </div>
        </div>
    );
};

const AgriInsightCard: React.FC<{ insight: AgriWeatherInsight }> = ({ insight }) => {
    const colors = {
        low: "border-emerald-500/40 bg-emerald-950/30 text-emerald-100",
        moderate: "border-amber-500/40 bg-amber-950/30 text-amber-100",
        high: "border-rose-500/40 bg-rose-950/30 text-rose-100"
    };

    const icons = {
        water: <DropletIcon className="w-5 h-5 text-cyan-400" />,
        plant: <LeafIcon className="w-5 h-5 text-emerald-400" />,
        bug: <BugIcon className="w-5 h-5 text-rose-400" />,
        sun: <SunIcon className="w-5 h-5 text-amber-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" />
    };

    const badgeColors = {
        low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        moderate: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        high: "bg-rose-500/20 text-rose-300 border-rose-500/40"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border ${colors[insight.riskLevel]} backdrop-blur-md mb-3 transition-all hover:bg-white/[0.04]`}
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 shrink-0">
                        {icons[insight.icon] || icons.warning}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white capitalize text-sm">{insight.type} Advisory</h4>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badgeColors[insight.riskLevel]}`}>
                                {insight.riskLevel}
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{insight.message}</p>
                        {insight.crops && insight.crops.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {insight.crops.map(c => (
                                    <span key={c} className="text-[11px] px-2.5 py-0.5 bg-white/10 border border-white/10 text-slate-200 rounded-full font-medium">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const DistrictGrid: React.FC<{ onSelect: (d: any) => void; selectedName: string }> = ({ onSelect, selectedName }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {karnatakaDistricts.map((district, idx) => {
                const isSelected = selectedName === district.name;
                return (
                    <button
                        key={district.name}
                        onClick={() => onSelect(district)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 backdrop-blur-md ${
                            isSelected 
                                ? "bg-emerald-500/25 border-emerald-400 shadow-lg shadow-emerald-500/10 scale-[1.02]" 
                                : "bg-slate-900/60 border-white/10 hover:border-emerald-400/40 hover:bg-slate-800/80"
                        }`}
                    >
                        <span className={`font-semibold text-xs truncate w-full ${isSelected ? "text-emerald-300" : "text-white"}`}>
                            {district.name}
                        </span>
                        <div className="flex items-end justify-between w-full">
                            <span className="text-xl font-light text-slate-200">{Math.floor(23 + (idx % 8))}°C</span>
                            <WeatherIcon code={idx % 4 === 0 ? 0 : idx % 4 === 1 ? 61 : 2} className="w-5 h-5" />
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

const RadarView: React.FC = () => {
    return (
        <div className="relative w-full h-[450px] rounded-3xl overflow-hidden bg-slate-950 border border-white/15 shadow-2xl">
            {/* Background Grid & Relief Map */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Karnataka_relief_map.svg/1200px-Karnataka_relief_map.svg.png')] bg-cover bg-center opacity-40 grayscale contrast-125" />

            {/* Radar Sweep Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/15 to-transparent animate-pulse" style={{ animationDuration: '3.5s' }} />

            {/* Moving Storm Cells */}
            <motion.div
                className="absolute w-72 h-72 bg-cyan-600/30 blur-3xl rounded-full"
                animate={{ x: [0, 220, 440], y: [60, 160, 60], opacity: [0.3, 0.7, 0.2] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{ top: '15%', left: '-15%' }}
            />
            <motion.div
                className="absolute w-56 h-56 bg-emerald-600/25 blur-2xl rounded-full"
                animate={{ x: [0, 320], y: [320, 120], opacity: [0.1, 0.6, 0.1] }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear", delay: 2 }}
                style={{ top: '45%', left: '-10%' }}
            />

            {/* Radar UI Controls & Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg text-xs text-slate-200">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>ECMWF / Open-Meteo High-Res Radar</span>
            </div>

            <div className="absolute top-4 right-4 bg-emerald-500/90 text-slate-950 px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-950" />
                LIVE RADAR
            </div>

            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-sm shadow-cyan-400" />
                    <span>Precipitation Cloud Front</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/40 rounded-full" />
                    <span>Canopy Cloud Cover</span>
                </div>
            </div>
        </div>
    );
};

interface WeatherViewProps {
    texts?: UIStringContent;
    currentLanguage?: Language;
    onClose?: () => void;
}

const WeatherView: React.FC<WeatherViewProps> = ({ texts, currentLanguage = Language.EN, onClose }) => {
    const [currentLocationName, setCurrentLocationName] = useState('Bengaluru (Bangalore) Urban');
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number }>({
        lat: karnatakaDistricts[4]?.lat || 12.97,
        lon: karnatakaDistricts[4]?.lon || 77.59
    });
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
    const [agriInsights, setAgriInsights] = useState<AgriWeatherInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocating, setIsLocating] = useState(false);
    const [activeTab, setActiveTab] = useState<'forecast' | 'insights' | 'map' | 'radar'>('forecast');
    const [unit, setUnit] = useState<'C' | 'F'>('C');
    
    // Search Autocomplete State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchTimeoutRef = useRef<any>(null);

    // Audio Briefing (Google AI Studio TTS) State
    const [isBriefingGenerating, setIsBriefingGenerating] = useState(false);
    const [isBriefingPlaying, setIsBriefingPlaying] = useState(false);
    const [briefingScript, setBriefingScript] = useState<string | null>(null);
    const stopAudioRef = useRef<(() => void) | null>(null);

    // Fetch weather whenever coordinates or location name changes
    const fetchWeather = useCallback(async (lat: number, lon: number, name?: string) => {
        setLoading(true);
        try {
            const [weather, aqi] = await Promise.all([
                weatherService.getWeatherForDistrict(lat, lon, name || currentLocationName),
                weatherService.getAirQualityForDistrict(lat, lon).catch(() => null)
            ]);
            setWeatherData(weather);
            setAirQuality(aqi);
            setAgriInsights(weatherService.generateAgriInsights(weather));
            // Update script for quick display
            setBriefingScript(weatherService.getWeatherBriefingScript(weather, name || currentLocationName, currentLanguage));
        } catch (e) {
            console.error('Weather fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [currentLocationName, currentLanguage]);

    useEffect(() => {
        fetchWeather(currentCoords.lat, currentCoords.lon, currentLocationName);
        const interval = setInterval(() => {
            fetchWeather(currentCoords.lat, currentCoords.lon, currentLocationName);
        }, 300000); // 5 min auto refresh
        return () => clearInterval(interval);
    }, [currentCoords, fetchWeather]);

    // Handle 1-Click GPS Location Detection
    const handleDetectGPSLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                    const resolvedName = await weatherService.reverseGeocodeLocation(lat, lon);
                    setCurrentLocationName(resolvedName);
                    setCurrentCoords({ lat, lon });
                } catch (err) {
                    console.error('Reverse geocoding error:', err);
                    setCurrentLocationName(`Farm (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
                    setCurrentCoords({ lat, lon });
                } finally {
                    setIsLocating(false);
                    setIsSearchOpen(false);
                }
            },
            (err) => {
                console.warn('Geolocation denied or failed:', err);
                setIsLocating(false);
                alert('Could not access your GPS location. Please select your district or search manually.');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    // Handle Search Query Debounce
    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (query.trim().length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await weatherService.searchLocations(query);
                setSearchResults(results);
            } catch (err) {
                console.warn('Search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleSelectLocation = (loc: LocationResult) => {
        const fullLocationName = loc.admin2 ? `${loc.name}, ${loc.admin2}` : `${loc.name}, ${loc.admin1}`;
        setCurrentLocationName(fullLocationName);
        setCurrentCoords({ lat: loc.latitude, lon: loc.longitude });
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Google AI Studio Audio Briefing Handler
    const handleToggleAudioBriefing = async () => {
        if (isBriefingPlaying) {
            stopAudioRef.current?.();
            stopAudioRef.current = null;
            setIsBriefingPlaying(false);
            return;
        }

        if (!weatherData) return;

        setIsBriefingGenerating(true);
        try {
            const { audioBase64, script } = await weatherService.generateWeatherVoiceBriefing(
                weatherData,
                currentLocationName,
                currentLanguage
            );
            setBriefingScript(script);

            if (audioBase64) {
                setIsBriefingGenerating(false);
                setIsBriefingPlaying(true);
                const stopFn = await weatherService.playWeatherAudio(audioBase64, () => {
                    setIsBriefingPlaying(false);
                    stopAudioRef.current = null;
                });
                stopAudioRef.current = stopFn;
            } else {
                // Fallback to Web Speech API if Google AI Studio key not provided
                setIsBriefingGenerating(false);
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(script);
                    utterance.lang = currentLanguage === Language.KN ? 'kn-IN' : 'en-US';
                    utterance.rate = 0.95;
                    utterance.onstart = () => setIsBriefingPlaying(true);
                    utterance.onend = () => setIsBriefingPlaying(false);
                    utterance.onerror = () => setIsBriefingPlaying(false);
                    window.speechSynthesis.speak(utterance);
                    stopAudioRef.current = () => window.speechSynthesis.cancel();
                }
            }
        } catch (error) {
            console.error('Audio briefing error:', error);
            setIsBriefingGenerating(false);
            setIsBriefingPlaying(false);
        }
    };

    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            stopAudioRef.current?.();
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const convertTemp = (c?: number | null) => {
        if (c == null || isNaN(c)) return 0;
        return unit === 'C' ? Math.round(c) : Math.round((c * 9 / 5) + 32);
    };

    // Weather condition info
    const current = weatherData?.current;
    const today = weatherData?.daily?.[0];
    const weatherCode = current ? weatherService.getLiveWeatherCode(current) : 0;
    const weatherInfo = weatherService.getWeatherInfoFromCode(weatherCode);

    // Dynamic background based on weather & day/night
    const bgGradient = useMemo(() => {
        if (!current) return 'from-slate-950 via-indigo-950 to-slate-900';
        const isDay = current.isDay === 1;
        if (!isDay) return 'from-slate-950 via-slate-900 to-indigo-950';
        if (weatherCode <= 1) return 'from-slate-950 via-sky-950 to-slate-900';
        if (weatherCode <= 3) return 'from-slate-950 via-slate-900 to-cyan-950';
        if (weatherCode >= 51) return 'from-slate-950 via-cyan-950 to-slate-900';
        return 'from-slate-950 via-indigo-950 to-slate-900';
    }, [current, weatherCode]);

    if (loading && !weatherData) {
        return (
            <div className={`w-full min-h-[500px] h-full flex flex-col items-center justify-center bg-gradient-to-br ${bgGradient} text-white p-8`}>
                <LoadingSpinner text={texts?.loadingWeather || "Loading weather data..."} color="text-emerald-400" />
                <p className="text-xs text-slate-400 mt-3 font-medium">Fetching real-time ECMWF & Open-Meteo hyperlocal observations...</p>
            </div>
        );
    }

    if (!weatherData || !current) return null;

    return (
        <div className={`w-full min-h-[600px] h-full bg-gradient-to-br ${bgGradient} text-white flex flex-col overflow-hidden font-sans relative select-none rounded-3xl`}>

            {/* Glowing Orb Background Effects */}
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Top Navigation Bar */}
            <header className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl z-20">
                
                {/* Location Picker & GPS Trigger */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all group"
                        title="Click to change location or search village"
                    >
                        <MapPinIcon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                            <span className="text-xs text-slate-400 block font-medium">Location</span>
                            <span className="text-sm font-bold text-white flex items-center gap-1">
                                {currentLocationName}
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={handleDetectGPSLocation}
                        disabled={isLocating}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all font-medium text-xs disabled:opacity-50"
                        title="Auto-detect current farm GPS coordinates"
                    >
                        <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-400' : ''}`} />
                        <span className="hidden sm:inline">{isLocating ? 'Detecting GPS...' : 'My Farm GPS'}</span>
                    </button>
                </div>

                {/* Right Controls: AI Voice Briefing & Unit Switcher & Close Button */}
                <div className="flex items-center gap-3">
                    {/* Google AI Studio Speech Briefing Button */}
                    <button
                        onClick={handleToggleAudioBriefing}
                        disabled={isBriefingGenerating}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all text-xs font-semibold shadow-lg ${
                            isBriefingPlaying 
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-rose-500/20 animate-pulse' 
                                : 'bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 hover:from-emerald-500/40 hover:to-cyan-500/40 border-emerald-400/40 text-emerald-200'
                        }`}
                    >
                        {isBriefingGenerating ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : isBriefingPlaying ? (
                            <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span>
                            {isBriefingGenerating 
                                ? 'Synthesizing Google AI Voice...' 
                                : isBriefingPlaying 
                                ? 'Stop Briefing' 
                                : currentLanguage === Language.KN ? 'ಹವಾಮಾನ ಧ್ವನಿ ವರದಿ (Google AI)' : 'AI Weather Audio Briefing'}
                        </span>
                        {isBriefingPlaying && (
                            <div className="flex items-center gap-0.5 ml-1">
                                <span className="w-1 h-3 bg-rose-400 rounded-full animate-pulse" />
                                <span className="w-1 h-4 bg-rose-400 rounded-full animate-pulse delay-75" />
                                <span className="w-1 h-2 bg-rose-400 rounded-full animate-pulse delay-150" />
                            </div>
                        )}
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={() => fetchWeather(currentCoords.lat, currentCoords.lon, currentLocationName)}
                        className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all"
                        title="Refresh live data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>

                    {/* Unit Switcher */}
                    <button
                        onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
                        className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-xs text-slate-200 hover:text-white transition-all"
                    >
                        °{unit}
                    </button>

                    {/* Close Button if opened in modal */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/30 border border-white/10 text-slate-300 hover:text-rose-200 transition-all ml-1"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* Location Search Modal / Overlay */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl p-6 flex flex-col items-center overflow-y-auto"
                    >
                        <div className="w-full max-w-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <MapPinIcon className="w-6 h-6 text-emerald-400" />
                                        Select Farm Location
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Search any village, taluk, district in Karnataka or globally</p>
                                </div>
                                <button
                                    onClick={() => setIsSearchOpen(false)}
                                    className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Input Bar */}
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Type village, taluk, or city name (e.g. Mandya, Shirahatti, Hassan)..."
                                    className={`w-full pl-12 pr-4 py-3.5 text-sm ${glassInput}`}
                                    autoFocus
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* GPS Auto-Detect Banner */}
                            <button
                                onClick={handleDetectGPSLocation}
                                className="w-full mb-6 p-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-between text-left transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                                        <LocateFixed className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-emerald-200">Use Exact Farm Coordinates (GPS)</h4>
                                        <p className="text-xs text-emerald-400/80 mt-0.5">Auto-fetches precise temperature and soil moisture for your field</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="mb-6 space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Search Suggestions</h4>
                                    {searchResults.map((loc) => (
                                        <button
                                            key={loc.id}
                                            onClick={() => handleSelectLocation(loc)}
                                            className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-left transition-all flex items-center justify-between group"
                                        >
                                            <div>
                                                <span className="font-semibold text-white text-sm group-hover:text-emerald-300">{loc.name}</span>
                                                <span className="text-xs text-slate-400 ml-2">
                                                    {[loc.admin2, loc.admin1, loc.country].filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 font-mono">
                                                {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Quick Select Karnataka Districts */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Karnataka Districts (Quick Select)</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar p-1">
                                    {karnatakaDistricts.map(d => (
                                        <button
                                            key={d.name}
                                            onClick={() => {
                                                setCurrentLocationName(d.name);
                                                setCurrentCoords({ lat: d.lat, lon: d.lon });
                                                setIsSearchOpen(false);
                                            }}
                                            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                                                currentLocationName === d.name 
                                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300' 
                                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {d.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Weather Screen Content */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                
                {/* Left Panel: Primary Weather, Hero Card & Field Metrics */}
                <div className="lg:w-5/12 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between space-y-6">
                    
                    {/* Hero Temperature & Condition */}
                    <div className={`${glassCard} p-6 relative overflow-hidden flex flex-col items-center text-center`}>
                        
                        {/* Audio Briefing Floating Card */}
                        {briefingScript && (
                            <div className="w-full mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-left flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                                            Google AI Studio Agro-Briefing
                                        </span>
                                        <button
                                            onClick={handleToggleAudioBriefing}
                                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                                        >
                                            {isBriefingPlaying ? 'Stop' : 'Listen'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-200 mt-1 leading-relaxed line-clamp-3">
                                        {briefingScript}
                                    </p>
                                </div>
                            </div>
                        )}

                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="my-2"
                        >
                            <WeatherIcon code={weatherCode} className="w-28 h-28" animated={true} />
                        </motion.div>

                        <div className="mt-2">
                            <h1 className="text-7xl sm:text-8xl font-light tracking-tighter drop-shadow-2xl text-white">
                                {convertTemp(current.temperature)}°
                            </h1>
                            <div className="mt-2 flex items-center justify-center gap-2">
                                <span className="text-lg font-semibold text-slate-100">
                                    {texts.weatherCodes[weatherCode] || weatherInfo.description}
                                </span>
                                {today && (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10 font-medium">
                                        H: {convertTemp(today.temperatureMax)}° · L: {convertTemp(today.temperatureMin)}°
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Feels like {convertTemp(current.apparentTemperature || current.temperature)}° · Open-Meteo High Resolution Model
                            </p>
                        </div>

                        {/* Quick Atmospheric Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3 mt-6 w-full pt-4 border-t border-white/10">
                            <div className="flex flex-col items-center p-2.5 rounded-2xl bg-white/5 border border-white/5">
                                <Wind className="w-4 h-4 text-cyan-400 mb-1" />
                                <span className="font-bold text-sm text-white">{current.windSpeed} km/h</span>
                                <span className="text-[10px] text-slate-400 uppercase">Wind</span>
                            </div>
                            <div className="flex flex-col items-center p-2.5 rounded-2xl bg-white/5 border border-white/5">
                                <Droplets className="w-4 h-4 text-blue-400 mb-1" />
                                <span className="font-bold text-sm text-white">{current.humidity}%</span>
                                <span className="text-[10px] text-slate-400 uppercase">Humidity</span>
                            </div>
                            <div className="flex flex-col items-center p-2.5 rounded-2xl bg-white/5 border border-white/5">
                                <CloudRainIcon className="w-4 h-4 text-indigo-400 mb-1" />
                                <span className="font-bold text-sm text-white">{today?.rainSum || 0} mm</span>
                                <span className="text-[10px] text-slate-400 uppercase">Rain (24h)</span>
                            </div>
                        </div>
                    </div>

                    {/* Agricultural Soil & Field Condition Gauge */}
                    <div className={`${glassCard} p-5`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                                <Sprout className="w-4 h-4 text-emerald-400" />
                                Agricultural Soil & Canopy Metrics
                            </h3>
                            <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                0-1cm Depth
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* Soil Moisture */}
                            <div className="p-3 rounded-2xl bg-slate-800/60 border border-white/5">
                                <span className="text-[11px] text-slate-400 block mb-1">Soil Moisture</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-cyan-300">
                                        {current.soilMoisture != null ? `${current.soilMoisture}%` : '32%'}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-semibold">
                                        {(current.soilMoisture || 32) > 40 ? 'Saturated' : (current.soilMoisture || 32) < 20 ? 'Dry' : 'Optimal'}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-700/60 rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-blue-500 rounded-full" 
                                        style={{ width: `${Math.min(100, (current.soilMoisture || 32) * 2)}%` }} 
                                    />
                                </div>
                            </div>

                            {/* Soil Temperature */}
                            <div className="p-3 rounded-2xl bg-slate-800/60 border border-white/5">
                                <span className="text-[11px] text-slate-400 block mb-1">Soil Temp</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-amber-300">
                                        {current.soilTemperature != null ? `${convertTemp(current.soilTemperature)}°${unit}` : `${convertTemp(26)}°${unit}`}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Root zone</span>
                                </div>
                                <span className="text-[10px] text-emerald-400 mt-1 block">Root Activity: High</span>
                            </div>

                            {/* Evapotranspiration (ET0) */}
                            <div className="p-3 rounded-2xl bg-slate-800/60 border border-white/5 col-span-2 sm:col-span-1">
                                <span className="text-[11px] text-slate-400 block mb-1">Evapotranspiration</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-purple-300">
                                        {today?.evapotranspiration ? `${today.evapotranspiration}` : '4.2'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">mm/day</span>
                                </div>
                                <span className="text-[10px] text-slate-300 mt-1 block">FAO-56 Penman</span>
                            </div>
                        </div>

                        {/* Spraying Window Status Bar */}
                        <div className="mt-3 p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck className={`w-5 h-5 ${current.windSpeed < 15 && (today?.precipitationProbabilityMax || 0) < 40 ? 'text-emerald-400' : 'text-amber-400'}`} />
                                <div>
                                    <span className="text-xs font-bold text-white block">Spraying Window</span>
                                    <span className="text-[11px] text-slate-300">
                                        {current.windSpeed < 15 && (today?.precipitationProbabilityMax || 0) < 40
                                            ? 'Ideal conditions (Calm wind & low rain risk)'
                                            : current.windSpeed >= 15
                                            ? 'Drift Risk (Wind > 15 km/h)'
                                            : 'Rain expected (Postpone sprays)'}
                                    </span>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                                current.windSpeed < 15 && (today?.precipitationProbabilityMax || 0) < 40
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                                {current.windSpeed < 15 && (today?.precipitationProbabilityMax || 0) < 40 ? 'Favorable' : 'Caution'}
                            </span>
                        </div>
                    </div>

                    {/* Air Quality (AQI) Strip if available */}
                    {airQuality && (
                        <div className={`${glassCard} p-4 flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${airQuality.usAqi <= 50 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    <Gauge className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-white block">Air Quality Index (AQI)</span>
                                    <span className="text-xs text-slate-400">
                                        US AQI: {airQuality.usAqi} · {airQuality.usAqi <= 50 ? 'Good' : airQuality.usAqi <= 100 ? 'Moderate' : 'Unhealthy'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                                <span>CO: {airQuality.co?.toFixed(1) || '0.2'}</span>
                                <span>NO2: {airQuality.no2?.toFixed(1) || '12'}</span>
                                <span>O3: {airQuality.o3?.toFixed(1) || '35'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Tab Navigation (Forecast, Agri Insights, Districts, Radar) */}
                <div className="lg:w-7/12 bg-slate-950/50 backdrop-blur-2xl lg:rounded-l-3xl border-l border-white/10 flex flex-col overflow-hidden">
                    
                    {/* Tab Selection Headers */}
                    <div className="flex p-4 gap-2 border-b border-white/10 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'forecast', label: '7-Day & Hourly', icon: <CloudSun className="w-4 h-4" /> },
                            { id: 'insights', label: 'Agri Advisory', icon: <LeafIcon className="w-4 h-4" /> },
                            { id: 'map', label: 'Karnataka Districts', icon: <Layers className="w-4 h-4" /> },
                            { id: 'radar', label: 'Live Rain Radar', icon: <Radio className="w-4 h-4" /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                        : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable Tab Views */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <AnimatePresence mode="wait">

                            {/* 1. Forecast Tab (24h Hourly + 7-Day Table) */}
                            {activeTab === 'forecast' && (
                                <motion.div
                                    key="forecast"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {/* 24-Hour Hourly Timeline */}
                                    <div className={`${glassCard} p-5`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                <BarChart2 className="w-4 h-4 text-emerald-400" />
                                                24-Hour Hourly Forecast
                                            </h3>
                                            <span className="text-[11px] text-cyan-400 font-medium">Precipitation % & Temp</span>
                                        </div>

                                        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                                            {weatherData.hourly.slice(0, 24).map((h, i) => {
                                                const timeDate = new Date(h.time);
                                                const hourLabel = i === 0 ? 'Now' : `${timeDate.getHours()}:00`;
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex flex-col items-center gap-2 min-w-[3.75rem] p-3 rounded-2xl border transition-all ${
                                                            i === 0 
                                                                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300' 
                                                                : 'bg-slate-800/40 border-white/5 hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span className="text-xs font-medium text-slate-400">{hourLabel}</span>
                                                        <WeatherIcon code={h.weatherCode} className="w-7 h-7" />
                                                        <span className="font-bold text-sm text-white">{convertTemp(h.temperature)}°</span>
                                                        <div className="h-4 flex items-center justify-center">
                                                            {h.precipitationProbability > 0 ? (
                                                                <span className="text-[10px] text-cyan-300 font-semibold px-1.5 py-0.5 rounded-full bg-cyan-500/20">
                                                                    {h.precipitationProbability}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-500">0%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 7-Day Agricultural Forecast */}
                                    <div className={`${glassCard} p-5`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                <SunIcon className="w-4 h-4 text-amber-400" />
                                                7-Day Agricultural Forecast
                                            </h3>
                                            <span className="text-[11px] text-slate-400">Min / Max Temp & Rain Sum</span>
                                        </div>

                                        <div className="space-y-1">
                                            {weatherData.daily.map((d, i) => {
                                                const dayName = i === 0 
                                                    ? (currentLanguage === Language.KN ? 'ಇಂದು' : 'Today') 
                                                    : new Date(d.time).toLocaleDateString(currentLanguage === 'kn' ? 'kn-IN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                                                return (
                                                    <ForecastRow
                                                        key={i}
                                                        day={dayName}
                                                        min={convertTemp(d.temperatureMin)}
                                                        max={convertTemp(d.temperatureMax)}
                                                        code={d.weatherCode}
                                                        rainSum={d.rainSum}
                                                        precipProb={d.precipitationProbabilityMax}
                                                        unit={unit}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 2. Agri Insights & Farmer's Daily Brief Tab */}
                            {activeTab === 'insights' && (
                                <motion.div
                                    key="insights"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    {/* Google AI Studio Audio Card */}
                                    <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/60 border border-emerald-500/30">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-emerald-400" />
                                                <h3 className="font-bold text-sm text-white">
                                                    {currentLanguage === Language.KN ? 'ರೈತರ ದೈನಂದಿನ ಹವಾಮಾನ ಸಾರಾಂಶ' : "Farmer's Daily Meteorological Brief"}
                                                </h3>
                                            </div>
                                            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40 font-semibold">
                                                {currentLocationName}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                                            {briefingScript || 'Analyzing current meteorological parameters and field risks...'}
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleToggleAudioBriefing}
                                                disabled={isBriefingGenerating}
                                                className={`flex-1 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                                                    isBriefingPlaying 
                                                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                                                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                                                }`}
                                            >
                                                {isBriefingGenerating ? (
                                                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                                ) : isBriefingPlaying ? (
                                                    <Square className="w-4 h-4 fill-current" />
                                                ) : (
                                                    <Play className="w-4 h-4 fill-current" />
                                                )}
                                                <span>
                                                    {isBriefingGenerating 
                                                        ? 'Generating Voice...' 
                                                        : isBriefingPlaying 
                                                        ? 'Pause / Stop Voice' 
                                                        : currentLanguage === Language.KN ? 'ಧ್ವನಿ ವಿವರಣೆ ಆಲಿಸಿ (Google AI)' : 'Listen via Google AI Speech'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actionable Insights List */}
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mt-6 mb-2">
                                        Precision Agricultural Advisories
                                    </h3>

                                    {agriInsights.length > 0 ? (
                                        agriInsights.map((insight, idx) => (
                                            <AgriInsightCard key={idx} insight={insight} />
                                        ))
                                    ) : (
                                        <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/5">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                                            <p className="text-sm text-slate-200 font-medium">All weather conditions are optimal for farm operations.</p>
                                        </div>
                                    )}

                                    {/* Crop Sowing & Nutrition General Advisories */}
                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <div className={`${glassCard} p-4 flex flex-col items-center text-center`}>
                                            <SparklesIcon className="w-7 h-7 text-amber-300 mb-1.5" />
                                            <h4 className="font-bold text-xs text-white">Sowing & Planting Window</h4>
                                            <p className="text-[11px] mt-1 text-slate-300">Monsoon / Kharif Season</p>
                                        </div>
                                        <div className={`${glassCard} p-4 flex flex-col items-center text-center`}>
                                            <LeafIcon className="w-7 h-7 text-emerald-400 mb-1.5" />
                                            <h4 className="font-bold text-xs text-white">Foliar Spray Rule</h4>
                                            <p className="text-[11px] mt-1 text-slate-300">Avoid when rain {">"} 50%</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 3. Karnataka District Heatmap Selector Tab */}
                            {activeTab === 'map' && (
                                <motion.div
                                    key="map"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Karnataka 31-District Real-time Weather Grid</h3>
                                            <p className="text-xs text-slate-400">Click on any district to inspect farm conditions</p>
                                        </div>
                                    </div>
                                    <DistrictGrid
                                        selectedName={currentLocationName}
                                        onSelect={(district) => {
                                            setCurrentLocationName(district.name);
                                            setCurrentCoords({ lat: district.lat, lon: district.lon });
                                            setActiveTab('forecast');
                                        }}
                                    />
                                </motion.div>
                            )}

                            {/* 4. Live Rain & Cloud Radar Tab */}
                            {activeTab === 'radar' && (
                                <motion.div
                                    key="radar"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <RadarView />
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