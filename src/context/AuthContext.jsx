import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null); // Document from /usuarios/{uid}
    const [activeTenant, setActiveTenant] = useState(null); // Used by Admin to impersonate
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch custom user data (roles, tenant_id)
                const docRef = doc(db, 'usuarios', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    // Auto-bootstrap specific users if they don't have a document yet
                    const email = currentUser.email;
                    let initialData = null;
                    if (email === 'horacio@gmail.com') {
                        initialData = { email, rol: 'tenant', tenant_id: 'tunas-sweeper', bodega_info: {} };
                    } else if (email === 'olara@utzac.edu.mx') {
                        initialData = { email, rol: 'admin' };
                    } else {
                        // Default to tenant with a new isolated tenant ID (using uid)
                        initialData = { email, rol: 'tenant', tenant_id: currentUser.uid, bodega_info: {} };
                    }

                    if (initialData) {
                        await setDoc(docRef, initialData);
                        setUserData(initialData);
                    }
                }
            } else {
                setUserData(null);
                setActiveTenant(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const logout = () => {
        setActiveTenant(null);
        return signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, login, logout, activeTenant, setActiveTenant }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
