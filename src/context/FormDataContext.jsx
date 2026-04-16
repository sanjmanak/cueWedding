import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
// NOTE: We intentionally use updateDoc (not setDoc+merge) for all wedding
// writes so that dot-notation paths like 'meta.updatedAt' only touch the
// targeted fields. setDoc({merge:true}) with nested objects can replace
// the entire parent map, which triggers Firestore rule violations.
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultDemoData, blankFormData } from '../data/demoData';

const FormDataContext = createContext(null);

const DEBOUNCE_MS = 1500;

// Firestore-backed provider: load once, then debounced writes
function FirestoreFormDataProvider({ weddingId, children }) {
  const [formData, setFormDataLocal] = useState(blankFormData);
  const [profilePhoto, setProfilePhotoLocal] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const pendingRef = useRef(null);
  const timeoutRef = useRef(null);
  const weddingRef = useRef(weddingId);
  // Track which top-level formData keys the couple has touched since last
  // flush. We only write those keys (via dot notation) so concurrent admin
  // edits to OTHER keys don't get clobbered by the couple's flush.
  const dirtyKeysRef = useRef(new Set());
  useEffect(() => { weddingRef.current = weddingId; }, [weddingId]);

  // Flush pending data to Firestore.
  // Writes only dirty top-level formData keys via dot notation so admin
  // edits to other keys (e.g. admin fixes brideName while couple edits
  // people[]) survive this flush.
  const flushToFirestore = useCallback(() => {
    const data = pendingRef.current;
    const id = weddingRef.current;
    const dirty = dirtyKeysRef.current;
    if (!data || !id || !db || dirty.size === 0) return;

    const updates = { 'meta.updatedAt': serverTimestamp() };
    for (const key of dirty) {
      updates[`formData.${key}`] = data[key] === undefined ? null : data[key];
    }
    pendingRef.current = null;
    dirtyKeysRef.current = new Set();
    updateDoc(doc(db, 'weddings', id), updates).catch((err) =>
      console.error('Firestore write error:', err)
    );
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
          const data = snap.data();
          const formFields = data.formData || {};
          setFormDataLocal({ ...blankFormData, ...formFields });
          setProfilePhotoLocal(data.meta?.profile?.photo || null);
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

  // Wrapped setFormData that syncs to Firestore. Diffs top-level keys vs
  // prev to record what changed — only those get written on flush.
  const setFormData = useCallback(
    (valueOrFn) => {
      setFormDataLocal((prev) => {
        const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
        const prevObj = prev || {};
        const nextObj = next || {};
        for (const key of Object.keys(nextObj)) {
          if (nextObj[key] !== prevObj[key]) dirtyKeysRef.current.add(key);
        }
        for (const key of Object.keys(prevObj)) {
          if (!(key in nextObj)) dirtyKeysRef.current.add(key);
        }
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

  // Profile photo lives on meta.profile.photo. Write goes straight to Firestore
  // (not debounced through formData) so the avatar shows up immediately after
  // upload. Pass null to clear.
  const setProfilePhoto = useCallback(
    async (photo) => {
      setProfilePhotoLocal(photo);
      const id = weddingRef.current;
      if (!id || !db) return;
      try {
        await updateDoc(doc(db, 'weddings', id), {
          'meta.profile.photo': photo || null,
          'meta.updatedAt': serverTimestamp(),
        });
      } catch (err) {
        console.error('Profile photo write error:', err);
      }
    },
    []
  );

  // Show loading state until data is loaded
  if (!loaded) {
    return (
      <FormDataContext.Provider
        value={{ formData: blankFormData, setFormData: () => {}, updateField: () => {}, updateNestedField: () => {}, resetToDemo: () => {}, resetToBlank: () => {}, clearAll: () => {}, profilePhoto: null, setProfilePhoto: () => {}, loading: true }}
      >
        {children}
      </FormDataContext.Provider>
    );
  }

  return (
    <FormDataContext.Provider
      value={{ formData, setFormData, updateField, updateNestedField, resetToDemo, resetToBlank, clearAll, profilePhoto, setProfilePhoto, loading: false }}
    >
      {children}
    </FormDataContext.Provider>
  );
}

// localStorage-backed provider: original behavior for demo mode
function LocalFormDataProvider({ children }) {
  const [formData, setFormData, removeFormData] = useLocalStorage('cue-wedding-data', defaultDemoData);
  // Demo mode has no Firebase Storage, so photo state is in-memory only.
  const [profilePhoto, setProfilePhoto] = useState(null);

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
    setProfilePhoto(null);
  }, [removeFormData]);

  return (
    <FormDataContext.Provider
      value={{ formData, setFormData, updateField, updateNestedField, resetToDemo, resetToBlank, clearAll, profilePhoto, setProfilePhoto, loading: false }}
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
