import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultDemoData, blankFormData } from '../data/demoData';

const FormDataContext = createContext(null);

const DEBOUNCE_MS = 1500;

// Firestore-backed provider: real-time sync with debounced writes
function FirestoreFormDataProvider({ weddingId, children }) {
  const [formData, setFormDataLocal] = useState(blankFormData);
  const [loaded, setLoaded] = useState(false);
  const pendingRef = useRef(null);
  const timeoutRef = useRef(null);
  const weddingRef = useRef(weddingId);
  useEffect(() => { weddingRef.current = weddingId; }, [weddingId]);

  // Flush pending data to Firestore (defined first so useEffect can reference it)
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

  // Subscribe to Firestore wedding document
  useEffect(() => {
    if (!weddingId || !db) return;

    const docRef = doc(db, 'weddings', weddingId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const formFields = data.formData || {};
          // Only update local state if this isn't our own pending write
          if (!pendingRef.current) {
            setFormDataLocal(() => ({ ...blankFormData, ...formFields }));
          }
        }
        setLoaded(true);
      },
      (err) => {
        console.error('Firestore snapshot error:', err);
        setLoaded(true);
      }
    );

    return () => {
      unsubscribe();
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

  // Show loading state until first snapshot arrives
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

  if (!weddingId) {
    // Auth is done but wedding not loaded yet — show blank state
    return (
      <FormDataContext.Provider
        value={{ formData: blankFormData, setFormData: () => {}, updateField: () => {}, updateNestedField: () => {}, resetToDemo: () => {}, resetToBlank: () => {}, clearAll: () => {}, loading: true }}
      >
        {children}
      </FormDataContext.Provider>
    );
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
