import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Initialize primary Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Secondary Firebase App (used ONLY by Admin to create new tenant accounts without logging out)
const secondaryApp = getApps().length === 1 ? initializeApp(firebaseConfig, "Secondary") : getApps().find(a => a.name === "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
