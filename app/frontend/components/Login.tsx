import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../services/firebaseClient';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, UserRole, Language } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, GoogleIcon } from './common/IconComponents';
import LandingPage from './LandingPage';
import { uiStrings } from '../constants';
import LanguageToggle from './common/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

import BhoomiAssistant from './BhoomiAssistant';

interface LoginProps {
    onLoginSuccess: (user: UserProfile) => void;
}

type ViewState = 'intro' | 'role-selection' | 'buyer' | 'seller';
type AuthMode = 'login' | 'signup';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const { language: currentLanguage, setLanguage: setCurrentLanguage, texts, authTexts: t, isKannada } = useLanguage();

    const [view, setView] = useState<ViewState>('intro');
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [isDemoAssistantOpen, setIsDemoAssistantOpen] = useState(false);

    // Form States
    const [identifier, setIdentifier] = useState(''); // Email or Phone Number for login
    const [email, setEmail] = useState('');           // Email for signup
    const [phoneNumber, setPhoneNumber] = useState(''); // Phone for signup
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        // Clear forms on view change
        setIdentifier('');
        setEmail('');
        setPhoneNumber('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setStatusMessage(null);
    }, [view, authMode]);

    const getRoleString = (currentView: ViewState): string => {
        switch (currentView) {
            case 'buyer': return 'buyer';
            case 'seller': return 'seller';
            default: return 'user';
        }
    };

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

    const handleRoleSelect = (role: ViewState) => {
        setView(role);
        if (role === 'buyer' || role === 'seller') {
            const portalRole = getRoleString(role);
            sessionStorage.setItem('ava_active_portal_role', portalRole);
            localStorage.setItem('ava_active_portal_role', portalRole);
        }
    };

    // Listen for auth state changes from Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    const savedPortal = sessionStorage.getItem('ava_active_portal_role') || localStorage.getItem('ava_active_portal_role');
                    const activePortalRole = (view === 'buyer' || view === 'seller') 
                        ? getRoleString(view) 
                        : (savedPortal || 'user');

                    let userRole = activePortalRole;
                    let fullName = user.displayName || 'User';
                    let details = {};
                    let location = 'Karnataka, India';
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (view !== 'buyer' && view !== 'seller') {
                            userRole = savedPortal || userData.lastActiveRole || userData.role || 'user';
                        }
                        fullName = userData.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : (userData.fullName || fullName);
                        details = userData.details || {};
                        location = userData.location || location;
                    }

                    setStatusMessage({ type: 'success', text: isKannada ? 'ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...' : 'Authenticated successfully. Redirecting...' });

                    setTimeout(() => {
                        onLoginSuccess({
                            id: user.uid,
                            email: user.email || '',
                            role: mapRoleToUserRole(userRole),
                            fullName: fullName,
                            location: location,
                            details: details
                        });
                    }, 400);
                } catch (err) {
                    console.error("Error fetching user profile:", err);
                }
            }
        });

        return () => unsubscribe();
    }, [view, isKannada]);

    // Standard Sign In (Accepts either Email or Mobile Number + Password)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage(null);

        const currentPortalRole = getRoleString(view);
        sessionStorage.setItem('ava_active_portal_role', currentPortalRole);
        localStorage.setItem('ava_active_portal_role', currentPortalRole);

        try {
            let targetEmail = identifier.trim();

            // If user entered a 10-digit mobile number, resolve it to their registered email
            const cleanDigits = targetEmail.replace(/\D/g, '');
            if (cleanDigits.length === 10 && !targetEmail.includes('@')) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('phone', '==', cleanDigits));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    targetEmail = snap.docs[0].data().email || targetEmail;
                } else {
                    targetEmail = `${cleanDigits}@phone.agriverse.ai`;
                }
            }

            const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
            const user = userCredential.user;

            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        email: user.email,
                        role: currentPortalRole,
                        lastActiveRole: currentPortalRole,
                        first_name: '',
                        last_name: '',
                        location: 'Karnataka, India',
                        details: {}
                    });
                } else {
                    await setDoc(userDocRef, {
                        lastActiveRole: currentPortalRole
                    }, { merge: true });
                }

                setStatusMessage({ type: 'success', text: isKannada ? 'ಸೈನ್ ಇನ್ ಯಶಸ್ವಿಯಾಗಿದೆ! ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...' : 'Login successful! Redirecting...' });
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setStatusMessage({ type: 'error', text: t.invalidCredentials });
            setIsLoading(false);
        }
    };

    // Standard Registration (First Name, Last Name, Phone, Email, Password)
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage(null);

        const currentPortalRole = getRoleString(view);
        sessionStorage.setItem('ava_active_portal_role', currentPortalRole);
        localStorage.setItem('ava_active_portal_role', currentPortalRole);

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone && cleanPhone.length !== 10) {
            setStatusMessage({ type: 'error', text: t.validPhoneError });
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;

            if (user) {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    phone: cleanPhone || '',
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    role: currentPortalRole,
                    lastActiveRole: currentPortalRole,
                    location: 'Karnataka, India',
                    createdAt: new Date().toISOString(),
                    details: {}
                });

                setStatusMessage({ type: 'success', text: isKannada ? 'ಖಾತೆ ನೋಂದಾಯಿಸಲಾಗಿದೆ! ಪ್ರವೇಶಿಸಲಾಗುತ್ತಿದೆ...' : 'Account registered! Entering dashboard...' });
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            if (error.code === 'auth/email-already-in-use') {
                setStatusMessage({ type: 'error', text: t.emailInUseError });
            } else {
                setStatusMessage({ type: 'error', text: error.message || 'Failed to create account.' });
            }
            setIsLoading(false);
        }
    };

    // Google 1-Click Sign-In
    const handleGoogleLogin = async () => {
        const currentRole = getRoleString(view);
        sessionStorage.setItem('ava_active_portal_role', currentRole);
        localStorage.setItem('ava_active_portal_role', currentRole);
        setStatusMessage({ type: 'success', text: isKannada ? 'ಗೂಗಲ್ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...' : 'Connecting to Google...' });
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (!userDoc.exists()) {
                     await setDoc(userDocRef, {
                         email: user.email,
                         role: currentRole,
                         lastActiveRole: currentRole,
                         first_name: user.displayName?.split(' ')[0] || '',
                         last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
                         location: 'Karnataka, India',
                         createdAt: new Date().toISOString(),
                         details: {}
                     });
                } else {
                    await setDoc(userDocRef, {
                        lastActiveRole: currentRole
                    }, { merge: true });
                }
            }
        } catch (error: any) {
            setStatusMessage({ type: 'error', text: error.message || 'Google sign-in was cancelled or failed.' });
        }
    };

    // View 1: Public Landing Page
    if (view === 'intro') {
        return (
            <div className="relative min-h-screen">
                <LandingPage
                    texts={texts}
                    onEnterApp={() => setView('role-selection')}
                    currentLanguage={currentLanguage}
                    setCurrentLanguage={setCurrentLanguage}
                    onWeatherClick={() => setView('role-selection')}
                    onAssistantClick={() => setIsDemoAssistantOpen(true)}
                    onPlantAnalysisClick={() => setView('role-selection')}
                    onSoilAnalysisClick={() => setView('role-selection')}
                    onMarketplaceClick={() => setView('role-selection')}
                    onLogout={() => { }}
                    onProfileClick={() => setView('role-selection')}
                    onNavigate={() => { }}
                    user={undefined}
                />

                {/* Free Demo Bhoomi Assistant Modal for Unauthenticated Guests */}
                <AnimatePresence>
                    {isDemoAssistantOpen && (
                        <motion.div
                            key="bhoomi-demo-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                className="w-full max-w-5xl h-[90vh] bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative"
                            >
                                <BhoomiAssistant
                                    user={{
                                        id: 'guest',
                                        email: '',
                                        role: UserRole.USER,
                                        fullName: isKannada ? 'ರೈತರು' : 'Guest Farmer',
                                        location: 'Karnataka, India',
                                        details: {}
                                    }}
                                    currentLanguage={currentLanguage}
                                    setCurrentLanguage={setCurrentLanguage}
                                    isDemoMode={true}
                                    onRequireAuth={() => {
                                        setIsDemoAssistantOpen(false);
                                        setView('role-selection');
                                    }}
                                    onClose={() => setIsDemoAssistantOpen(false)}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // View 2: Monochrome Role Selection
    if (view === 'role-selection') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden font-sans selection:bg-white selection:text-black">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-neutral-900/40 rounded-full blur-[140px] pointer-events-none" />

                <header className="w-full flex justify-between items-center relative z-20">
                    <button 
                        onClick={() => setView('intro')}
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors bg-neutral-950 border border-neutral-800 px-3.5 py-2 rounded-lg"
                    >
                        <ArrowLeftIcon className="w-3.5 h-3.5" />
                        <span>{t.backToHome}</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase hidden sm:inline">
                            AGRIVERSE AI
                        </span>
                        <LanguageToggle currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} size="sm" />
                    </div>
                </header>

                <main className="w-full max-w-5xl mx-auto my-auto py-10 relative z-20 flex flex-col items-center">
                    <div className="text-center max-w-2xl mb-12">
                        <div className="inline-block px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-4">
                            {t.portalAccess}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-3">
                            {t.selectYourRole}
                        </h1>
                        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                            {t.selectRoleDesc}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {/* Farmer Card */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            onClick={() => handleRoleSelect('seller')}
                            className="group relative bg-neutral-950 border border-neutral-800 hover:border-white rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-2xl hover:shadow-white/5"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 group-hover:border-neutral-700">
                                        {t.producerTag}
                                    </span>
                                    <span className="text-xs font-mono text-neutral-500 group-hover:text-white transition-colors">
                                        #01
                                    </span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mb-2">
                                    {t.farmerCultivator}
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6 font-mono">
                                    {t.farmerCardDesc}
                                </p>

                                <div className="space-y-2.5 pt-4 border-t border-neutral-900 text-xs text-neutral-300">
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-white shrink-0" />
                                        <span>{t.farmerFeature1}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-white shrink-0" />
                                        <span>{t.farmerFeature2}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-white shrink-0" />
                                        <span>{t.farmerFeature3}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-white shrink-0" />
                                        <span>{t.farmerFeature4}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4">
                                <div className="w-full bg-white text-black group-hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-between transition-all">
                                    <span>{t.enterFarmerPortal}</span>
                                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Buyer Card */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            onClick={() => handleRoleSelect('buyer')}
                            className="group relative bg-neutral-950 border border-neutral-800 hover:border-white rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-2xl hover:shadow-white/5"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 group-hover:border-neutral-700">
                                        {t.buyerTag}
                                    </span>
                                    <span className="text-xs font-mono text-neutral-500 group-hover:text-white transition-colors">
                                        #02
                                    </span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mb-2">
                                    {t.buyerTrader}
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6 font-mono">
                                    {t.buyerCardDesc}
                                </p>

                                <div className="space-y-2.5 pt-4 border-t border-neutral-900 text-xs text-neutral-300">
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-white shrink-0" />
                                        <span>{t.buyerFeature1}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-white shrink-0" />
                                        <span>{t.buyerFeature2}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-white shrink-0" />
                                        <span>{t.buyerFeature3}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-white shrink-0" />
                                        <span>{t.buyerFeature4}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4">
                                <div className="w-full bg-white text-black group-hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-between transition-all">
                                    <span>{t.enterBuyerPortal}</span>
                                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        );
    }

    // View 3: Clean, Professional Monochrome Auth Form (Sign In / Register)
    const isBuyer = view === 'buyer';
    const roleTitle = isBuyer ? t.buyerTrader : t.farmerCultivator;
    const roleBadge = isBuyer ? t.buyerPortalBadge : t.farmerPortalBadge;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden font-sans selection:bg-white selection:text-black">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-neutral-900/30 rounded-full blur-[130px] pointer-events-none" />

            <header className="w-full flex justify-between items-center relative z-20">
                <button 
                    onClick={() => setView('role-selection')}
                    className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors bg-neutral-950 border border-neutral-800 px-3.5 py-2 rounded-lg"
                >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    <span>{t.switchRole}</span>
                </button>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase hidden sm:inline">
                        AGRIVERSE AI
                    </span>
                    <LanguageToggle currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} size="sm" />
                </div>
            </header>

            <main className="w-full max-w-md mx-auto my-auto py-8 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl"
                >
                    {/* Role Header */}
                    <div className="text-center mb-6">
                        <div className="inline-block px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-mono uppercase tracking-widest text-neutral-300 mb-3">
                            {roleBadge}
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                            {authMode === 'login' ? t.signIn : t.register}
                        </h2>
                        <p className="text-xs text-neutral-400 font-mono mt-1">
                            {t.accessingAs} {roleTitle}
                        </p>
                    </div>

                    {/* Clean Professional Segmented Switcher: [ SIGN IN ] | [ REGISTER ] */}
                    <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800 flex mb-6">
                        <button
                            type="button"
                            onClick={() => { setAuthMode('login'); setStatusMessage(null); }}
                            className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                                authMode === 'login' 
                                    ? 'bg-white text-black shadow-md' 
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            {t.signIn}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('signup'); setStatusMessage(null); }}
                            className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                                authMode === 'signup' 
                                    ? 'bg-white text-black shadow-md' 
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            {t.register}
                        </button>
                    </div>

                    {/* Google 1-Click Sign-In */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 hover:border-neutral-600 font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2.5 transition-all mb-6"
                    >
                        <GoogleIcon className="w-4 h-4" />
                        <span>{t.continueWithGoogle}</span>
                    </button>

                    <div className="relative flex items-center justify-center mb-6">
                        <div className="border-t border-neutral-800 w-full" />
                        <span className="bg-neutral-950 px-3 text-[10px] font-mono uppercase tracking-widest text-neutral-500 absolute">
                            {t.orWithCredentials}
                        </span>
                    </div>

                    {/* 1. Sign In Form (Email or Mobile + Password) */}
                    {authMode === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                    {t.emailOrMobile}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="farmer@agriverse.ai or 9876543210"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                    {t.passwordLabel}
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
                                />
                            </div>

                            {statusMessage && (
                                <div className={`p-3 rounded-xl text-xs font-mono ${
                                    statusMessage.type === 'success'
                                        ? 'bg-neutral-900 text-white border border-neutral-700'
                                        : 'bg-red-950/40 text-red-300 border border-red-800'
                                }`}>
                                    {statusMessage.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading ? (
                                    <span className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4" />
                                ) : (
                                    <>
                                        <span>{t.signInBtn}</span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* 2. Registration Form */
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                        {t.firstNameLabel}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Basavaraj"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                        {t.lastNameLabel}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Patil"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                    {t.mobileLabel}
                                </label>
                                <div className="flex gap-2">
                                    <span className="bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-xs px-3 py-2.5 rounded-xl flex items-center shrink-0">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        placeholder="9876543210"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                    {t.emailLabel}
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="farmer@agriverse.ai"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                                    {t.passwordLabel}
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder={t.createPasswordPlaceholder}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600"
                                />
                            </div>

                            {statusMessage && (
                                <div className={`p-3 rounded-xl text-xs font-mono ${
                                    statusMessage.type === 'success'
                                        ? 'bg-neutral-900 text-white border border-neutral-700'
                                        : 'bg-red-950/40 text-red-300 border border-red-800'
                                }`}>
                                    {statusMessage.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading ? (
                                    <span className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4" />
                                ) : (
                                    <>
                                        <span>{t.registerBtn}</span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default Login;
