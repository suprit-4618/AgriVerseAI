import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, CropSellRequest, Language, OrderContract, OrderStatus, MarketRateRecord } from '../../types';
import { marketService } from '../../services/marketService';
import { orderService } from '../../services/orderService';
import { mandiRateService } from '../../services/mandiRateService';
import { 
    BuildingIcon, 
    ArrowRightOnRectangleIcon, 
    ArrowUpRightIcon, 
    ArrowDownRightIcon,
    MapPinIcon, 
    CheckCircleIcon,
    XCircleIcon,
    DocumentTextIcon,
    SparklesIcon,
    ClockIcon,
    CheckBadgeIcon
} from '../common/IconComponents';
import LanguageToggle from '../common/LanguageToggle';
import NotificationCenter from '../NotificationCenter';
import MarketplaceView from '../MarketplaceView';
import { uiStrings, karnatakaMarkets } from '../../constants';
import { buyerTranslations } from '../../utils/translations';
import { useLanguage } from '../../context/LanguageContext';

interface BuyerDashboardProps {
    user: UserProfile;
    onLogout: () => void;
    onNavigate?: (page: string) => void;
    currentLanguage?: Language;
    setCurrentLanguage?: (lang: Language) => void;
}

type BuyerTab = 'overview' | 'marketplace' | 'mandi_rates' | 'orders';

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
    user,
    onLogout,
}) => {
    const { language: activeLanguage, setLanguage: setActiveLanguage, texts, buyerTexts: t, isKannada } = useLanguage();

    const [activeTab, setActiveTab] = useState<BuyerTab>('overview');
    const [allRequests, setAllRequests] = useState<CropSellRequest[]>([]);
    const [orders, setOrders] = useState<OrderContract[]>([]);
    const [mandiRates, setMandiRates] = useState<MarketRateRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<CropSellRequest | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [offerRate, setOfferRate] = useState('');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Real-Time Subscriptions to Market Listings, Orders, & APMC Mandi Rates
    useEffect(() => {
        if (!user?.id) return;
        setIsLoading(true);

        const unsubRequests = marketService.subscribeAllRequests((data) => {
            setAllRequests(data);
            setIsLoading(false);
        });

        const unsubOrders = orderService.subscribeBuyerOrders(user.id, (data) => {
            setOrders(data);
        });

        const unsubRates = mandiRateService.subscribeLiveMandiRates((data) => {
            setMandiRates(data);
        });

        return () => {
            unsubRequests();
            unsubOrders();
            unsubRates();
        };
    }, [user.id]);

    const handleSendMessage = async () => {
        if (!selectedRequest || !chatInput.trim()) return;
        try {
            const msg = await marketService.addMessage(selectedRequest.id, {
                senderId: user.id,
                senderName: user.fullName || (activeLanguage === Language.KN ? 'ಖರೀದಿದಾರರು' : 'Buyer Agent'),
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

    const handleApproveDeal = async () => {
        if (!selectedRequest || !offerRate) return;
        try {
            const finalRate = parseFloat(offerRate);
            const buyerName = user.fullName || (activeLanguage === Language.KN ? 'ಖರೀದಿದಾರರು' : 'Buyer Agent');
            await marketService.generateBill(selectedRequest, buyerName, finalRate);
            await marketService.updateStatus(selectedRequest.id, 'APPROVED', finalRate, user.id, buyerName);
            setShowApprovalModal(false);
            setSelectedRequest(null);
            setOfferRate('');
        } catch (err) {
            console.error("Error approving deal:", err);
        }
    };

    const handleUpdateOrderStatus = async (orderDocId: string, nextStatus: OrderStatus) => {
        try {
            await orderService.updateOrderStatus(orderDocId, nextStatus);
        } catch (err) {
            console.error("Error updating order status:", err);
        }
    };

    const handleRejectDeal = async () => {
        if (!selectedRequest) return;
        const confirmMsg = activeLanguage === Language.KN 
            ? "ಈ ವಿನಂತಿಯನ್ನು ತಿರಸ್ಕರಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?" 
            : "Are you sure you want to reject this request?";
        if (confirm(confirmMsg)) {
            await marketService.updateStatus(selectedRequest.id, 'REJECTED');
            setSelectedRequest(null);
        }
    };

    // Calculate live procurement metrics
    const totalVolumeAvailable = useMemo(() => {
        return allRequests.reduce((sum, req) => sum + (req.quantity || 0), 0);
    }, [allRequests]);

    const approvedDeals = useMemo(() => {
        return allRequests.filter(r => r.status === 'APPROVED');
    }, [allRequests]);

    const pendingDeals = useMemo(() => {
        return allRequests.filter(r => r.status === 'PENDING');
    }, [allRequests]);

    const navItems = [
        { id: 'overview', label: t.sidebar.overview, icon: '⌘', badge: null },
        { id: 'marketplace', label: t.sidebar.marketplace, icon: '🛒', badge: pendingDeals.length > 0 ? `${pendingDeals.length} ${t.sidebar.batchesBadge}` : null },
        { id: 'mandi_rates', label: t.sidebar.mandiRates, icon: '📊', badge: t.sidebar.liveMandiBadge },
        { id: 'orders', label: t.sidebar.orders, icon: '📜', badge: orders.length > 0 ? `${orders.length} ${t.sidebar.settledBadge}` : null },
    ];

    return (
        <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans selection:bg-white selection:text-black">
            
            {/* 1. Left Sidebar Navigation */}
            <aside className={`bg-neutral-950 border-r border-neutral-900 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
                sidebarCollapsed ? 'w-20' : 'w-64 lg:w-72'
            }`}>
                <div>
                    {/* Brand Header */}
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

                    {/* Buyer Profile Pill */}
                    <div className="p-4 border-b border-neutral-900/60 bg-neutral-900/20">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white text-black font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'B'}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="overflow-hidden">
                                    <div className="text-xs font-bold text-white truncate">
                                        {user.fullName || t.sidebar.buyerRole}
                                    </div>
                                    <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 mt-0.5">
                                        <BuildingIcon className="w-3 h-3 text-neutral-500" />
                                        <span className="truncate">{t.sidebar.buyerRole}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="p-3 space-y-1.5">
                        {navItems.map((nav) => {
                            const isActive = activeTab === nav.id;
                            return (
                                <button
                                    key={nav.id}
                                    onClick={() => setActiveTab(nav.id as BuyerTab)}
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
                <div className="p-3 border-t border-neutral-900">
                    <button
                        onClick={onLogout}
                        className="w-full text-neutral-500 hover:text-red-400 hover:bg-neutral-900/40 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                        <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                        {!sidebarCollapsed && <span>{t.sidebar.signOut}</span>}
                    </button>
                </div>
            </aside>

            {/* 2. Main Content Stage */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                
                {/* Header */}
                <header className="h-16 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <h1 className="text-base font-bold uppercase tracking-tight text-white font-mono">
                            {activeTab === 'overview' && t.header.overview}
                            {activeTab === 'marketplace' && t.header.marketplace}
                            {activeTab === 'mandi_rates' && t.header.mandiRates}
                            {activeTab === 'orders' && t.header.orders}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageToggle currentLanguage={activeLanguage} setCurrentLanguage={setActiveLanguage} size="sm" />
                        <NotificationCenter user={user} />
                    </div>
                </header>

                {/* Main Viewport */}
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
                                {/* Top Banner */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-1">
                                            {t.overviewTab.welcome}, {user.fullName || t.overviewTab.trader}
                                        </div>
                                        <div className="text-lg sm:text-xl font-bold uppercase tracking-tight text-white">
                                            {t.overviewTab.bannerTitle}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setActiveTab('marketplace')}
                                            className="bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all"
                                        >
                                            {t.overviewTab.browseBatchesBtn}
                                        </button>
                                    </div>
                                </div>

                                {/* 4 Key Commercial Metric Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.availableHarvest}</span>
                                            <span className="text-xs font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{t.overviewTab.liveFeedBadge}</span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-white mt-3 font-mono">{totalVolumeAvailable} {t.overviewTab.quintalsUnit}</div>
                                        <div className="text-[11px] font-mono text-neutral-500 mt-2">
                                            {allRequests.length} {t.overviewTab.activeBatchesSub}
                                        </div>
                                    </div>

                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.pendingBids}</span>
                                            <span className="text-xs font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{pendingDeals.length} {t.overviewTab.activeOrdersBadge}</span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-white mt-3 font-mono">{pendingDeals.length} {t.overviewTab.ordersUnit}</div>
                                        <div className="text-[11px] font-mono text-neutral-500 mt-2">
                                            {t.overviewTab.pendingSub}
                                        </div>
                                    </div>

                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.settledContracts}</span>
                                            <span className="text-xs font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{t.overviewTab.executedBadge}</span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-white mt-3 font-mono">{approvedDeals.length} {t.overviewTab.dealsUnit}</div>
                                        <div className="text-[11px] font-mono text-neutral-500 mt-2">
                                            {t.overviewTab.settledSub}
                                        </div>
                                    </div>

                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.mandiMargin}</span>
                                            <span className="text-xs font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{t.overviewTab.directBadge}</span>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-white mt-3 font-mono">{t.overviewTab.zeroFee}</div>
                                        <div className="text-[11px] font-mono text-neutral-500 mt-2">
                                            {t.overviewTab.zeroFeeSub}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Grid: Left 2/3 and Right 1/3 */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    
                                    {/* Left 2 Columns: Live Farmer Listings */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className="text-sm font-bold uppercase tracking-tight text-white font-mono">
                                                        {t.overviewTab.incomingBatchesTitle}
                                                    </h3>
                                                    <p className="text-[11px] text-neutral-400 font-mono">
                                                        {t.overviewTab.incomingBatchesSub}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setActiveTab('marketplace')}
                                                    className="text-xs font-mono font-bold uppercase text-white hover:underline"
                                                >
                                                    {t.overviewTab.viewAllBatchesBtn}
                                                </button>
                                            </div>

                                            {allRequests.length === 0 ? (
                                                <div className="p-8 border border-neutral-900 rounded-xl text-center">
                                                    <p className="text-neutral-500 font-mono text-xs">
                                                        {t.overviewTab.noBatches}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {allRequests.slice(0, 5).map((req) => (
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
                                                                    <span className="text-[10px] font-mono text-neutral-400">
                                                                        {t.overviewTab.farmerLabel}: {req.farmerName || (activeLanguage === Language.KN ? 'ಪರಿಶೀಲಿಸಿದ ರೈತರು' : 'Verified Producer')}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] font-mono text-neutral-400 mt-1">
                                                                    {t.overviewTab.askingRate}: ₹{req.expectedPrice}/Q • {t.overviewTab.location}: {req.location || 'Karnataka'}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                                                                    req.status === 'APPROVED' 
                                                                        ? 'bg-white text-black' 
                                                                        : req.status === 'REJECTED' 
                                                                        ? 'bg-red-950 text-red-300 border border-red-800' 
                                                                        : 'bg-neutral-800 text-neutral-300'
                                                                }`}>
                                                                    {req.status}
                                                                </span>
                                                                <button className="bg-neutral-800 hover:bg-white hover:text-black text-white px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all">
                                                                    {t.overviewTab.placeBidBtn}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right 1 Column: Live Karnataka Mandi Rates Ticker */}
                                    <div className="space-y-6">
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{t.overviewTab.apmcTelemetry}</span>
                                                <span className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-white px-2 py-0.5 rounded">
                                                    {t.overviewTab.liveBenchmarks}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold uppercase text-white tracking-tight font-mono">
                                                {t.overviewTab.apmcRatesTitle}
                                            </h3>
                                            
                                            <div className="mt-4 space-y-2.5 font-mono text-xs">
                                                {(mandiRates.length > 0 ? mandiRates.slice(0, 5) : [
                                                    { commodity: isKannada ? 'ಹತ್ತಿ (ಬಿಟಿ)' : 'Cotton (Bunny/Bt)', marketName: isKannada ? 'ಹಾವೇರಿ ಎಪಿಎಂಸಿ' : 'Haveri APMC', modalPrice: 7450, changePercentage: '+2.1%' },
                                                    { commodity: isKannada ? 'ಟೊಮೆಟೊ (ಹೈಬ್ರಿಡ್)' : 'Tomato (Hybrid)', marketName: isKannada ? 'ಕೋಲಾರ ಎಪಿಎಂಸಿ' : 'Kolar APMC', modalPrice: 1850, changePercentage: '+5.4%' },
                                                    { commodity: isKannada ? 'ರಾಗಿ (ಕೆಂಪು)' : 'Finger Millet (Ragi)', marketName: isKannada ? 'ಮಂಡ್ಯ ಎಪಿಎಂಸಿ' : 'Mandya APMC', modalPrice: 3920, changePercentage: '+1.2%' },
                                                    { commodity: isKannada ? 'ಮೆಕ್ಕೆಜೋಳ (ಹಳದಿ)' : 'Maize (Yellow)', marketName: isKannada ? 'ದಾವಣಗೆರೆ ಎಪಿಎಂಸಿ' : 'Davanagere APMC', modalPrice: 2140, changePercentage: '-0.8%' },
                                                    { commodity: isKannada ? 'ಕಾಫಿ (ರೊಬಸ್ಟಾ)' : 'Coffee (Robusta)', marketName: isKannada ? 'ಚಿಕ್ಕಮಗಳೂರು' : 'Chikkamagaluru', modalPrice: 9800, changePercentage: '+3.0%' }
                                                ]).map((rate, i) => (
                                                    <div key={i} className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex justify-between items-center">
                                                        <div>
                                                            <div className="font-bold text-white uppercase">{rate.commodity}</div>
                                                            <div className="text-[10px] text-neutral-500">{rate.marketName}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-white font-bold">₹{rate.modalPrice.toLocaleString('en-IN')}/Q</div>
                                                            <div className={`text-[10px] ${rate.changePercentage.startsWith('+') ? 'text-white' : 'text-neutral-500'}`}>
                                                                {rate.changePercentage}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => setActiveTab('mandi_rates')}
                                                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl mt-4 transition-all"
                                            >
                                                {t.overviewTab.analyzeChartsBtn}
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}

                        {/* TAB 2: MARKETPLACE */}
                        {activeTab === 'marketplace' && (
                            <motion.div
                                key="marketplace-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-7xl mx-auto space-y-6"
                            >
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
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {allRequests.map((req) => (
                                            <div
                                                key={req.id}
                                                className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-600 transition-all flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <span className="text-lg font-bold text-white uppercase">{req.cropName}</span>
                                                            <div className="text-xs font-mono text-neutral-400 mt-0.5">
                                                                {t.overviewTab.farmerLabel}: {req.farmerName || (activeLanguage === Language.KN ? 'ಪರಿಶೀಲಿಸಿದ ರೈತರು' : 'Verified Producer')}
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
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
                                                            <span>{activeLanguage === Language.KN ? 'ಪ್ರಮಾಣ:' : 'Batch Volume:'}</span>
                                                            <span className="text-white font-bold">{req.quantity} {t.overviewTab.quintalsUnit}</span>
                                                        </div>
                                                        <div className="flex justify-between text-neutral-400">
                                                            <span>{t.overviewTab.askingRate}:</span>
                                                            <span className="text-white font-bold">₹{req.expectedPrice}/Q</span>
                                                        </div>
                                                        <div className="flex justify-between text-neutral-400">
                                                            <span>{t.overviewTab.location}:</span>
                                                            <span className="text-white font-bold">{req.location || 'Karnataka'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="w-full bg-white text-black font-mono font-bold text-xs uppercase py-2.5 rounded-xl hover:bg-neutral-200 transition-all"
                                                >
                                                    {t.marketplaceTab.bidNowBtn}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 3: MANDI RATES & CHARTS */}
                        {activeTab === 'mandi_rates' && (
                            <motion.div
                                key="mandi-rates-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-7xl mx-auto"
                            >
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <MarketplaceView
                                        texts={texts}
                                        currentLanguage={activeLanguage}
                                        onClose={() => setActiveTab('overview')}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 4: ORDERS (Real-Time Firestore Orders Collection Sync) */}
                        {activeTab === 'orders' && (
                            <motion.div
                                key="orders-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-7xl mx-auto space-y-6"
                            >
                                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono">
                                                {t.ordersTab.title}
                                            </h2>
                                            <p className="text-xs text-neutral-400 font-mono mt-1">
                                                {t.ordersTab.subtitle}
                                            </p>
                                        </div>
                                        <span className="text-xs font-mono bg-neutral-900 border border-neutral-800 text-white px-3 py-1 rounded-lg">
                                            {orders.length} {isKannada ? 'ಒಪ್ಪಂದಗಳು' : 'Contracts'}
                                        </span>
                                    </div>

                                    {orders.length === 0 ? (
                                        <div className="p-12 text-center border border-neutral-900 rounded-xl">
                                            <p className="text-neutral-500 font-mono text-xs">
                                                {t.ordersTab.noOrders}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 font-mono text-xs">
                                            {orders.map((ord) => (
                                                <div
                                                    key={ord.id}
                                                    className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-4 hover:border-neutral-700 transition-all"
                                                >
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-bold text-white uppercase">
                                                                    {ord.cropName}
                                                                </span>
                                                                <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                                                                    {ord.quantity} {t.overviewTab.quintalsUnit}
                                                                </span>
                                                                <span className="text-[10px] bg-neutral-950 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                                                                    #{ord.orderId}
                                                                </span>
                                                                <span className={`text-[10px] px-2.5 py-0.5 rounded uppercase font-bold ${
                                                                    ord.status === 'DELIVERED'
                                                                        ? 'bg-white text-black'
                                                                        : ord.status === 'DISPATCHED'
                                                                        ? 'bg-neutral-800 text-white border border-neutral-600'
                                                                        : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                                                                }`}>
                                                                    {ord.status === 'CONFIRMED' && t.ordersTab.statusConfirmed}
                                                                    {ord.status === 'DISPATCHED' && t.ordersTab.statusDispatched}
                                                                    {ord.status === 'DELIVERED' && t.ordersTab.statusDelivered}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-neutral-400 mt-1">
                                                                {t.ordersTab.farmer}: {ord.farmerName || 'Producer'} • {t.ordersTab.rate}: ₹{ord.ratePerQuintal}/Q • {t.ordersTab.weighbridgeId}: {ord.weighbridgeReceiptId}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 self-end md:self-auto">
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-white">
                                                                    ₹{ord.totalAmount.toLocaleString('en-IN')}
                                                                </div>
                                                                <div className="text-[10px] text-neutral-500">
                                                                    {t.ordersTab.zeroFeeTag}
                                                                </div>
                                                            </div>

                                                            {ord.status === 'CONFIRMED' && (
                                                                <button
                                                                    onClick={() => handleUpdateOrderStatus(ord.id, 'DISPATCHED')}
                                                                    className="bg-neutral-800 hover:bg-neutral-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                                                                >
                                                                    {t.ordersTab.markDispatched}
                                                                </button>
                                                            )}

                                                            {ord.status === 'DISPATCHED' && (
                                                                <button
                                                                    onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                                                                    className="bg-white text-black hover:bg-neutral-200 px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                                                                >
                                                                    {t.ordersTab.markDelivered}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Timeline */}
                                                    {ord.timeline && ord.timeline.length > 0 && (
                                                        <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap gap-4 text-[10px] text-neutral-500">
                                                            {ord.timeline.map((step, idx) => (
                                                                <div key={idx} className="flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                                    <span className="text-neutral-300 font-bold uppercase">{step.status}</span>
                                                                    <span>• {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    {step.note && <span className="text-neutral-500">({step.note})</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </main>
            </div>

            {/* 3. Negotiation Modal with Farmer */}
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
                                    {selectedRequest.quantity} {t.overviewTab.quintalsUnit} • {t.negotiationModal.farmerAsking}: ₹{selectedRequest.expectedPrice}/Q
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

                        <div className="p-3 border-t border-neutral-900 flex flex-col gap-2 bg-neutral-950">
                            <div className="flex gap-2">
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
                                    className="bg-neutral-800 hover:bg-neutral-700 text-white font-mono font-bold text-xs uppercase px-3 py-2 rounded-xl transition-all"
                                >
                                    {t.negotiationModal.sendBtn}
                                </button>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-neutral-900">
                                <input
                                    type="number"
                                    value={offerRate}
                                    onChange={(e) => setOfferRate(e.target.value)}
                                    placeholder={`${activeLanguage === Language.KN ? 'ಅಂತಿಮ ದರ' : 'Final Rate'} (e.g. ${selectedRequest.expectedPrice})`}
                                    className="w-1/2 bg-neutral-900 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs font-mono"
                                />
                                <button
                                    onClick={handleApproveDeal}
                                    className="w-1/2 bg-white text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <span>{t.negotiationModal.confirmDeal}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default BuyerDashboard;
