import { UserProfile, KycStatus, UserRole } from '../types';
import { db } from './firebaseClient';
import { 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    getDocs, 
    query, 
    where 
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';

export const userService = {
    /**
     * Fetch user profile from Firestore
     */
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        try {
            const docRef = doc(db, USERS_COLLECTION, uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                return {
                    id: uid,
                    email: data.email || '',
                    phone: data.phone || '',
                    role: data.role as UserRole,
                    lastActiveRole: data.lastActiveRole || data.role,
                    fullName: data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : (data.fullName || 'User'),
                    location: data.location || 'Karnataka, India',
                    profileImageUrl: data.profileImageUrl,
                    kycStatus: (data.kycStatus as KycStatus) || 'verified',
                    details: data.details || {},
                    createdAt: data.createdAt
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    /**
     * Update user profile fields (e.g. location, farm details, contact)
     */
    updateUserProfile: async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
        try {
            const docRef = doc(db, USERS_COLLECTION, uid);
            await setDoc(docRef, updates, { merge: true });
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },

    /**
     * Update KYC Verification Status (Admin or verification flow)
     */
    updateKycStatus: async (uid: string, status: KycStatus): Promise<void> => {
        try {
            const docRef = doc(db, USERS_COLLECTION, uid);
            await updateDoc(docRef, { kycStatus: status });
        } catch (error) {
            console.error('Error updating KYC status:', error);
            throw error;
        }
    }
};
