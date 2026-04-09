import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../services/firebaseClient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile, UserRole, Language } from '../types';
import { BuildingIcon, UserCircleIcon, ShieldCheckIcon, ArrowLeftIcon, GoogleIcon } from './common/IconComponents';
import './Login.css';
import LandingPage from './LandingPage';
import { uiStrings } from '../constants';
import LanguageToggle from './common/LanguageToggle';

interface LoginProps {
    onLoginSuccess: (user: UserProfile) => void;
}

type ViewState = 'intro' | 'role-selection' | 'buyer' | 'seller' | 'admin';
type AuthMode = 'login' | 'signup';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [view, setView] = useState<ViewState>('intro');
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.EN);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const texts = uiStrings[currentLanguage];

    useEffect(() => {
        // Clear form when view changes
        setEmail('');
        setPassword('');
        setFirstName('');
        setMiddleName('');
        setLastName('');
        setStatusMessage(null);
        setAuthMode('login');
    }, [view]);

    useEffect(() => {
        // Listen for auth state changes from Firebase
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    let userRole = 'user';
                    let fullName = user.displayName || 'User';
                    let details = {};
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        userRole = userData.role || 'user';
                        fullName = userData.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : fullName;
                        details = userData.details || {};
                    }

                    setStatusMessage({ type: 'success', text: 'Login successful! Redirecting...' });

                    setTimeout(() => {
                        onLoginSuccess({
                            id: user.uid,
                            email: user.email || '',
                            role: mapRoleToUserRole(userRole),
                            fullName: fullName,
                            location: 'Karnataka, India',
                            details: details
                        });
                    }, 1000);
                } catch (err) {
                    console.error("Error fetching user role:", err);
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }, [view]);

    const handleRoleSelect = (role: ViewState) => {
        setView(role);
    };

    const handleBackToHome = () => {
        setView('role-selection');
    };

    const getRoleString = (view: ViewState): string => {
        switch (view) {
            case 'buyer': return 'buyer';
            case 'seller': return 'seller';
            case 'admin': return 'admin';
            default: return 'user';
        }
    };

    const mapRoleToUserRole = (roleString: string): UserRole => {
        switch (roleString) {
            case 'buyer': return UserRole.BUYER;
            case 'seller': return UserRole.USER;
            case 'admin': return UserRole.ADMIN;
            default: return UserRole.USER;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user) {
                setStatusMessage({ type: 'success', text: 'Login successful! Redirecting...' });

                const currentPortalRole = getRoleString(view);
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                let userData = userDoc.exists() ? userDoc.data() : null;
                
                if (!userData) {
                    if (currentPortalRole === 'admin') {
                        await auth.signOut();
                        throw new Error("Access denied. Admin accounts cannot be created this way.");
                    }
                    userData = { role: currentPortalRole, first_name: '', last_name: '', details: {} };
                    await setDoc(userDocRef, userData);
                }

                const storedRole = userData.role;

                if (storedRole !== currentPortalRole) {
                    await auth.signOut();
                    throw new Error(`Invalid portal. Please login via the ${storedRole.charAt(0).toUpperCase() + storedRole.slice(1)} portal.`);
                }

                const fullName = userData.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : (user.displayName || 'User');

                setTimeout(() => {
                    onLoginSuccess({
                        id: user.uid,
                        email: user.email || email,
                        role: mapRoleToUserRole(storedRole), // Use the stored role, not the portal role
                        fullName: fullName,
                        location: 'Karnataka, India',
                        details: userData.details || {}
                    });
                }, 1000);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setStatusMessage({ type: 'error', text: error.message || 'Failed to login' });
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage(null);

        try {
            const role = getRoleString(view);
            if (role === 'admin') {
                throw new Error("Admins cannot be created via public signup.");
            }
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user) {
                // Store user metadata in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    first_name: firstName,
                    middle_name: middleName,
                    last_name: lastName,
                    role: role,
                    details: {}
                });

                setStatusMessage({ type: 'success', text: 'Account created! Redirecting...' });
                setTimeout(() => {
                    onLoginSuccess({
                        id: user.uid,
                        email: user.email || email,
                        role: mapRoleToUserRole(role),
                        fullName: `${firstName} ${lastName}`,
                        location: 'Karnataka, India',
                        details: {}
                    });
                }, 1000);
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            setStatusMessage({ type: 'error', text: error.message || 'Failed to sign up' });
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setStatusMessage({ type: 'success', text: 'Opening Google Login...' });
        try {
            const currentRole = getRoleString(view);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (!userDoc.exists()) {
                     if (currentRole === 'admin') {
                         await auth.signOut();
                         throw new Error("Admins cannot sign up via Google Login.");
                     }
                     await setDoc(userDocRef, {
                         email: user.email,
                         role: currentRole,
                         first_name: user.displayName?.split(' ')[0] || '',
                         last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
                         details: {}
                     });
                } else {
                     const storedRole = userDoc.data().role;
                     if (storedRole !== currentRole) {
                         await auth.signOut();
                         throw new Error(`Invalid portal. Please login via the ${storedRole.charAt(0).toUpperCase() + storedRole.slice(1)} portal.`);
                     }
                }
            }
        } catch (error: any) {
            setStatusMessage({ type: 'error', text: error.message });
        }
    };

    // Render Landing Page
    if (view === 'intro') {
        return (
            <LandingPage
                texts={texts}
                onEnterApp={() => setView('role-selection')}
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
                onWeatherClick={() => setView('role-selection')}
                onAssistantClick={() => setView('role-selection')}
                onPlantAnalysisClick={() => setView('role-selection')}
                onSoilAnalysisClick={() => setView('role-selection')}
                onMarketplaceClick={() => setView('role-selection')}
                onLogout={() => { }}
                onProfileClick={() => setView('role-selection')}
                onNavigate={() => { }}
                user={undefined}
            />
        );
    }

    // Render Role Selection (Matches Login_sys/index.html)
    if (view === 'role-selection') {
        return (
            <div className="login-system-root role-selection-mode">
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                    <LanguageToggle currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} />
                </div>

                <motion.p
                    className="welcome-text"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {texts.welcome_to || 'Welcome to'}
                </motion.p>

                <motion.div
                    className="role-container"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1>AGRIVERSE AI</h1>
                    <p>{texts.select_role || 'Select your role to continue'}</p>
                    <div className="role-options">
                        <motion.div
                            className="role-btn"
                            onClick={() => handleRoleSelect('buyer')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <BuildingIcon />
                            <span>{texts.buyer || 'Buyer (Market Agent)'}</span>
                        </motion.div>

                        <motion.div
                            className="role-btn"
                            onClick={() => handleRoleSelect('seller')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <UserCircleIcon />
                            <span>{texts.seller || 'Seller'}</span>
                        </motion.div>

                        <motion.div
                            className="role-btn"
                            onClick={() => handleRoleSelect('admin')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ShieldCheckIcon />
                            <span>{texts.admin || 'Admin'}</span>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Render Auth Form (Matches Login_sys/buyer.html, seller.html, admin-login.html)
    const isBuyer = view === 'buyer';
    const isSeller = view === 'seller';
    const isAdmin = view === 'admin';

    const themeClass = isBuyer ? 'buyer-theme' : isSeller ? 'seller-theme' : 'admin-theme';
    const title = isBuyer ? (texts.buyer_portal || 'Buyer Portal') : isSeller ? (texts.seller_portal || 'Seller Portal') : (texts.admin_portal || 'Admin Portal');
    const subtitle = isBuyer ? (texts.buyer_subtitle || 'Access your Market Agent dashboard') : isSeller ? (texts.seller_subtitle || 'Access your seller dashboard') : (texts.admin_subtitle || 'Secure access to administrative controls');
    const Icon = isBuyer ? BuildingIcon : isSeller ? UserCircleIcon : ShieldCheckIcon;

    return (
        <div className={`login-system-root portal-mode ${themeClass}`}>
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                <LanguageToggle currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} />
            </div>

            <button className="back-btn" onClick={handleBackToHome} aria-label="Go back to home">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>

            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="header">
                    <div className="logo text-white">
                        <Icon className="w-8 h-8" />
                    </div>
                    <h1>{title}</h1>
                    <p className="subtitle">{subtitle}</p>
                </div>

                {!isAdmin && (
                    <div className="tabs">
                        <div
                            className={`tab ${authMode === 'login' ? 'active' : ''}`}
                            onClick={() => setAuthMode('login')}
                        >
                            {texts.sign_in || 'Sign In'}
                        </div>
                        <div
                            className={`tab ${authMode === 'signup' ? 'active' : ''}`}
                            onClick={() => setAuthMode('signup')}
                        >
                            {texts.create_account || 'Create Account'}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {authMode === 'login' || isAdmin ? (
                        <motion.form
                            key="login-form"
                            onSubmit={handleLogin}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="form-group">
                                <label className="form-label">{texts.email_address || 'Email Address'}</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{texts.password || 'Password'}</label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button className="btn" type="submit" disabled={isLoading}>
                                {isLoading ? <span className="loading"></span> : (texts.sign_in || 'Sign In')}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="signup-form"
                            onSubmit={handleSignup}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="name-grid">
                                <div className="form-group">
                                    <label className="form-label">{texts.first_name || 'First Name'}</label>
                                    <input
                                        type="text"
                                        placeholder="First name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        minLength={1}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{texts.middle_name || 'Middle Name'}</label>
                                    <input
                                        type="text"
                                        placeholder="Optional"
                                        value={middleName}
                                        onChange={(e) => setMiddleName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{texts.last_name || 'Last Name'}</label>
                                <input
                                    type="text"
                                    placeholder="Last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    minLength={1}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{texts.email_address || 'Email Address'}</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{texts.password || 'Password'}</label>
                                <input
                                    type="password"
                                    placeholder="Create a password (min 6 chars)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button className="btn" type="submit" disabled={isLoading}>
                                {isLoading ? <span className="loading"></span> : (texts.create_account || 'Create Account')}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {authMode === 'signup' && !isAdmin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
                            <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />
                            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-primary)', padding: '0 10px', color: 'var(--text-secondary)', fontSize: '14px' }}>OR</span>
                        </div>

                        <button
                            className="btn google-btn"
                            type="button"
                            onClick={handleGoogleLogin}
                        >
                            <GoogleIcon className="w-5 h-5" />
                            <span>Sign up with Google</span>
                        </button>
                    </motion.div>
                )}

                {statusMessage && (
                    <motion.div
                        className={`status ${statusMessage.type}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {statusMessage.text}
                    </motion.div>
                )}

                <div className="back-to-home">
                    <button onClick={handleBackToHome}>
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>{texts.back_to_home || 'Back to Home'}</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
