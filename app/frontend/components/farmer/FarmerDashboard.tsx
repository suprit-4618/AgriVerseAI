import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, CropSellRequest, Language, OrderContract, DiseaseLog, MarketRateRecord } from '../../types';
import { marketService } from '../../services/marketService';
import { orderService } from '../../services/orderService';
import { mandiRateService } from '../../services/mandiRateService';
import { diseaseLogService } from '../../services/diseaseLogService';
import { 
    SparklesIcon, 
    CameraIcon, 
    BuildingIcon, 
    ArrowRightOnRectangleIcon, 
    ArrowUpRightIcon, 
    CheckCircleIcon, 
    ClockIcon, 
    MapPinIcon, 
    UserCircleIcon,
    ChevronDownIcon,
    PaperAirplaneIcon,
    ArrowLeftIcon,
    CheckBadgeIcon,
    XCircleIcon,
    BellIcon,
    DocumentTextIcon
} from '../common/IconComponents';
import LanguageToggle from '../common/LanguageToggle';
import NotificationCenter from '../NotificationCenter';
import BhoomiAssistant from '../BhoomiAssistant';
import PlantAnalysis from '../PlantAnalysis';
import SoilAnalysis from '../SoilAnalysis';
import WeatherView from '../WeatherView';
import SellCropModal from '../SellCropModal';
import { uiStrings } from '../../constants';
import { farmerTranslations } from '../../utils/translations';
import { useLanguage } from '../../context/LanguageContext';

interface FarmerDashboardProps {
    user: UserProfile;
    onLogout: () => void;
    onNavigate?: (page: string) => void;
    currentLanguage?: Language;
    setCurrentLanguage?: (lang: Language) => void;
}

