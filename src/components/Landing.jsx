import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './common/Button';

export default function Landing() {
  const { user, loading, error, setError, isDemo, sendMagicLink, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sending, setSending] = useState(false);

  // If already signed in, redirect to Phase 1
  if (user && !loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <img
            src={import.meta.env.BASE_URL + 'logo.png'}
            alt="Special Occasions DJ"
            className="h-16 mx-auto mb-8"
          />
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-stone-900 mb-3">
            Welcome back
          </h1>
          <p className="text-stone-500 text-sm mb-8">
            Signed in as {user.email || 'Demo User'}
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/phase/1')}>
            Continue Planning
          </Button>
        </div>
      </div>
    );
  }

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (isDemo) {
      // Demo mode — skip real auth, just navigate
      navigate('/phase/1');
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch (err) {
      console.error('Magic link error:', err);
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send sign-in link. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isDemo) {
      navigate('/phase/1');
      return;
    }
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google sign-in error:', err);
        setError('Google sign-in failed. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <img
          src={import.meta.env.BASE_URL + 'logo.png'}
          alt="Special Occasions DJ"
          className="h-16 mx-auto mb-8"
        />

        {/* Welcome message */}
        <h1 className="font-heading text-4xl md:text-5xl font-semibold text-stone-900 mb-3">
          Welcome
        </h1>

        <p className="text-stone-600 mb-8 leading-relaxed">
          Let's plan the soundtrack to your celebration. Sign in to start building your
          perfect musical experience.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!magicLinkSent ? (
          <div className="space-y-4">
            {/* Email magic link form */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                required
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={sending}>
                {sending ? 'Sending...' : 'Sign in with Email'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-stone-50 px-3 text-stone-400">or</span>
              </div>
            </div>

            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {isDemo && (
              <p className="text-xs text-stone-400 mt-4">
                Demo mode — Firebase not configured. <a href="#" onClick={(e) => { e.preventDefault(); navigate('/phase/1'); }} className="underline hover:text-stone-600">Skip to app</a>
              </p>
            )}
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <div className="text-emerald-600 text-3xl mb-3">✓</div>
              <p className="text-emerald-800 font-medium">Check your email!</p>
              <p className="text-emerald-600 text-sm mt-2">
                We sent a sign-in link to <strong>{email}</strong>.
                Click the link in the email to continue.
              </p>
            </div>
            <button
              onClick={() => { setMagicLinkSent(false); setError(null); }}
              className="mt-4 text-sm text-stone-500 hover:text-stone-700 underline cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-stone-300 tracking-widest uppercase">
            Powered by Cue
          </p>
        </div>
      </div>
    </div>
  );
}
