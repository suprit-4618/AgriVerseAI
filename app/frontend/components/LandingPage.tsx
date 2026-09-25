import React from 'react';
import { UIStringContent, Language, UserProfile, UserRole } from '../types';
import { 
    ArrowRightIcon, 
    SparklesIcon, 
    LayersIcon, 
    ArrowRightOnRectangleIcon, 
    UserCircleIcon, 
    ArrowUpRightIcon, 
    DocumentTextIcon 
} from './common/IconComponents';
import StaticLogo from './common/StaticLogo';
import LanguageToggle from './common/LanguageToggle';
import NotificationCenter from './NotificationCenter';
import ScrollExpandMedia from './ui/scroll-expansion-hero';
import FarmerStorySection from './landing/FarmerStorySection';
import WorksWheel from './ui/works-wheel';
import { useLanguage } from '../context/LanguageContext';

type Page = 'home' | 'about' | 'careers' | 'contact' | 'privacy' | 'terms' | 'admin_dashboard' | 'buyer_dashboard';

interface LandingPageProps {
    texts?: UIStringContent;
    onEnterApp: () => void;
    currentLanguage?: Language;
    setCurrentLanguage?: (lang: Language) => void;
    onWeatherClick: () => void;
    onAssistantClick: () => void;
    onPlantAnalysisClick: () => void;
    onSoilAnalysisClick: () => void;
    onMarketplaceClick: () => void;
    onLogout: () => void;
    onProfileClick: () => void;
    onNavigate: (page: Page) => void;
    onSellCropClick?: () => void;
    onMyRequestsClick?: () => void;
    user?: UserProfile;
}

