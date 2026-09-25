import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCavVDX8LHz_w4U-oeamNACrq69KIJxYak",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "agriverse-ai-332ff.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "agriverse-ai-332ff",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "agriverse-ai-332ff.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1068253949618",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1068253949618:web:3fb6cd9b025daba04ae3ab",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0KE42W6LKN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only works in browser environments)
let analytics;
if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        // Analytics may fail in ad-blocked or non-standard environments
    }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics };
