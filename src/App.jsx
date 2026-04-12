import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Landing from './components/Landing';
import Phase1Story from './components/phases/Phase1Story';
import Phase2People from './components/phases/Phase2People';
import Phase3Soundtrack from './components/phases/Phase3Soundtrack';
import Phase4Program from './components/phases/Phase4Program';
import Phase5Details from './components/phases/Phase5Details';
import Phase6Review from './components/phases/Phase6Review';

function ProtectedRoute({ children }) {
  const { user, loading, isDemo } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500 text-sm">Loading your wedding...</p>
        </div>
      </div>
    );
  }

  if (!user && !isDemo) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/phase/1" element={<ProtectedRoute><Phase1Story /></ProtectedRoute>} />
          <Route path="/phase/2" element={<ProtectedRoute><Phase2People /></ProtectedRoute>} />
          <Route path="/phase/3" element={<ProtectedRoute><Phase3Soundtrack /></ProtectedRoute>} />
          <Route path="/phase/4" element={<ProtectedRoute><Phase4Program /></ProtectedRoute>} />
          <Route path="/phase/5" element={<ProtectedRoute><Phase5Details /></ProtectedRoute>} />
          <Route path="/phase/6" element={<ProtectedRoute><Phase6Review /></ProtectedRoute>} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
