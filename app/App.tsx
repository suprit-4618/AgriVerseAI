
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Language, UserRole } from './types';
import { supabase } from './services/supabaseClient.ts';

// ... existing imports ...

import LandingPage from './components/LandingPage';
import { uiStrings } from './constants';
import { XCircleIcon } from './components/common/IconComponents';
import WeatherView from './components/WeatherView';
import BhoomiAssistant from './components/BhoomiAssistant';
import PlantAnalysis from './components/PlantAnalysis';
import SoilAnalysis from './components/SoilAnalysis';
import Login from './components/Login';
import ProfileCreation from './components/ProfileCreation';
import UserProfileComponent from './components/UserProfile';
import MarketplaceView from './components/MarketplaceView';
import SellCropModal from './components/SellCropModal';
// Import new page components
import AboutPage from './components/pages/AboutPage';
import CareersPage from './components/pages/CareersPage';
import ContactPage from './components/pages/ContactPage';
import LegalPage from './components/pages/LegalPage';
import LoadingScreen from './components/LoadingScreen';
import AdminDashboard from './components/AdminDashboard';
import MarketDashboard from './components/MarketDashboard';

type Page = 'home' | 'about' | 'careers' | 'contact' | 'privacy' | 'terms';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isAppLoading, setIsAppLoading] = useState(true); // Start loading true to check session
    const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.EN);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
    const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
    const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
    const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
    const [isSellCropModalOpen, setIsSellCropModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>('home');

    const [showProfileCreation, setShowProfileCreation] = useState(false);

    const texts = uiStrings[currentLanguage];

    // Helper to map role string to UserRole enum
    const mapRoleToUserRole = (roleString: string): UserRole => {
        switch (roleString) {
            case 'buyer': return UserRole.BUYER;
            case 'seller': return UserRole.USER; // Mapping Seller to User/Farmer
            case 'admin': return UserRole.ADMIN;
            default: return UserRole.USER;
        }
    };

    useEffect(() => {
        const initializeSession = async () => {
            try {
                // Check for initial session
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Handle URL role param if present (e.g. returning from Google Login)
                    const params = new URLSearchParams(window.location.search);
                    const roleFromUrl = params.get('role');

                    let userRole = roleFromUrl || session.user.user_metadata.role || 'user';

                    // Update role if URL param dictates a change (and it's different)
                    if (roleFromUrl && session.user.user_metadata.role !== roleFromUrl) {
                        console.log(`Updating user role from ${session.user.user_metadata.role} to ${roleFromUrl}`);
                        await supabase.auth.updateUser({
                            data: { role: userRole }
                        });
                    }

                    const fullName = `${session.user.user_metadata.first_name || ''} ${session.user.user_metadata.last_name || ''}`.trim() || session.user.email || 'User';

                    setCurrentUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        role: mapRoleToUserRole(userRole),
                        fullName: fullName,
                        location: 'Karnataka, India',
                        details: session.user.user_metadata.details
                    });
                }
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                setIsAppLoading(false);
            }
        };

        initializeSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Handle URL role param if present (e.g. returning from Google Login)
                const params = new URLSearchParams(window.location.search);
                const roleFromUrl = params.get('role');

                let userRole = roleFromUrl || session.user.user_metadata.role || 'user';

                // Update role if URL param dictates a change (and it's different)
                if (roleFromUrl && session.user.user_metadata.role !== roleFromUrl) {
                    await supabase.auth.updateUser({
                        data: { role: userRole }
                    });
                }

                const fullName = `${session.user.user_metadata.first_name || ''} ${session.user.user_metadata.last_name || ''}`.trim() || session.user.email || 'User';

                setCurrentUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    role: mapRoleToUserRole(userRole),
                    fullName: fullName,
                    location: 'Karnataka, India',
                    details: session.user.user_metadata.details
                });
                setIsAppLoading(false);
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setIsAppLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLoginSuccess = (user: UserProfile) => {
        setCurrentUser(user);

        // Check if profile details are missing (Skip for Admin)
        // Temporarily bypassing profile creation for all users as per request
        if (false && user.role !== UserRole.ADMIN && (!user.details || Object.keys(user.details).length === 0)) {
            setShowProfileCreation(true);
            setIsAppLoading(false);
        } else {
            setIsAppLoading(true);
            // Simulate app setup, data fetching, etc.
            setTimeout(() => {
                setIsAppLoading(false);
                setCurrentPage('home');
            }, 2000);
        }
    };

    const handleProfileComplete = (updatedUser: UserProfile) => {
        setCurrentUser(updatedUser);
        setShowProfileCreation(false);
        setIsAppLoading(true);
        setTimeout(() => {
            setIsAppLoading(false);
            setCurrentPage('home');
        }, 1500);
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        }
        setCurrentUser(null);
        setCurrentPage('home');
        setShowProfileCreation(false);
        // Close all modals
        setIsWeatherModalOpen(false);
        setIsAssistantModalOpen(false);
        setIsPlantModalOpen(false);
        setIsSoilModalOpen(false);
        setIsProfileModalOpen(false);
        setIsMarketplaceModalOpen(false);
        setIsSellCropModalOpen(false);
    };

    const handleUpdateUser = (updatedUser: UserProfile) => {
        setCurrentUser(updatedUser);
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // For this app, dark is default and better looking. Let's force it.
        document.documentElement.classList.add('dark');
    }, [theme]);

    // Common Props
    const assistantProps = currentUser ? {
        user: currentUser,
        currentLanguage,
        setCurrentLanguage,
    } : undefined;

    const landingPageProps = {
        texts,
        onEnterApp: () => setIsAssistantModalOpen(true),
        currentLanguage,
        setCurrentLanguage,
        onWeatherClick: () => setIsWeatherModalOpen(true),
        onAssistantClick: () => setIsAssistantModalOpen(true),
        onPlantAnalysisClick: () => setIsPlantModalOpen(true),
        onSoilAnalysisClick: () => setIsSoilModalOpen(true),
        onMarketplaceClick: () => setIsMarketplaceModalOpen(true),
        onLogout: handleLogout,
        onProfileClick: () => setIsProfileModalOpen(true),
        onNavigate: (page: Page) => setCurrentPage(page),
        onSellCropClick: () => setIsSellCropModalOpen(true),
        user: currentUser || undefined,
    };

    const renderUserContent = () => {
        switch (currentPage) {
            case 'about':
                return <AboutPage onBack={() => setCurrentPage('home')} />;
            case 'careers':
                return <CareersPage onBack={() => setCurrentPage('home')} />;
            case 'contact':
                return <ContactPage onBack={() => setCurrentPage('home')} />;
            case 'privacy':
                return <LegalPage pageType="privacy" onBack={() => setCurrentPage('home')} />;
            case 'terms':
                return <LegalPage pageType="terms" onBack={() => setCurrentPage('home')} />;
            case 'home':
            default:
                return <LandingPage {...landingPageProps} />;
        }
    };

    // Main Render Logic based on Role
    const renderDashboard = () => {
        if (!currentUser) return null;

        if (currentUser.role === UserRole.ADMIN) {
            return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
        }

        if (currentUser.role === UserRole.BUYER) { // Market Login
            return <MarketDashboard user={currentUser} onLogout={handleLogout} />;
        }

        // Default User/Farmer Dashboard
        return renderUserContent();
    };


    return (
        <div className={`font-poppins min-h-screen ${!currentUser ? '' : 'bg-gray-900'}`}>
            <AnimatePresence mode="wait">
                {!currentUser ? (
                    <Login onLoginSuccess={handleLoginSuccess} />
                ) : showProfileCreation ? (
                    <motion.div
                        key="profile-creation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <ProfileCreation user={currentUser} onProfileComplete={handleProfileComplete} />
                    </motion.div>
                ) : isAppLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <LoadingScreen />
                    </motion.div>
                ) : (
                    <motion.div
                        key={`dashboard-${currentUser.role}-${currentPage}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {renderDashboard()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals - Only relevant for User/Farmer Role */}
            {currentUser?.role === UserRole.USER && (
                <AnimatePresence>
                    {isWeatherModalOpen && (
                        <motion.div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="w-full h-full relative"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }}
                                exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
                            >
                                <WeatherView texts={texts} currentLanguage={currentLanguage} />
                                <button
                                    onClick={() => setIsWeatherModalOpen(false)}
                                    className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors z-50"
                                    aria-label="Close weather"
                                >
                                    <XCircleIcon className="w-8 h-8" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {isAssistantModalOpen && assistantProps && (
                        <motion.div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden relative"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
                                exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                            >
                                <BhoomiAssistant {...assistantProps} />
                                <button
                                    onClick={() => setIsAssistantModalOpen(false)}
                                    className="absolute top-3 right-3 bg-gray-800/50 p-2 rounded-full text-gray-200 hover:bg-gray-700/70 hover:text-white transition-colors z-50"
                                    aria-label="Close assistant"
                                >
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {isSoilModalOpen && (
                        <motion.div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden relative"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
                                exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                            >
                                <SoilAnalysis texts={texts} />
                                <button
                                    onClick={() => setIsSoilModalOpen(false)}
                                    className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors z-50"
                                    aria-label="Close Soil Analysis"
                                >
                                    <XCircleIcon className="w-8 h-8" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {isPlantModalOpen && (
                        <motion.div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden relative"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
                                exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                            >
                                <PlantAnalysis texts={texts} currentLanguage={currentLanguage} />
                                <button
                                    onClick={() => setIsPlantModalOpen(false)}
                                    className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors z-50"
                                    aria-label="Close Plant Analysis"
                                >
                                    <XCircleIcon className="w-8 h-8" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {isMarketplaceModalOpen && (
                        <motion.div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden relative"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
                                exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                            >
                                <MarketplaceView texts={texts} onClose={() => setIsMarketplaceModalOpen(false)} currentLanguage={currentLanguage} />
                                <button
                                    onClick={() => setIsMarketplaceModalOpen(false)}
                                    className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors z-50"
                                    aria-label="Close Marketplace"
                                >
                                    <XCircleIcon className="w-8 h-8" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {isSellCropModalOpen && currentUser && (
                        <SellCropModal
                            onClose={() => setIsSellCropModalOpen(false)}
                            user={currentUser}
                            texts={texts}
                        />
                    )}

                    {isProfileModalOpen && currentUser && (
                        <UserProfileComponent
                            user={currentUser}
                            onClose={() => setIsProfileModalOpen(false)}
                            texts={texts}
                            onUpdateUser={handleUpdateUser}
                        />
                    )}
                </AnimatePresence>
            )}
        </div>
    );
};

export default App;
