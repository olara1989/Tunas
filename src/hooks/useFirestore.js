import { useState, useEffect } from 'react';
import {
    collection, onSnapshot, addDoc, updateDoc,
    deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db, ensureAnonymousAuth } from '../firebase';

const APP_ID = 'tunas-sweeper';
export const BASE_PATH = `artifacts/${APP_ID}/public/data`;

export function getCollectionRef(colName) {
    return collection(db, `${BASE_PATH}/${colName}`);
}

export function getDocRef(colName, id) {
    return doc(db, `${BASE_PATH}/${colName}`, id);
}

export function useFirestore(collectionName) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let unsubscribe;
        const load = async () => {
            try {
                await ensureAnonymousAuth();
                const ref = getCollectionRef(collectionName);
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
        };
        load();
        return () => { if (unsubscribe) unsubscribe(); };
    }, [collectionName]);

    const addNode = async (newData) => {
        const ref = getCollectionRef(collectionName);
        return await addDoc(ref, { ...newData, createdAt: serverTimestamp() });
    };

    const updateNode = async (id, updatedFields) => {
        const docRef = getDocRef(collectionName, id);
        return await updateDoc(docRef, { ...updatedFields, updatedAt: serverTimestamp() });
    };

    const deleteNode = async (id) => {
        const docRef = getDocRef(collectionName, id);
        return await deleteDoc(docRef);
    };

    return { data, loading, error, addNode, updateNode, deleteNode };
}
