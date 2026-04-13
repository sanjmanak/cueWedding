import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultDemoData, blankFormData } from '../data/demoData';

const FormDataContext = createContext(null);

const DEBOUNCE_MS = 1500;

// Firestore-backed provider: load once, then debounced writes
function FirestoreFormDataProvider({ weddingId, children }) {
  const [formData, setFormDataLocal] = useState(blankFormData);
  const [loaded, setLoaded] = useState(false);
  const pendingRef = useRef(null);
  const timeoutRef = useRef(null);
  const weddingRef = useRef(weddingId);
  useEffect(() => { weddingRef.current = weddingId; }, [weddingId]);

  // Flush pending data to Firestore
  const flushToFirestore = useCallback(() => {
    const data = pendingRef.current;
    const id = weddingRef.current;
    if (data && id && db) {
      pendingRef.current = null;
      setDoc(
        doc(db, 'weddings', id),
        { formData: data, meta: { updatedAt: serverTimestamp() } },
        { merge: true }
      ).catch((err) => console.error('Firestore write error:', err));
    }
  }, []);

  // Load data from Firestore once on mount (no real-time listener to avoid race conditions)
  useEffect(() => {
    if (!weddingId || !db) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    const docRef = doc(db, 'weddings', weddingId);

    getDoc(docRef)
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const formFields = snap.data().formData || {};
          setFormDataLocal({ ...blankFormData, ...formFields });
        }
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Firestore load error:', err);
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
      // Flush any pending writes on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        flushToFirestore();
      }
    };
  }, [weddingId, flushToFirestore]);

  // Debounced sync to Firestore
  const syncToFirestore = useCallback(
    (data) => {
      pendingRef.current = data;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(flushToFirestore, DEBOUNCE_MS);
    },
    [flushToFirestore]
  );

  // Flush on beforeunload
  useEffect(() => {
    const handleUnload = () => flushToFirestore();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [flushToFirestore]);

  // Wrapped setFormData that syncs to Firestore
  const setFormData = useCallback(
    (valueOrFn) => {
      setFormDataLocal((prev) => {
        const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
        syncToFirestore(next);
        return next;
      });
    },
    [syncToFirestore]
  );

  const updateField = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData]
  );

  const updateNestedField = useCallback(
    (parent, key, value) => {
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev[parent] || {}), [key]: value },
      }));
    },
    [setFormData]
  );

  const resetToDemo = useCallback(() => {
    setFormData(defaultDemoData);
  }, [setFormData]);

  const resetToBlank = useCallback(() => {
    setFormData({ ...blankFormData });
  }, [setFormData]);

  const clearAll = useCallback(() => {
    setFormData({ ...blankFormData });
  }, [setFormData]);

  // Show loading state until data is loaded
  if (!loaded) {
    return (
      <FormDataContext.Provider
        value={{ formData: blankFormData, setFormData: () => {}, updateField: () => {}, updateNestedField: () => {}, resetToDemo: () => {}, resetToBlank: () => {}, clearAll: () => {}, loading: true }}
      >
        {children}
      </FormDataContext.Provider>
    );
  }

  return (
    <FormDataContext.Provider
      value={{ formData, setFormData, updateField, updateNestedField, resetToDemo, resetToBlank, clearAll, loading: false }}
    >
      {children}
    </FormDataContext.Provider>
  );
}

// localStorage-backed provider: original behavior for demo mode
function LocalFormDataProvider({ children }) {
  const [formData, setFormData, removeFormData] = useLocalStorage('cue-wedding-data', defaultDemoData);

  const updateField = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData]
  );

  const updateNestedField = useCallback(
    (parent, key, value) => {
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev[parent] || {}), [key]: value },
      }));
    },
    [setFormData]
  );

  const resetToDemo = useCallback(() => {
    setFormData(defaultDemoData);
  }, [setFormData]);

  const resetToBlank = useCallback(() => {
    setFormData({ ...blankFormData });
  }, [setFormData]);

  const clearAll = useCallback(() => {
    removeFormData();
  }, [removeFormData]);

  return (
    <FormDataContext.Provider
      value={{ formData, setFormData, updateField, updateNestedField, resetToDemo, resetToBlank, clearAll, loading: false }}
    >
      {children}
    </FormDataContext.Provider>
  );
}

// Smart provider: picks Firestore or localStorage based on config
export function FormDataProvider({ children }) {
  const { weddingId, isDemo } = useAuth();

  if (isDemo || !isFirebaseConfigured) {
    return <LocalFormDataProvider>{children}</LocalFormDataProvider>;
  }

  // If auth succeeded but weddingId failed to load (e.g. Firestore rules not deployed),
  // fall back to localStorage so the user can still use the app
  if (!weddingId) {
    return <LocalFormDataProvider>{children}</LocalFormDataProvider>;
  }

  return (
    <FirestoreFormDataProvider weddingId={weddingId}>
      {children}
    </FirestoreFormDataProvider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFormData() {
  const ctx = useContext(FormDataContext);
  if (!ctx) throw new Error('useFormData must be used within FormDataProvider');
  return ctx;
}
