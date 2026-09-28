import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBZEFxujDsnxSinNQaGqsbt2osCEttirCY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "agrivi-fee22.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "agrivi-fee22",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "agrivi-fee22.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "897022954344",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:897022954344:web:c7507f429dca7c70c964dd",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7SJC0RTK6C"
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
