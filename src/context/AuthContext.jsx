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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
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
  const [isAdmin, setIsAdmin] = useState(!isFirebaseConfigured); // Demo mode = admin
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState(null);
  const magicLinkHandled = useRef(false);

  // Find a wedding where the user's email matches brideEmail or groomEmail in meta
  const findWeddingByEmail = useCallback(async (email) => {
    if (!db || !email) return null;
    const normalizedEmail = email.trim().toLowerCase();
    const weddingsRef = collection(db, 'weddings');

    // Check brideEmail match
    const brideQuery = query(weddingsRef, where('meta.brideEmail', '==', normalizedEmail));
    const brideSnap = await getDocs(brideQuery);
    if (!brideSnap.empty) return brideSnap.docs[0];

    // Check groomEmail match
    const groomQuery = query(weddingsRef, where('meta.groomEmail', '==', normalizedEmail));
    const groomSnap = await getDocs(groomQuery);
    if (!groomSnap.empty) return groomSnap.docs[0];

    return null;
  }, []);

  // Link user to an existing wedding (admin-created)
  const linkUserToWedding = useCallback(async (firebaseUser, weddingDoc) => {
    if (!db) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const weddingData = weddingDoc.data();
    const existingOwners = weddingData.meta?.ownerUids || [];

    // Add user UID to wedding ownerUids if not already there.
    // Use updateDoc with dot notation so we only touch ownerUids and
    // updatedAt — never overwrite sibling meta fields like brideEmail.
    if (!existingOwners.includes(firebaseUser.uid)) {
      await updateDoc(doc(db, 'weddings', weddingDoc.id), {
        'meta.ownerUids': [...existingOwners, firebaseUser.uid],
        'meta.updatedAt': serverTimestamp(),
      });
    }

    // Create or update user doc pointing to this wedding
    await setDoc(userRef, {
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      role: 'couple',
      weddingId: weddingDoc.id,
      displayName: firebaseUser.displayName || '',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }, { merge: true });

    setWeddingId(weddingDoc.id);
  }, []);

  // Load or create user document and their wedding
  const loadUserData = useCallback(async (firebaseUser) => {
    if (!db) return;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Existing user — load their wedding and role
        const userData = userSnap.data();
        setIsAdmin(userData.role === 'admin');

        if (userData.weddingId) {
          setWeddingId(userData.weddingId);
        } else {
          // Existing user with no wedding — try to find one by email
          const matchedWedding = await findWeddingByEmail(firebaseUser.email);
          if (matchedWedding) {
            await linkUserToWedding(firebaseUser, matchedWedding);
          }
        }

        // Update last login (fire and forget)
        setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true }).catch(() => {});
      } else {
        // New user — check for ?wedding= param or email match before creating blank wedding
        const urlParams = new URLSearchParams(window.location.search);
        const weddingParam = urlParams.get('wedding');

        // Strategy 1: Check ?wedding= URL param (from invite link)
        if (weddingParam) {
          const weddingSnap = await getDoc(doc(db, 'weddings', weddingParam));
          if (weddingSnap.exists()) {
            const meta = weddingSnap.data().meta || {};
            const userEmail = (firebaseUser.email || '').toLowerCase();
            // Verify email matches bride or groom for security
            if (userEmail && (meta.brideEmail === userEmail || meta.groomEmail === userEmail)) {
              await linkUserToWedding(firebaseUser, weddingSnap);
              // Clean URL param
              window.history.replaceState(null, '', window.location.pathname);
              return;
            }
          }
        }

        // Strategy 2: Check if any wedding has this email as bride or groom
        const matchedWedding = await findWeddingByEmail(firebaseUser.email);
        if (matchedWedding) {
          await linkUserToWedding(firebaseUser, matchedWedding);
          return;
        }

        // Strategy 3: No match found — create a new blank wedding.
        // Store the sign-up email as brideEmail so the Firestore rules
        // have a value to compare on future writes and so admins can see
        // who owns this wedding. The couple can reassign later.
        const newWeddingId = crypto.randomUUID();
        const signUpEmail = (firebaseUser.email || '').trim().toLowerCase();

        await setDoc(doc(db, 'weddings', newWeddingId), {
          formData: {},
          meta: {
            ownerUids: [firebaseUser.uid],
            brideEmail: signUpEmail,
            groomEmail: '',
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
  }, [findWeddingByEmail, linkUserToWedding]);

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
        setIsAdmin(false);
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
    isAdmin,
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
