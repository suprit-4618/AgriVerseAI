import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { UIStringContent, Language, UserProfile, UserRole } from '../types';
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, ThermometerIcon, BugIcon, LayersIcon, ArrowRightOnRectangleIcon, UserCircleIcon, BuildingIcon, ArrowUpRightIcon, DocumentTextIcon } from './common/IconComponents';
import StaticLogo from './common/StaticLogo';
import LanguageToggle from './common/LanguageToggle';
import NotificationCenter from './NotificationCenter';

type Page = 'home' | 'about' | 'careers' | 'contact' | 'privacy' | 'terms' | 'admin_dashboard' | 'buyer_dashboard';

interface LandingPageProps {
    texts: UIStringContent;
    onEnterApp: () => void;
    currentLanguage: Language;
    setCurrentLanguage: (lang: Language) => void;
    onWeatherClick: () => void;
    onAssistantClick: () => void;
    onPlantAnalysisClick: () => void;
    onSoilAnalysisClick: () => void;
    onMarketplaceClick: () => void;
    onLogout: () => void;
    onProfileClick: () => void;
    onNavigate: (page: Page) => void;
    onSellCropClick?: () => void; // New Prop
    onMyRequestsClick?: () => void;
    user?: UserProfile;
}

const landingFeatures = [
    {
        title: 'landing_feature1_title',
        description: 'landing_feature1_desc',
        Icon: ThermometerIcon,
        action: 'onWeatherClick',
        image: 'https://images.unsplash.com/photo-1590112328822-261f9543e129?q=80&w=2535&auto=format&fit=crop'
    },
    {
        title: 'landing_feature2_title',
        description: 'landing_feature2_desc',
        Icon: LayersIcon,
        action: 'onSoilAnalysisClick',
        image: 'https://images.unsplash.com/photo-1591194661549-07d0d183c13d?q=80&w=2670&auto=format&fit=crop'
    },
    {
        title: 'landing_feature3_title',
        description: 'landing_feature3_desc',
        Icon: SparklesIcon,
        action: 'onAssistantClick',
        image: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=2670&auto=format&fit=crop'
    },
    {
        title: 'landing_feature4_title',
        description: 'landing_feature4_desc',
        Icon: BugIcon,
        action: 'onPlantAnalysisClick',
        image: 'https://images.unsplash.com/photo-1628791039322-1e79b76a6b10?q=80&w=2574&auto=format&fit=crop'
    },
    {
        title: 'landing_feature5_title',
        description: 'landing_feature5_desc',
        Icon: BuildingIcon,
        action: 'onMarketplaceClick',
        image: 'https://images.unsplash.com/photo-1612676532892-3c24a2d8af14?q=80&w=2670&auto=format&fit=crop'
    }
];

const ChatFab: React.FC<{ onAssistantClick: () => void; texts: UIStringContent; }> = ({ onAssistantClick, texts }) => {
    return (
        <motion.div
            className="fixed bottom-8 right-8 z-50 group"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20, delay: 1.5 } }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            aria-label="Open Bhoomi AI Assistant"
        >
            <div className="relative">
                <button
                    onClick={onAssistantClick}
                    className="bg-green-600 text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-gray-900 focus:ring-green-500 transition-all"
                >
                    <SparklesIcon className="w-8 h-8" />
                </button>
                <div className="absolute right-full mr-4 bottom-1/2 translate-y-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {texts.landing_cta_dashboard}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-800 transform rotate-45 -translate-x-1"></div>
                </div>
            </div>
        </motion.div>
    );
};


