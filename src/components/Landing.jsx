import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormData } from '../context/FormDataContext';
import Button from './common/Button';

export default function Landing() {
  const { formData } = useFormData();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alexsa@demo.com');
  const [showLogin, setShowLogin] = useState(false);

  const handleMagicLink = (e) => {
    e.preventDefault();
    setShowLogin(true);
    setTimeout(() => navigate('/phase/1'), 1500);
  };

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
          Welcome{formData.brideName && formData.groomName ? ',' : ''}
        </h1>
        {formData.brideName && formData.groomName && (
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-gold-600 mb-6">
            {formData.brideName} & {formData.groomName}
          </h2>
        )}

        <p className="text-stone-600 mb-8 leading-relaxed">
          Let's plan the soundtrack to your celebration. This interactive planner helps us create the
          perfect musical experience for every moment of your wedding.
        </p>

        {!showLogin ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Send Magic Link ✨
            </Button>
            <p className="text-xs text-stone-400">
              Demo mode — no real email sent. Click to continue.
            </p>
          </form>
        ) : (
          <div className="animate-fade-in-up">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <div className="text-emerald-600 text-3xl mb-3">✓</div>
              <p className="text-emerald-800 font-medium">Magic link sent!</p>
              <p className="text-emerald-600 text-sm mt-1">Redirecting you now...</p>
            </div>
          </div>
        )}

        {/* Quick start */}
        <div className="mt-10 pt-8 border-t border-stone-200">
          <p className="text-xs text-stone-400 mb-4">Or jump right in</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => navigate('/phase/1')}>
              Start Planning
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/phase/6')}>
              Review Summary
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="mt-16 text-center">
        <p className="text-xs text-stone-300 tracking-widest uppercase">
          Powered by Cue
        </p>
      </div>
    </div>
  );
}
