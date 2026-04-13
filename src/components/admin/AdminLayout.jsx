import { Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '◻' },
  { path: '/admin/weddings/new', label: 'New Wedding', icon: '+' },
];

export default function AdminLayout() {
  const { user, loading, isAdmin, signOut, isDemo } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isDemo) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="max-w-md text-center p-8">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Admin Access Required</h1>
          <p className="text-stone-500 text-sm mb-6">
            Your account ({user?.email}) does not have admin permissions.
            Contact your team lead to get access.
          </p>
          <Link to="/" className="text-sm text-stone-600 hover:text-stone-900 underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Admin header */}
      <header className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2">
              <img
                src={import.meta.env.BASE_URL + 'logo.png'}
                alt="Cue"
                className="h-8 w-auto brightness-0 invert"
              />
              <span className="text-xs font-medium bg-amber-500 text-stone-900 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-stone-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400 hidden sm:inline truncate max-w-[160px]">
              {user?.email || 'Demo Admin'}
            </span>
            <button
              onClick={() => signOut()}
              className="text-xs text-stone-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Admin content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