const LandingPage: React.FC<LandingPageProps> = (props) => {
    const { texts, onEnterApp, currentLanguage, setCurrentLanguage, onWeatherClick, onAssistantClick, onPlantAnalysisClick, onSoilAnalysisClick, onMarketplaceClick, onLogout, onProfileClick, onNavigate, onSellCropClick, onMyRequestsClick, user } = props;
    const [hoveredFeature, setHoveredFeature] = useState(0);

    const getAction = (actionName: string) => {
        const actions: { [key: string]: () => void } = {
            onWeatherClick,
            onSoilAnalysisClick,
            onAssistantClick,
            onPlantAnalysisClick,
            onMarketplaceClick
        };
        return actions[actionName];
    }

    const whyChooseUsItems = [
        { title: texts.why_choose_us_1_title, desc: texts.why_choose_us_1_desc, Icon: LayersIcon },
        { title: texts.why_choose_us_2_title, desc: texts.why_choose_us_2_desc, Icon: SparklesIcon },
        { title: texts.why_choose_us_3_title, desc: texts.why_choose_us_3_desc, Icon: ShieldCheckIcon },
    ];

    const heroVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" }
        })
    };

    return (
        <div className="bg-gray-900 font-poppins text-gray-200">

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/50 backdrop-blur-lg border-b border-gray-700/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <StaticLogo />
                    <div className="flex items-center gap-2 sm:gap-4">
                        <LanguageToggle currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} size="sm" />
                        {user && <NotificationCenter user={user} />}
                        {user && (user.role === UserRole.ADMIN || user.role === UserRole.BUYER) && (
                            <button onClick={() => onNavigate(user.role === UserRole.ADMIN ? 'admin_dashboard' : 'buyer_dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20">
                                <LayersIcon className="w-4 h-4" /> Dashboard
                            </button>
                        )}
                        {onMyRequestsClick && (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.BUYER)) && (
                            <button onClick={onMyRequestsClick} className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm flex items-center gap-2 border border-gray-600 hidden sm:flex">
                                <DocumentTextIcon className="w-4 h-4" /> My Requests
                            </button>
                        )}
                        {onSellCropClick && (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.BUYER)) && (
                            <button onClick={onSellCropClick} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20">
                                <ArrowUpRightIcon className="w-4 h-4" /> Sell Crop
                            </button>
                        )}
                        <button onClick={onEnterApp} className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-green-700 transition-all text-sm flex items-center gap-2 group hidden sm:flex">
                            {texts.landing_cta_dashboard}
                            <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        {user ? (
                            <>
                                <button onClick={onProfileClick} title="Profile" className="p-2.5 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                                    <UserCircleIcon className="w-5 h-5" />
                                </button>
                                <button onClick={onLogout} title="Logout" className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 hover:text-white transition-colors">
                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                    <span className="hidden md:inline font-medium">Logout</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={onEnterApp} className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-green-700 transition-all text-sm flex items-center gap-2 group">
                                <span>Login</span>
                                <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative hero-bg h-screen flex items-center justify-center">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                        <motion.div
                            className="glassmorphism p-8 md:p-12 rounded-2xl inline-block"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        >
                            <motion.h1
                                variants={heroVariants} custom={1} initial="hidden" animate="visible"
                                className="text-4xl md:text-6xl font-extrabold leading-tight text-white"
                            >
                                {texts.landing_hero_title}
                            </motion.h1>
                            <motion.p
                                variants={heroVariants} custom={2} initial="hidden" animate="visible"
                                className="mt-4 max-w-2xl mx-auto text-gray-300 md:text-lg"
                            >
                                {texts.landing_hero_subtitle}
                            </motion.p>
                            <motion.div
                                variants={heroVariants} custom={3} initial="hidden" animate="visible"
                                className="mt-8 flex gap-4 justify-center"
                            >
                                <button onClick={onEnterApp} className="bg-green-500 text-white font-bold px-8 py-3 rounded-full hover:bg-green-600 transition-all shadow-lg text-lg transform hover:scale-105">
                                    Get Started
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 sm:py-32 bg-gray-900 border-t border-b border-gray-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gradient-green-blue">{texts.landing_features_title}</h2>
                            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">{texts.landing_features_subtitle}</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
                            <div className="relative h-96 lg:h-[32rem] rounded-2xl overflow-hidden shadow-2xl">
                                <AnimatePresence>
                                    <motion.div
                                        key={hoveredFeature}
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${landingFeatures[hoveredFeature].image})` }}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    />
                                </AnimatePresence>
                                <div className="absolute inset-0 bg-black/40"></div>
                            </div>
                            <div className="flex flex-col gap-4">
                                {landingFeatures.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        className="relative p-6 rounded-xl cursor-pointer transition-all duration-300"
                                        onMouseEnter={() => setHoveredFeature(index)}
                                        onClick={getAction(feature.action)}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, amount: 0.5 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        {hoveredFeature === index && (
                                            <motion.div
                                                layoutId="feature-background"
                                                className="absolute inset-0 bg-gray-800/70 rounded-xl"
                                                initial={false}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <div className="relative flex items-center gap-5">
                                            <div className={`p-3 rounded-lg transition-colors duration-300 ${hoveredFeature === index ? 'bg-green-500' : 'bg-gray-700'}`}>
                                                <feature.Icon className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{texts[feature.title as keyof UIStringContent] as string}</h3>
                                                <p className="text-gray-400">{texts[feature.description as keyof UIStringContent] as string}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section className="py-20 sm:py-32 bg-black">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gradient-green-blue">{texts.why_choose_us_title}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {whyChooseUsItems.map((item, index) => (
                                <motion.div
                                    key={index}
                                    className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{ duration: 0.6, delay: index * 0.15 }}
                                >
                                    <motion.div
                                        className="inline-block p-4 bg-gray-800 rounded-full mb-6"
                                        whileHover={{ scale: 1.1, rotate: 10 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <item.Icon className="w-8 h-8 text-green-400" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-gray-400">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-black border-t border-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1">
                            <StaticLogo />
                            <p className="mt-4 text-gray-400 text-sm max-w-xs">{texts.landing_hero_subtitle}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-3">
                            <div>
                                <h4 className="font-semibold text-white mb-4">Features</h4>
                                <ul className="space-y-3">
                                    <li><button onClick={onWeatherClick} className="text-gray-400 hover:text-green-400 transition">Weather</button></li>
                                    <li><button onClick={onSoilAnalysisClick} className="text-gray-400 hover:text-green-400 transition">Soil Analysis</button></li>
                                    <li><button onClick={onPlantAnalysisClick} className="text-gray-400 hover:text-green-400 transition">Plant Disease</button></li>
                                    <li><button onClick={onMarketplaceClick} className="text-gray-400 hover:text-green-400 transition">Marketplace</button></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-4">Company</h4>
                                <ul className="space-y-3">
                                    <li><button onClick={() => onNavigate('about')} className="text-gray-400 hover:text-green-400 transition">About Us</button></li>
                                    <li><button onClick={() => onNavigate('careers')} className="text-gray-400 hover:text-green-400 transition">Careers</button></li>
                                    <li><button onClick={() => onNavigate('contact')} className="text-gray-400 hover:text-green-400 transition">Contact</button></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-4">Legal</h4>
                                <ul className="space-y-3">
                                    <li><button onClick={() => onNavigate('privacy')} className="text-gray-400 hover:text-green-400 transition">Privacy Policy</button></li>
                                    <li><button onClick={() => onNavigate('terms')} className="text-gray-400 hover:text-green-400 transition">Terms of Service</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} AgriVerseAI. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>

            <ChatFab onAssistantClick={onAssistantClick} texts={texts} />
        </div>
    );
};

export default LandingPage;
