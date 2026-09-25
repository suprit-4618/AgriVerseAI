
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Language, UserRole } from './types';
import { auth, db } from './services/firebaseClient';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ... existing imports ...

import { useLanguage } from './context/LanguageContext';
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
import MyRequestsModal from './components/MyRequestsModal';
// Import new page components
import AboutPage from './components/pages/AboutPage';
import CareersPage from './components/pages/CareersPage';
import ContactPage from './components/pages/ContactPage';
import LegalPage from './components/pages/LegalPage';
import LoadingScreen from './components/LoadingScreen';
import AdminDashboard from './components/AdminDashboard';
import MarketDashboard from './components/MarketDashboard';
import FarmerDashboard from './components/farmer/FarmerDashboard';
import BuyerDashboard from './components/buyer/BuyerDashboard';

type Page = 'home' | 'about' | 'careers' | 'contact' | 'privacy' | 'terms' | 'admin_dashboard' | 'buyer_dashboard';

const App: React.FC = () => {
    const { language: currentLanguage, setLanguage: setCurrentLanguage, texts } = useLanguage();
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isAppLoading, setIsAppLoading] = useState(true); // Start loading true to check session
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
    const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
    const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
    const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
    const [isSellCropModalOpen, setIsSellCropModalOpen] = useState(false);
    const [isMyRequestsModalOpen, setIsMyRequestsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>('home');

    const [showProfileCreation, setShowProfileCreation] = useState(false);

    // Helper to map role string to UserRole enum
    const mapRoleToUserRole = (roleString?: string): UserRole => {
        switch (roleString?.toLowerCase()) {
            case 'buyer': return UserRole.BUYER;
            case 'seller': 
            case 'farmer':
            case 'user':
                return UserRole.USER;
            case 'admin': return UserRole.ADMIN;
            default: return UserRole.USER;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // Fetch user details from Firestore
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    const savedPortalRole = sessionStorage.getItem('ava_active_portal_role') || localStorage.getItem('ava_active_portal_role');
                    let userRole = savedPortalRole || 'user';
                    let fullName = user.displayName || 'User';
                    let details = {};
                    let location = 'Karnataka, India';
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        userRole = savedPortalRole || userData.lastActiveRole || userData.role || 'user';
                        fullName = userData.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : (userData.fullName || fullName);
                        details = userData.details || {};
                        location = userData.location || location;
                    }

                    const parsedRole = mapRoleToUserRole(userRole);
                    setCurrentUser({
                        id: user.uid,
                        email: user.email || '',
                        role: parsedRole,
                        fullName: fullName,
                        location: location,
                        details: details
                    });
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Error managing auth state:", error);
            } finally {
                setIsAppLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLoginSuccess = (user: UserProfile) => {
        setCurrentUser(user);
        setIsAppLoading(false);
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
            sessionStorage.removeItem('ava_active_portal_role');
            localStorage.removeItem('ava_active_portal_role');
            await firebaseSignOut(auth);
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
        setIsMyRequestsModalOpen(false);
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
        onMyRequestsClick: () => setIsMyRequestsModalOpen(true),
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

        if (currentPage === 'admin_dashboard' && currentUser.role === UserRole.ADMIN) {
            return <AdminDashboard user={currentUser} onLogout={handleLogout} onNavigate={setCurrentPage} />;
        }

        if (currentUser.role === UserRole.BUYER) {
            return (
                <BuyerDashboard 
                    user={currentUser} 
                    onLogout={handleLogout} 
                    onNavigate={setCurrentPage}
                    currentLanguage={currentLanguage}
                    setCurrentLanguage={setCurrentLanguage}
                />
            );
        }

        if (currentUser.role === UserRole.USER) {
            if (currentPage !== 'home') {
                return renderUserContent();
            }
            return (
                <FarmerDashboard 
                    user={currentUser} 
                    onLogout={handleLogout} 
                    onNavigate={setCurrentPage}
                    currentLanguage={currentLanguage}
                    setCurrentLanguage={setCurrentLanguage}
                />
            );
        }

        // Default Platform Content
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

            {/* Optional Profile Modal */}
            {currentUser && isProfileModalOpen && (
                <UserProfileComponent
                    user={currentUser}
                    onClose={() => setIsProfileModalOpen(false)}
                    texts={texts}
                    onUpdateUser={handleUpdateUser}
                />
            )}
        </div>
    );
};

export default App;
