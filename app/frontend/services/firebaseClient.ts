import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBZEFxujDsnxSinNQaGqsbt2osCEttirCY",
    authDomain: "agrivi-fee22.firebaseapp.com",
    projectId: "agrivi-fee22",
    storageBucket: "agrivi-fee22.firebasestorage.app",
    messagingSenderId: "897022954344",
    appId: "1:897022954344:web:c7507f429dca7c70c964dd",
    measurementId: "G-7SJC0RTK6C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only works in browser environments)
let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics };
