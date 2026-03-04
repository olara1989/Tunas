import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase project config — replace with real values when deploying
const firebaseConfig = {
    apiKey: "AIzaSyDqVIeeDl8iE9fIlbP6xKbGQzAU1Ztj9jk",
    authDomain: "tunas-d211b.firebaseapp.com",
    projectId: "tunas-d211b",
    storageBucket: "tunas-d211b.firebasestorage.app",
    messagingSenderId: "35421914827",
    appId: "1:35421914827:web:c505bbb89479aac5e8fd4e",
    measurementId: "G-XN1WYDN2XZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let authInitialized = false;
export const ensureAnonymousAuth = async () => {
    if (authInitialized || auth.currentUser) return;
    try {
        await signInAnonymously(auth);
        authInitialized = true;
    } catch (error) {
        console.warn("Anonymous auth failed:", error.code, error.message);
        // Allow app to work in demo mode without auth if project isn't configured
    }
};