type FarmerTab = 'overview' | 'diagnostics' | 'assistant' | 'soil_weather' | 'marketplace' | 'schemes';

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
    user,
    onLogout,
}) => {
    const { language: activeLanguage, setLanguage: setActiveLanguage, texts, farmerTexts: t, isKannada } = useLanguage();

    const [activeTab, setActiveTab] = useState<FarmerTab>('overview');
    const [sellRequests, setSellRequests] = useState<CropSellRequest[]>([]);
    const [orders, setOrders] = useState<OrderContract[]>([]);
    const [mandiRates, setMandiRates] = useState<MarketRateRecord[]>([]);
    const [diseaseLogs, setDiseaseLogs] = useState<DiseaseLog[]>([]);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<CropSellRequest | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Real-Time Firestore Role & Telemetry Sync (onSnapshot)
    useEffect(() => {
        if (!user?.id) return;
        setIsLoadingRequests(true);

        const unsubRequests = marketService.subscribeFarmerRequests(user.id, (data) => {
            setSellRequests(data);
            setIsLoadingRequests(false);
        });

        const unsubOrders = orderService.subscribeFarmerOrders(user.id, (data) => {
            setOrders(data);
        });

        const unsubRates = mandiRateService.subscribeLiveMandiRates((data) => {
            setMandiRates(data);
        });

        const unsubLogs = diseaseLogService.subscribeFarmerScanHistory(user.id, (data) => {
            setDiseaseLogs(data);
        });

        return () => {
            unsubRequests();
            unsubOrders();
            unsubRates();
            unsubLogs();
        };
    }, [user.id]);

    const handleSendMessage = async () => {
        if (!selectedRequest || !chatInput.trim()) return;
        try {
            const msg = await marketService.addMessage(selectedRequest.id, {
                senderId: user.id,
                senderName: user.fullName || (activeLanguage === Language.KN ? 'ರೈತರು' : 'Farmer'),
                text: chatInput
            });
            setSelectedRequest({
                ...selectedRequest,
                messages: [...(selectedRequest.messages || []), msg]
            });
            setChatInput('');
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    // Calculate dynamic stats
    const totalListedQuintals = sellRequests.reduce((sum, req) => sum + (req.quantity || 0), 0);
    const pendingBidsCount = sellRequests.filter(r => r.status === 'PENDING').length;
    const approvedSalesCount = sellRequests.filter(r => r.status === 'APPROVED').length;

    const navItems = [
        { id: 'overview', label: t.sidebar.overview, icon: '⌘', badge: null },
        { id: 'diagnostics', label: t.sidebar.diagnostics, icon: '🌿', badge: t.sidebar.diagnosticsBadge },
        { id: 'assistant', label: t.sidebar.assistant, icon: '🎙️', badge: t.sidebar.assistantBadge },
        { id: 'soil_weather', label: t.sidebar.soilWeather, icon: '🌦️', badge: null },
        { id: 'marketplace', label: t.sidebar.marketplace, icon: '⚖️', badge: pendingBidsCount > 0 ? `${pendingBidsCount} ${t.sidebar.activeBadge}` : null },
        { id: 'schemes', label: t.sidebar.schemes, icon: '📜', badge: t.sidebar.schemesBadge },
    ];

    return (
        <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans selection:bg-white selection:text-black">
            
            {/* 1. Left Sidebar Navigation */}
            <aside className={`bg-neutral-950 border-r border-neutral-900 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
                sidebarCollapsed ? 'w-20' : 'w-64 lg:w-72'
            }`}>
                {/* Brand Logo & Role Badge */}
                <div>
                    <div className="p-5 border-b border-neutral-900 flex items-center justify-between">
                        {!sidebarCollapsed ? (
                            <div>
                                <div className="text-base font-black tracking-tight text-white uppercase font-mono">
                                    {t.appName}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full text-center font-mono font-bold text-xs">AVA</div>
                        )}
                        <button 
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="text-neutral-500 hover:text-white p-1 rounded-md transition-colors text-xs font-mono"
                            title="Toggle Sidebar"
                        >
                            {sidebarCollapsed ? '→' : '←'}
                        </button>
                    </div>

                    {/* Farmer Profile Card Pill */}
                    <div className="p-4 border-b border-neutral-900/60 bg-neutral-900/20">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white text-black font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'F'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="overflow-hidden">
                                    <div className="text-xs font-bold text-white truncate">
                                        {user.fullName || t.sidebar.farmerRole}
                                    </div>
                                    <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 mt-0.5">
                                        <MapPinIcon className="w-3 h-3 text-neutral-500" />
                                        <span className="truncate">{user.location || (activeLanguage === Language.KN ? 'ಕರ್ನಾಟಕ, ಭಾರತ' : 'Karnataka, India')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Navigation Links */}
                    <nav className="p-3 space-y-1.5">
                        {navItems.map((nav) => {
                            const isActive = activeTab === nav.id;
                            return (
                                <button
                                    key={nav.id}
                                    onClick={() => setActiveTab(nav.id as FarmerTab)}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                                        isActive 
                                            ? 'bg-white text-black font-bold shadow-lg shadow-white/5' 
                                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm">{nav.icon}</span>
                                        {!sidebarCollapsed && <span>{nav.label}</span>}
                                    </div>
                                    {!sidebarCollapsed && nav.badge && (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                            isActive 
                                                ? 'bg-black text-white' 
                                                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                                        }`}>
                                            {nav.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Sidebar Action & Logout */}
                <div className="p-3 border-t border-neutral-900 space-y-2">
                    <button
                        onClick={() => setIsSellModalOpen(true)}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <ArrowUpRightIcon className="w-3.5 h-3.5" />
                        {!sidebarCollapsed && <span>{t.sidebar.sellHarvest}</span>}
                    </button>

                    <button
                        onClick={onLogout}
                        className="w-full text-neutral-500 hover:text-red-400 hover:bg-neutral-900/40 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                        <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                        {!sidebarCollapsed && <span>{t.sidebar.signOut}</span>}
                    </button>
                </div>
            </aside>

            {/* 2. Main Dashboard Content Stage */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                
                {/* Top Header Bar */}
                <header className="h-16 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <h1 className="text-base font-bold uppercase tracking-tight text-white font-mono">
                            {activeTab === 'overview' && t.header.overview}
                            {activeTab === 'diagnostics' && t.header.diagnostics}
                            {activeTab === 'assistant' && t.header.assistant}
                            {activeTab === 'soil_weather' && t.header.soilWeather}
                            {activeTab === 'marketplace' && t.header.marketplace}
                            {activeTab === 'schemes' && t.header.schemes}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageToggle currentLanguage={activeLanguage} setCurrentLanguage={setActiveLanguage} size="sm" />
                        <NotificationCenter user={user} />
                        <button
                            onClick={() => setIsSellModalOpen(true)}
                            className="bg-white text-black hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all hidden md:flex items-center gap-1.5 shadow-sm"
                        >
                            <span>{t.header.listHarvest}</span>
                        </button>
                    </div>
                </header>

                {/* Main Tab Viewport */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-black">
                    <AnimatePresence mode="wait">
                        
                        {/* TAB 1: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview-tab"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-6 max-w-7xl mx-auto"
                            >
                                {/* Top Banner: Farm Health & Seasonal Advisory */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-1">
                                            {t.overviewTab.greeting}, {user.fullName || t.overviewTab.cultivator}
                                        </div>
                                        <div className="text-lg sm:text-xl font-bold uppercase tracking-tight text-white">
                                            {t.overviewTab.bannerTitle}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setActiveTab('diagnostics')}
                                            className="bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                        >
                                            <CameraIcon className="w-3.5 h-3.5" />
                                            <span>{t.overviewTab.scanLeafBtn}</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('assistant')}
                                            className="bg-white text-black hover:bg-neutral-200 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                        >
                                            <SparklesIcon className="w-3.5 h-3.5" />
                                            <span>{t.overviewTab.voiceAiBtn}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 4 Key Agriculture Metric Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Card 1: Crop Health */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.cropHealth}</span>
                                            <span className="text-xs font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                                {diseaseLogs.length > 0 
                                                    ? (diseaseLogs[0].severity === 'Healthy' 
                                                        ? (isKannada ? 'ಆರೋಗ್ಯಕರ' : 'OPTIMAL') 
                                                        : `${diseaseLogs[0].confidenceScore}% ${diseaseLogs[0].severity.toUpperCase()}`)
                                                    : t.overviewTab.cropHealthStatus}
                                            </span>
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-white mt-3 font-mono truncate">
                                            {diseaseLogs.length > 0 ? diseaseLogs[0].diseaseName : t.overviewTab.blights}
                                        </div>
                                        <div className="text-[11px] font-mono text-neutral-500 mt-2 truncate">
                                            {diseaseLogs.length > 0 
                                                ? `${diseaseLogs[0].crop} • ${new Date(diseaseLogs[0].timestamp).toLocaleDateString()}` 
                                                : t.overviewTab.blightsSub}
                                        </div>
                                    </div>

                                    {/* Card 2: Active Harvest & Contracts */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.activeHarvest}</span>
                                            <span className="text-xs font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                                {sellRequests.length} {t.overviewTab.listingsBadge}
                                            </span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-white mt-3 font-mono">
                                            {totalListedQuintals} {t.overviewTab.quintalsUnit}
                                        </div>
                                        <div className="text-[11px] font-mono text-neutral-500 mt-2">
                                            {orders.length > 0 
                                                ? `${orders.length} ${isKannada ? 'ದೃಢೀಕರಿಸಿದ ಆದೇಶಗಳು' : 'confirmed contracts'}`
                                                : `${pendingBidsCount} ${t.overviewTab.incomingBidsSub}`}
                                        </div>
                                    </div>

                                    {/* Card 3: Real-Time Mandi Benchmark */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.apmcRate}</span>
                                            <span className="text-xs font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                                {mandiRates.length > 0 ? mandiRates[0].commodity.split(' ')[0].toUpperCase() : t.overviewTab.cottonTag}
                                            </span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-white mt-3 font-mono">
                                            {mandiRates.length > 0 ? `₹${mandiRates[0].modalPrice.toLocaleString('en-IN')} / Q` : t.overviewTab.rateValue}
                                        </div>
                                        <div className="text-[11px] font-mono text-neutral-500 mt-2 truncate">
                                            {mandiRates.length > 0 
                                                ? `${mandiRates[0].changePercentage} • ${mandiRates[0].marketName}`
                                                : t.overviewTab.rateSub}
                                        </div>
                                    </div>

                                    {/* Card 4: Microclimate */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.microclimate}</span>
                                            <span className="text-xs font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{t.overviewTab.tempValue}</span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-white mt-3 font-mono">{t.overviewTab.rainRisk}</div>
                                        <div className="text-[11px] font-mono text-neutral-500 mt-2">
                                            {t.overviewTab.rainRiskSub}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Grid: Left 2/3 and Right 1/3 */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    
                                    {/* Left 2 Columns: Live Harvest Sales & Diagnostic Log */}
                                    <div className="lg:col-span-2 space-y-6">
                                        
                                        {/* 1. Quick Agricultural Launchpad */}
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
                                            <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-4">
                                                {t.overviewTab.fastActionsTitle}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <button
                                                    onClick={() => setActiveTab('diagnostics')}
                                                    className="bg-neutral-900 hover:bg-neutral-800 p-4 rounded-xl border border-neutral-800 hover:border-white transition-all text-left group"
                                                >
                                                    <div className="text-lg mb-2">🌿</div>
                                                    <div className="text-xs font-bold text-white uppercase font-mono">{t.overviewTab.scanLeafAction}</div>
                                                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{t.overviewTab.instantScanSub}</div>
                                                </button>

                                                <button
                                                    onClick={() => setActiveTab('assistant')}
                                                    className="bg-neutral-900 hover:bg-neutral-800 p-4 rounded-xl border border-neutral-800 hover:border-white transition-all text-left group"
                                                >
                                                    <div className="text-lg mb-2">🎙️</div>
                                                    <div className="text-xs font-bold text-white uppercase font-mono">{t.overviewTab.bhoomiAction}</div>
                                                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{t.overviewTab.kannadaVoiceSub}</div>
                                                </button>

                                                <button
                                                    onClick={() => setActiveTab('soil_weather')}
                                                    className="bg-neutral-900 hover:bg-neutral-800 p-4 rounded-xl border border-neutral-800 hover:border-white transition-all text-left group"
                                                >
                                                    <div className="text-lg mb-2">🧪</div>
                                                    <div className="text-xs font-bold text-white uppercase font-mono">{t.overviewTab.soilHealthAction}</div>
                                                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{t.overviewTab.npkSub}</div>
                                                </button>

                                                <button
                                                    onClick={() => setIsSellModalOpen(true)}
                                                    className="bg-neutral-900 hover:bg-neutral-800 p-4 rounded-xl border border-neutral-800 hover:border-white transition-all text-left group"
                                                >
                                                    <div className="text-lg mb-2">⚖️</div>
                                                    <div className="text-xs font-bold text-white uppercase font-mono">{t.overviewTab.sellHarvestAction}</div>
                                                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{t.overviewTab.zeroCommSub}</div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2. Active Harvest Listings & Live Buyer Bids */}
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className="text-sm font-bold uppercase tracking-tight text-white font-mono">
                                                        {t.overviewTab.mySalesTitle}
                                                    </h3>
                                                    <p className="text-[11px] text-neutral-400 font-mono">
                                                        {t.overviewTab.mySalesSub}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setIsSellModalOpen(true)}
                                                    className="text-xs font-mono font-bold uppercase text-white hover:underline"
                                                >
                                                    {t.overviewTab.newListingBtn}
                                                </button>
                                            </div>

                                            {sellRequests.length === 0 ? (
                                                <div className="p-8 border border-neutral-900 rounded-xl text-center">
                                                    <div className="text-neutral-500 text-xs font-mono mb-3">
                                                        {t.overviewTab.noListings}
                                                    </div>
                                                    <button
                                                        onClick={() => setIsSellModalOpen(true)}
                                                        className="bg-white text-black font-mono font-bold text-xs uppercase px-4 py-2 rounded-lg hover:bg-neutral-200 transition-all"
                                                    >
                                                        {t.overviewTab.listFirstHarvest}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {sellRequests.map((req) => (
                                                        <div
                                                            key={req.id}
                                                            onClick={() => setSelectedRequest(req)}
                                                            className="p-4 bg-neutral-900/60 border border-neutral-800 hover:border-neutral-600 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                                                        >
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-white uppercase text-sm">{req.cropName}</span>
                                                                    <span className="text-[10px] font-mono bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                                                                        {req.quantity} {t.overviewTab.quintalsUnit}
                                                                    </span>
                                                                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                                                                        req.status === 'APPROVED' 
                                                                            ? 'bg-white text-black' 
                                                                            : req.status === 'REJECTED' 
                                                                            ? 'bg-red-950 text-red-300 border border-red-800' 
                                                                            : 'bg-neutral-800 text-neutral-300'
                                                                    }`}>
                                                                        {req.status}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] font-mono text-neutral-400 mt-1">
                                                                    {t.overviewTab.askingRate}: ₹{req.expectedPrice}/Q • {t.overviewTab.location}: {req.location || 'Karnataka'}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                                                <span className="text-[11px] font-mono text-neutral-400">
                                                                    {req.messages?.length || 0} {t.overviewTab.messages}
                                                                </span>
                                                                <button className="bg-neutral-800 hover:bg-white hover:text-black text-white px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all">
                                                                    {t.overviewTab.viewBids}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Right 1 Column: Bhoomi Voice Widget & Govt Schemes */}
                                    <div className="space-y-6">
                                        
                                        {/* Bhoomi Voice Interactive Card */}
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.voiceAdvisor}</span>
                                                <span className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-white px-2 py-0.5 rounded">
                                                    {t.overviewTab.bhoomiAiBadge}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold uppercase text-white tracking-tight">
                                                {t.overviewTab.bilingualAssistant}
                                            </h3>
                                            <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
                                                {t.overviewTab.voiceHelperText}
                                            </p>

                                            <div className="mt-4 space-y-2">
                                                <button
                                                    onClick={() => setActiveTab('assistant')}
                                                    className="w-full text-left p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 transition-all flex items-center justify-between"
                                                >
                                                    <span>"{t.overviewTab.voiceSample1}"</span>
                                                    <span className="text-neutral-500">→</span>
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('assistant')}
                                                    className="w-full text-left p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 transition-all flex items-center justify-between"
                                                >
                                                    <span>"{t.overviewTab.voiceSample2}"</span>
                                                    <span className="text-neutral-500">→</span>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setActiveTab('assistant')}
                                                className="w-full bg-white text-black hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all shadow-md"
                                            >
                                                <SparklesIcon className="w-4 h-4" />
                                                <span>{t.overviewTab.openVoiceBtn}</span>
                                            </button>
                                        </div>

                                        {/* Government Schemes & Subsidy Tracker */}
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.subsidiesBadge}</span>
                                                <span className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-white px-2 py-0.5 rounded">
                                                    {t.overviewTab.pmKisanBadge}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold uppercase text-white tracking-tight">
                                                {t.overviewTab.govtSchemesTitle}
                                            </h3>
                                            
                                            <div className="mt-4 space-y-3 font-mono text-xs">
                                                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
                                                    <div className="flex justify-between text-white font-bold">
                                                        <span>{t.overviewTab.pmKisanTitle}</span>
                                                        <span className="text-neutral-300">{t.overviewTab.pmKisanAmount}</span>
                                                    </div>
                                                    <div className="text-[10px] text-neutral-500 mt-1">
                                                        {t.overviewTab.dbtVerified}
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
                                                    <div className="flex justify-between text-white font-bold">
                                                        <span>{t.overviewTab.insuranceTitle}</span>
                                                        <span className="text-neutral-300">{t.overviewTab.insuranceStatus}</span>
                                                    </div>
                                                    <div className="text-[10px] text-neutral-500 mt-1">
                                                        {t.overviewTab.insurancePolicy}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setActiveTab('schemes')}
                                                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl mt-4 transition-all"
                                            >
                                                {t.overviewTab.exploreSubsidiesBtn}
                                            </button>
                                        </div>

                                    </div>

                                </div>
                            </motion.div>
                        )}

                        {/* TAB 2: DIAGNOSTICS (PLANT DISEASE SCANNER & REAL-TIME LOGS) */}
                        {activeTab === 'diagnostics' && (
                            <motion.div
                                key="diagnostics-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-6xl mx-auto space-y-6"
                            >
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <PlantAnalysis texts={texts} currentLanguage={activeLanguage} user={user} />
                                </div>

                                {/* Real-time Pathology Diagnostic Logs from Firestore */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-tight text-white font-mono">
                                                {t.diagnosticsSection.recentScansTitle}
                                            </h3>
                                            <p className="text-[11px] text-neutral-400 font-mono">
                                                {t.diagnosticsSection.recentScansSub}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                                            {diseaseLogs.length} {isKannada ? 'ದಾಖಲೆಗಳು' : 'Records'}
                                        </span>
                                    </div>

                                    {diseaseLogs.length === 0 ? (
                                        <div className="p-8 border border-neutral-900 rounded-xl text-center">
                                            <p className="text-neutral-500 font-mono text-xs">
                                                {t.diagnosticsSection.noScansYet}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {diseaseLogs.map((log) => {
                                                const isExpanded = expandedLogId === log.id;
                                                return (
                                                    <div
                                                        key={log.id}
                                                        className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3 hover:border-neutral-700 transition-all"
                                                    >
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-white uppercase text-sm font-mono">{log.crop}</span>
                                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                                                                        {log.confidenceScore}% {t.diagnosticsSection.confidenceLabel}
                                                                    </span>
                                                                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                                                                        log.severity === 'Healthy' 
                                                                            ? 'bg-white text-black' 
                                                                            : log.severity === 'High' 
                                                                            ? 'bg-red-950 text-red-300 border border-red-800' 
                                                                            : 'bg-neutral-800 text-neutral-300'
                                                                    }`}>
                                                                        {log.severity}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-neutral-300 font-medium mt-1">
                                                                    {log.diseaseName}
                                                                </div>
                                                                <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                                                                    {new Date(log.timestamp).toLocaleString()} • {log.location || 'Karnataka'}
                                                                </div>
                                                            </div>

                                                            {(log.organicRemedy?.length > 0 || log.chemicalRemedy?.length > 0 || log.preventionTips?.length > 0) && (
                                                                <button
                                                                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                                    className="text-xs font-mono font-bold uppercase text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg transition-all"
                                                                >
                                                                    {isExpanded ? t.diagnosticsSection.hideRemedies : t.diagnosticsSection.toggleRemedies}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="pt-3 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                                                                {log.organicRemedy?.length > 0 && (
                                                                    <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                                                                        <div className="text-white font-bold mb-1 text-[11px] uppercase tracking-wider">
                                                                            🌿 {t.diagnosticsSection.organic}
                                                                        </div>
                                                                        <ul className="text-neutral-400 text-[10px] space-y-1 list-disc list-inside">
                                                                            {log.organicRemedy.map((r, i) => (
                                                                                <li key={i}>{r}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {log.chemicalRemedy?.length > 0 && (
                                                                    <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                                                                        <div className="text-white font-bold mb-1 text-[11px] uppercase tracking-wider">
                                                                            🧪 {t.diagnosticsSection.chemical}
                                                                        </div>
                                                                        <ul className="text-neutral-400 text-[10px] space-y-1 list-disc list-inside">
                                                                            {log.chemicalRemedy.map((r, i) => (
                                                                                <li key={i}>{r}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {log.preventionTips?.length > 0 && (
                                                                    <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                                                                        <div className="text-white font-bold mb-1 text-[11px] uppercase tracking-wider">
                                                                            🛡️ {t.diagnosticsSection.prevention}
                                                                        </div>
                                                                        <ul className="text-neutral-400 text-[10px] space-y-1 list-disc list-inside">
                                                                            {log.preventionTips.map((r, i) => (
                                                                                <li key={i}>{r}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 3: BHOOMI VOICE ASSISTANT */}
                        {activeTab === 'assistant' && (
                            <motion.div
                                key="assistant-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-4xl mx-auto h-[82vh]"
                            >
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl h-full overflow-hidden">
                                    <BhoomiAssistant
                                        user={user}
                                        currentLanguage={activeLanguage}
                                        setCurrentLanguage={setActiveLanguage}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 4: SOIL & WEATHER */}
                        {activeTab === 'soil_weather' && (
                            <motion.div
                                key="soil-weather-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-7xl mx-auto space-y-6"
                            >
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <WeatherView texts={texts} currentLanguage={activeLanguage} />
                                </div>
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <SoilAnalysis texts={texts} />
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 5: HARVEST MARKETPLACE & BIDS & CONFIRMED ORDERS */}
                        {activeTab === 'marketplace' && (
                            <motion.div
                                key="marketplace-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-7xl mx-auto space-y-6"
                            >
                                {/* 1. Active Harvest Listings */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono">
                                                {t.marketplaceTab.title}
                                            </h2>
                                            <p className="text-xs text-neutral-400 font-mono mt-1">
                                                {t.marketplaceTab.subtitle}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsSellModalOpen(true)}
                                            className="bg-white text-black font-mono font-bold text-xs uppercase px-4 py-2.5 rounded-xl hover:bg-neutral-200 transition-all flex items-center gap-2"
                                        >
                                            <ArrowUpRightIcon className="w-4 h-4" />
                                            <span>{t.marketplaceTab.listNewHarvest}</span>
                                        </button>
                                    </div>

                                    {sellRequests.length === 0 ? (
                                        <div className="p-12 text-center border border-neutral-900 rounded-xl">
                                            <p className="text-neutral-500 font-mono text-sm mb-4">
                                                {t.marketplaceTab.noCropsListed}
                                            </p>
                                            <button
                                                onClick={() => setIsSellModalOpen(true)}
                                                className="bg-white text-black font-mono font-bold text-xs uppercase px-6 py-3 rounded-xl hover:bg-neutral-200 transition-all"
                                            >
                                                {t.marketplaceTab.createListingBtn}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {sellRequests.map((req) => (
                                                <div
                                                    key={req.id}
                                                    className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-600 transition-all"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <span className="text-lg font-bold text-white uppercase">{req.cropName}</span>
                                                            <div className="text-xs font-mono text-neutral-400 mt-0.5">
                                                                {req.quantity} {t.overviewTab.quintalsUnit} • {t.marketplaceTab.gradeA}
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase ${
                                                            req.status === 'APPROVED' 
                                                                ? 'bg-white text-black' 
                                                                : req.status === 'REJECTED' 
                                                                ? 'bg-red-950 text-red-300 border border-red-800' 
                                                                : 'bg-neutral-800 text-neutral-300'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                    </div>

                                                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-xs space-y-1 mb-4">
                                                        <div className="flex justify-between text-neutral-400">
                                                            <span>{t.overviewTab.askingRate}:</span>
                                                            <span className="text-white font-bold">₹{req.expectedPrice}/Q</span>
                                                        </div>
                                                        <div className="flex justify-between text-neutral-400">
                                                            <span>{t.marketplaceTab.estimatedValue}:</span>
                                                            <span className="text-white font-bold">₹{(req.expectedPrice * req.quantity).toLocaleString('en-IN')}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-mono text-neutral-500">
                                                            {req.messages?.length || 0} {t.marketplaceTab.buyerMessages}
                                                        </span>
                                                        <button
                                                            onClick={() => setSelectedRequest(req)}
                                                            className="bg-neutral-800 hover:bg-white hover:text-black text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-xl transition-all"
                                                        >
                                                            {t.marketplaceTab.openNegotiation}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 2. Confirmed Farm Contracts & Dispatches (orders collection sync) */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-base font-bold uppercase tracking-tight text-white font-mono">
                                                {t.marketplaceTab.ordersTitle}
                                            </h3>
                                            <p className="text-xs text-neutral-400 font-mono mt-0.5">
                                                {t.marketplaceTab.ordersSubtitle}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-white px-2.5 py-1 rounded">
                                            {orders.length} {isKannada ? 'ಒಪ್ಪಂದಗಳು' : 'Contracts'}
                                        </span>
                                    </div>

                                    {orders.length === 0 ? (
                                        <div className="p-8 border border-neutral-900 rounded-xl text-center">
                                            <p className="text-neutral-500 font-mono text-xs">
                                                {t.marketplaceTab.noOrders}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 font-mono text-xs">
                                            {orders.map((ord) => (
                                                <div
                                                    key={ord.id}
                                                    className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-neutral-700 transition-all"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-bold uppercase text-sm">
                                                                {ord.cropName} • {ord.quantity} {t.overviewTab.quintalsUnit}
                                                            </span>
                                                            <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                                                                #{ord.orderId}
                                                            </span>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                                                                ord.status === 'DELIVERED'
                                                                    ? 'bg-white text-black'
                                                                    : ord.status === 'DISPATCHED'
                                                                    ? 'bg-neutral-800 text-white border border-neutral-600'
                                                                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                                                            }`}>
                                                                {ord.status === 'CONFIRMED' && t.marketplaceTab.statusConfirmed}
                                                                {ord.status === 'DISPATCHED' && t.marketplaceTab.statusDispatched}
                                                                {ord.status === 'DELIVERED' && t.marketplaceTab.statusDelivered}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-neutral-400">
                                                            {isKannada ? 'ಖರೀದಿದಾರರು:' : 'Buyer:'} {ord.buyerName} • {t.marketplaceTab.agreedRate}: ₹{ord.ratePerQuintal}/Q • {t.marketplaceTab.weighbridgeId}: {ord.weighbridgeReceiptId}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-500">
                                                            {new Date(ord.createdAt).toLocaleString()} • {t.marketplaceTab.zeroMarketFee}
                                                        </div>
                                                    </div>

                                                    <div className="text-right self-end md:self-auto">
                                                        <div className="text-base font-bold text-white">
                                                            ₹{ord.totalAmount.toLocaleString('en-IN')}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-400">
                                                            {t.marketplaceTab.totalPayout}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 6: GOVERNMENT SCHEMES */}
                        {activeTab === 'schemes' && (
                            <motion.div
                                key="schemes-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-6xl mx-auto space-y-6"
                            >
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono mb-2">
                                        {t.schemesTab.title}
                                    </h2>
                                    <p className="text-xs text-neutral-400 font-mono mb-6">
                                        {t.schemesTab.subtitle}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {t.schemesTab.schemesList.map((scheme, idx) => (
                                            <div key={idx} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                                                            {scheme.badge}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-white bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                                                            {scheme.status}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-bold uppercase text-white mb-1">
                                                        {scheme.title}
                                                    </h3>
                                                    <div className="text-xs font-mono font-bold text-white mb-2">
                                                        {scheme.benefit}
                                                    </div>
                                                    <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                                                        {scheme.desc}
                                                    </p>
                                                </div>
                                                <div className="mt-5 pt-3 border-t border-neutral-800/80 flex justify-between items-center">
                                                    <span className="text-[10px] font-mono text-neutral-500">{t.schemesTab.deptName}</span>
                                                    <button className="text-xs font-mono font-bold uppercase text-white hover:underline">
                                                        {t.schemesTab.applyBtn}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </main>
            </div>

            {/* 3. Sell Crop Modal */}
            <SellCropModal
                isOpen={isSellModalOpen}
                onClose={() => setIsSellModalOpen(false)}
                user={user}
                onSuccess={() => {
                    marketService.getRequestsByFarmer(user.id).then(setSellRequests);
                    setIsSellModalOpen(false);
                }}
            />

            {/* 4. Negotiation Chat Modal with Mandi Buyers */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[600px]"
                    >
                        <div className="p-4 border-b border-neutral-900 flex justify-between items-center bg-neutral-900/40">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-white font-mono">
                                    {t.negotiationModal.title} • {selectedRequest.cropName}
                                </h3>
                                <p className="text-[10px] text-neutral-400 font-mono">
                                    {selectedRequest.quantity} {t.overviewTab.quintalsUnit} • {t.negotiationModal.expected}: ₹{selectedRequest.expectedPrice}/Q
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="text-neutral-500 hover:text-white p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(!selectedRequest.messages || selectedRequest.messages.length === 0) ? (
                                <div className="text-center text-neutral-600 font-mono text-xs my-auto pt-20">
                                    {t.negotiationModal.noMessages}
                                </div>
                            ) : (
                                selectedRequest.messages.map((msg, i) => {
                                    const isMe = msg.senderId === user.id;
                                    return (
                                        <div
                                            key={i}
                                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className="text-[10px] font-mono text-neutral-500 mb-1">
                                                {msg.senderName}
                                            </div>
                                            <div className={`p-3 rounded-xl max-w-xs text-xs font-mono ${
                                                isMe 
                                                    ? 'bg-white text-black' 
                                                    : 'bg-neutral-900 text-white border border-neutral-800'
                                            }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-3 border-t border-neutral-900 flex gap-2 bg-neutral-950">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={t.negotiationModal.placeholder}
                                className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-white text-black font-mono font-bold text-xs uppercase px-4 py-2 rounded-xl hover:bg-neutral-200 transition-all"
                            >
                                {t.negotiationModal.sendBtn}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default FarmerDashboard;