const LandingPage: React.FC<LandingPageProps> = (props) => {
    const { 
        onEnterApp, 
        onWeatherClick, 
        onAssistantClick, 
        onPlantAnalysisClick, 
        onSoilAnalysisClick, 
        onMarketplaceClick, 
        onLogout, 
        onProfileClick, 
        onNavigate, 
        onSellCropClick, 
        onMyRequestsClick, 
        user 
    } = props;

    const { landingTexts: t, language: currentLanguage, setLanguage: setCurrentLanguage, isKannada } = useLanguage();

    return (
        <div className="bg-black text-white min-h-screen selection:bg-white selection:text-black">
            {/* Crisp High-Contrast Monochrome Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 border-b border-neutral-800 backdrop-blur-md">
                <div className="w-full px-4 sm:px-8 lg:px-10 h-16 flex justify-between items-center">
                    <StaticLogo />
                    <div className="flex items-center gap-2 sm:gap-3">
                        <LanguageToggle currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} size="sm" />
                        
                        <button
                            onClick={onAssistantClick}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-mono font-bold px-3.5 py-1.5 rounded-lg transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                        >
                            <SparklesIcon className="w-3.5 h-3.5 text-white" />
                            <span>{t.tryBhoomi}</span>
                        </button>

                        {user && <NotificationCenter user={user} />}
                        
                        {user && (user.role === UserRole.ADMIN || user.role === UserRole.BUYER) && (
                            <button 
                                onClick={() => onNavigate(user.role === UserRole.ADMIN ? 'admin_dashboard' : 'buyer_dashboard')} 
                                className="bg-white text-black hover:bg-neutral-200 font-mono font-bold px-3.5 py-1.5 rounded-lg transition-all text-xs tracking-wider uppercase flex items-center gap-1.5"
                            >
                                <LayersIcon className="w-4 h-4" /> {t.dashboard}
                            </button>
                        )}
                        
                        {onMyRequestsClick && (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.BUYER)) && (
                            <button 
                                onClick={onMyRequestsClick} 
                                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-mono font-semibold px-3.5 py-1.5 rounded-lg transition-all text-xs tracking-wider uppercase hidden sm:flex items-center gap-1.5"
                            >
                                <DocumentTextIcon className="w-4 h-4" /> {t.myRequests}
                            </button>
                        )}
                        
                        {onSellCropClick && (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.BUYER)) && (
                            <button 
                                onClick={onSellCropClick} 
                                className="bg-white text-black hover:bg-neutral-200 font-mono font-bold px-3.5 py-1.5 rounded-lg transition-all text-xs tracking-wider uppercase flex items-center gap-1.5"
                            >
                                <ArrowUpRightIcon className="w-4 h-4" /> {t.sellCrop}
                            </button>
                        )}
                        
                        {user ? (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={onProfileClick} 
                                    title="Profile" 
                                    className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-colors"
                                >
                                    <UserCircleIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={onLogout} 
                                    title="Logout" 
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-colors text-xs font-mono font-bold uppercase tracking-wider"
                                >
                                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                    <span className="hidden md:inline">{t.logout}</span>
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={onEnterApp} 
                                className="bg-white text-black font-mono font-bold px-4 py-1.5 rounded-lg hover:bg-neutral-200 transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 group shadow-sm"
                            >
                                <span>{t.loginRegister}</span>
                                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-0">
                {/* 1. Scroll Expansion Hero Section */}
                <ScrollExpandMedia
                    mediaType="image"
                    bgImageSrc="/hero-bg.jpg"
                    mediaSrc="/hero-cotton.jpg"
                    title={t.appName}
                    date={t.tagline}
                    scrollToExpand={t.scrollToExpand}
                >
                    {/* Post-Scroll Expansion Action Center */}
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto pt-6 pb-12">
                        <div className="inline-block px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-xs font-mono uppercase tracking-widest text-neutral-400 mb-6">
                            {t.heroBadge}
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-white mb-6">
                            {t.heroTitle}
                        </h2>
                        <p className="text-neutral-400 text-base md:text-lg max-w-2xl leading-relaxed mb-8">
                            {t.heroSubtitle}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button 
                                onClick={onEnterApp} 
                                className="bg-white text-black font-mono font-bold px-8 py-3.5 rounded-xl hover:bg-neutral-200 transition-all text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 transform hover:-translate-y-0.5"
                            >
                                <span>{t.enterPlatform}</span>
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={onMarketplaceClick} 
                                className="bg-neutral-900 text-white border border-neutral-700 font-mono font-semibold px-8 py-3.5 rounded-xl hover:bg-neutral-800 transition-all text-xs uppercase tracking-wider"
                            >
                                {t.exploreMarketplace}
                            </button>
                        </div>
                    </div>
                </ScrollExpandMedia>

                {/* 2. Deeply Personal Karnataka Farmer Story Mode (The Ground Crisis) */}
                <FarmerStorySection onEnterApp={onEnterApp} />

                {/* 3. 3D Works Wheel Feature Showcase (Showcase of 6 User-Facing Capabilities) */}
                <WorksWheel />
            </main>

            {/* Clean Monochrome Footer */}
            <footer className="bg-black border-t border-neutral-900 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mb-12">
                        <div className="lg:col-span-1">
                            <StaticLogo />
                            <p className="mt-4 text-neutral-400 text-xs leading-relaxed max-w-xs">
                                {isKannada 
                                    ? "ಸ್ವಾಯತ್ತ ನಿಖರ ಕೃಷಿ ಮತ್ತು ನೇರ ವ್ಯಾಪಾರ ವೇದಿಕೆ."
                                    : "Autonomous Precision Agriculture and Fair-Trade Marketplace Platform."
                                }
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-3 font-mono text-xs">
                            <div>
                                <h4 className="font-bold uppercase tracking-widest text-neutral-300 mb-4">{t.modules}</h4>
                                <ul className="space-y-2 text-neutral-400">
                                    <li><button onClick={onWeatherClick} className="hover:text-white transition">{t.liveWeather}</button></li>
                                    <li><button onClick={onSoilAnalysisClick} className="hover:text-white transition">{t.soilDiagnostics}</button></li>
                                    <li><button onClick={onPlantAnalysisClick} className="hover:text-white transition">{t.plantPathologies}</button></li>
                                    <li><button onClick={onMarketplaceClick} className="hover:text-white transition">{t.directMandi}</button></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold uppercase tracking-widest text-neutral-300 mb-4">{t.company}</h4>
                                <ul className="space-y-2 text-neutral-400">
                                    <li><button onClick={() => onNavigate('about')} className="hover:text-white transition">{t.aboutUs}</button></li>
                                    <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition">{t.contact}</button></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold uppercase tracking-widest text-neutral-300 mb-4">{t.legal}</h4>
                                <ul className="space-y-2 text-neutral-400">
                                    <li><button onClick={() => onNavigate('privacy')} className="hover:text-white transition">{t.privacyPolicy}</button></li>
                                    <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition">{t.termsOfService}</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-neutral-900 text-center text-xs text-neutral-500 font-mono">
                        <p>&copy; {new Date().getFullYear()} {t.copyright}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
