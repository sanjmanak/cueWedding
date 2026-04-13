import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

const AuthContext = createContext(null);

const MAGIC_LINK_EMAIL_KEY = 'cue-magic-link-email';

// Demo user for when Firebase is not configured
const DEMO_USER = { uid: 'demo', email: 'demo@cue.app', displayName: 'Demo User' };
const DEMO_WEDDING_ID = 'demo';

export function AuthProvider({ children }) {
  // In demo mode, initialize state directly to avoid effects
  const [user, setUser] = useState(() => (isFirebaseConfigured ? null : DEMO_USER));
  const [weddingId, setWeddingId] = useState(() => (isFirebaseConfigured ? null : DEMO_WEDDING_ID));
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState(null);
  const magicLinkHandled = useRef(false);

  // Load or create user document and their wedding
  const loadUserData = useCallback(async (firebaseUser) => {
    if (!db) return;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Existing user — load their wedding
        const userData = userSnap.data();
        setWeddingId(userData.weddingId || null);

        // Update last login (fire and forget)
        setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true }).catch(() => {});
      } else {
        // New user — create user doc + blank wedding
        const newWeddingId = crypto.randomUUID();

        await setDoc(doc(db, 'weddings', newWeddingId), {
          formData: {},
          meta: {
            ownerUids: [firebaseUser.uid],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active',
          },
        });

        await setDoc(userRef, {
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          role: 'couple',
          weddingId: newWeddingId,
          displayName: firebaseUser.displayName || '',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        setWeddingId(newWeddingId);
      }
    } catch (err) {
      console.error('Firestore setup error:', err);
      // Even if Firestore fails, don't block the user.
      // FormDataProvider will fall back to localStorage.
    }
  }, []);

  // Complete magic link sign-in if the URL is a sign-in link (runs once before auth listener)
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || magicLinkHandled.current) return;

    if (isSignInWithEmailLink(auth, window.location.href)) {
      magicLinkHandled.current = true;
      let email = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
      if (!email) {
        email = window.prompt('Please enter your email to confirm sign-in:');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
            window.history.replaceState(null, '', window.location.pathname);
          })
          .catch((err) => {
            console.error('Magic link sign-in error:', err);
            setError('Sign-in link is invalid or expired. Please request a new one.');
          });
      }
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          await loadUserData(firebaseUser);
        } catch (err) {
          console.error('Error loading user data:', err);
          setError('Failed to load your data. Please try again.');
        }
      } else {
        setUser(null);
        setWeddingId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [loadUserData]);

  // Send magic link email
  const sendMagicLink = useCallback(async (email) => {
    if (!isFirebaseConfigured || !auth) return;

    setError(null);
    const actionCodeSettings = {
      url: window.location.origin + '/',
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
  }, []);

  // Google sign-in
  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) return;

    setError(null);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    await firebaseSignOut(auth);
  }, []);

  const value = {
    user,
    weddingId,
    loading,
    error,
    setError,
    isDemo: !isFirebaseConfigured,
    sendMagicLink,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
