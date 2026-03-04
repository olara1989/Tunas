import { useState, useEffect } from 'react';
import {
    collection, onSnapshot, addDoc, updateDoc,
    deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useFirestore(collectionName) {
    const { userData, activeTenant } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // If an activeTenant is selected (Admin impersonation mode), use that. Otherwise use the user's tenant ID
    const tenantId = activeTenant?.id || userData?.tenant_id;

    // Helper functions now bound to tenantId
    const getCollectionRef = () => {
        if (!tenantId) throw new Error("No tenant_id");
        return collection(db, `artifacts/${tenantId}/public/data/${collectionName}`);
    };

    const getDocRef = (id) => {
        if (!tenantId) throw new Error("No tenant_id");
        return doc(db, `artifacts/${tenantId}/public/data/${collectionName}`, id);
    };

    useEffect(() => {
        if (!tenantId) {
            setData([]);
            setLoading(false);
            return;
        }

        let unsubscribe;
        try {
            setLoading(true);
            const ref = getCollectionRef();
            unsubscribe = onSnapshot(ref, (snapshot) => {
                const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setData(docs);
                setLoading(false);
                setError(null);
            }, (err) => {
                console.error(`Error loading ${collectionName}:`, err);
                setError(err.message);
                setLoading(false);
            });
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }

        return () => { if (unsubscribe) unsubscribe(); };
    }, [collectionName, tenantId]);

    const addNode = async (newData) => {
        if (!tenantId) throw new Error("Not authorized");
        const ref = getCollectionRef();
        return await addDoc(ref, { ...newData, createdAt: serverTimestamp() });
    };

    const updateNode = async (id, updatedFields) => {
        if (!tenantId) throw new Error("Not authorized");
        const ref = getDocRef(id);
        return await updateDoc(ref, { ...updatedFields, updatedAt: serverTimestamp() });
    };

    const deleteNode = async (id) => {
        if (!tenantId) throw new Error("Not authorized");
        const ref = getDocRef(id);
        return await deleteDoc(ref);
    };

    return { data, loading, error, addNode, updateNode, deleteNode };
}

