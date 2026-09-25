import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseClient';
import { UserProfile, UserRole, UserProfileDetails } from '../types';

interface AuthContextType {
    user: UserProfile | null;
    firebaseUser: FirebaseUser | null;
    isLoading: boolean;
    error: string | null;
    signInWithEmail: (email: string, password: string, portalRole: 'seller' | 'buyer') => Promise<void>;
    signUpWithEmail: (email: string, password: string, firstName: string, lastName: string, portalRole: 'seller' | 'buyer') => Promise<void>;
    signInWithGoogle: (portalRole: 'seller' | 'buyer') => Promise<void>;
    signOut: () => Promise<void>;
    updateProfileDetails: (details: Partial<UserProfileDetails>, fullName?: string, location?: string) => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const mapRoleToUserRole = (roleString?: string): UserRole => {
    switch (roleString?.toLowerCase()) {
        case 'buyer':
            return UserRole.BUYER;
        case 'seller':
        case 'farmer':
        case 'user':
            return UserRole.USER;
        case 'admin':
            return UserRole.ADMIN;
        default:
            return UserRole.USER;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const clearError = () => setError(null);

    // Fetch user document from Firestore and build UserProfile
    const fetchUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        let roleString = 'user';
        let fullName = fbUser.displayName || 'User';
        let location = 'Karnataka, India';
        let details: UserProfileDetails = {};

        if (userDoc.exists()) {
            const data = userDoc.data();
            roleString = data.role || 'user';
            fullName = data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : (data.fullName || fullName);
            location = data.location || location;
            details = data.details || {};
        }

        return {
            id: fbUser.uid,
            email: fbUser.email || '',
            role: mapRoleToUserRole(roleString),
            fullName: fullName,
            location: location,
            details: details
        };
    };

    // Firebase Auth State Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            try {
                if (fbUser) {
                    setFirebaseUser(fbUser);
                    const profile = await fetchUserProfile(fbUser);
                    setUser(profile);
                } else {
                    setFirebaseUser(null);
                    setUser(null);
                }
            } catch (err: any) {
                console.error("Auth state transition error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Email Sign In
    const signInWithEmail = async (email: string, password: string, portalRole: 'seller' | 'buyer') => {
        setIsLoading(true);
        setError(null);
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const fbUser = credential.user;

            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    email: fbUser.email,
                    role: portalRole,
                    first_name: '',
                    last_name: '',
                    location: 'Karnataka, India',
                    details: {}
                });
            }

            const profile = await fetchUserProfile(fbUser);
            setUser(profile);
        } catch (err: any) {
            console.error("Sign in failed:", err);
            setError(err.message || "Failed to sign in. Please verify your credentials.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Email Registration
    const signUpWithEmail = async (
        email: string, 
        password: string, 
        firstName: string, 
        lastName: string, 
        portalRole: 'seller' | 'buyer'
    ) => {
        setIsLoading(true);
        setError(null);
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const fbUser = credential.user;

            const userDocRef = doc(db, 'users', fbUser.uid);
            await setDoc(userDocRef, {
                email: fbUser.email,
                role: portalRole,
                first_name: firstName,
                last_name: lastName,
                location: 'Karnataka, India',
                createdAt: new Date().toISOString(),
                details: {}
            });

            const profile = await fetchUserProfile(fbUser);
            setUser(profile);
        } catch (err: any) {
            console.error("Registration failed:", err);
            setError(err.message || "Failed to create account.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Google Sign-In
    const signInWithGoogle = async (portalRole: 'seller' | 'buyer') => {
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const credential = await signInWithPopup(auth, provider);
            const fbUser = credential.user;

            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const names = (fbUser.displayName || '').split(' ');
                const firstName = names[0] || '';
                const lastName = names.slice(1).join(' ') || '';

                await setDoc(userDocRef, {
                    email: fbUser.email,
                    role: portalRole,
                    first_name: firstName,
                    last_name: lastName,
                    location: 'Karnataka, India',
                    createdAt: new Date().toISOString(),
                    details: {}
                });
            }

            const profile = await fetchUserProfile(fbUser);
            setUser(profile);
        } catch (err: any) {
            console.error("Google sign in failed:", err);
            setError(err.message || "Google sign-in was cancelled or failed.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Sign Out
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setFirebaseUser(null);
        } catch (err: any) {
            console.error("Sign out failed:", err);
            setError(err.message);
        }
    };

    // Update Profile
    const updateProfileDetails = async (
        details: Partial<UserProfileDetails>, 
        fullName?: string, 
        location?: string
    ) => {
        if (!user) return;
        try {
            const userDocRef = doc(db, 'users', user.id);
            const updatePayload: Record<string, any> = {
                details: { ...user.details, ...details }
            };

            if (fullName) {
                const parts = fullName.trim().split(' ');
                updatePayload.first_name = parts[0];
                updatePayload.last_name = parts.slice(1).join(' ');
                updatePayload.fullName = fullName;
            }

            if (location) {
                updatePayload.location = location;
            }

            await updateDoc(userDocRef, updatePayload);

            setUser(prev => prev ? {
                ...prev,
                fullName: fullName || prev.fullName,
                location: location || prev.location,
                details: { ...prev.details, ...details }
            } : null);
        } catch (err: any) {
            console.error("Failed to update profile:", err);
            setError(err.message);
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                isLoading,
                error,
                signInWithEmail,
                signUpWithEmail,
                signInWithGoogle,
                signOut,
                updateProfileDetails,
                clearError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
