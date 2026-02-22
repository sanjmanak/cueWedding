import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';

const phases = [
  { num: 1, label: 'Story', path: '/phase/1' },
  { num: 2, label: 'People', path: '/phase/2' },
  { num: 3, label: 'Soundtrack', path: '/phase/3' },
  { num: 4, label: 'Program', path: '/phase/4' },
  { num: 5, label: 'Details', path: '/phase/5' },
  { num: 6, label: 'Review', path: '/phase/6' },
];

export default function Header() {
  const { formData } = useFormData();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPhase = getCurrentPhase(location.pathname);

  const handleSaveExit = () => {
    addToast('Progress saved!', 'success');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img
            src={import.meta.env.BASE_URL + 'logo.png'}
            alt="Special Occasions DJ"
            className="h-10 w-auto"
          />
        </Link>

        {/* Phase indicators - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          {phases.map((phase) => (
            <Link
              key={phase.num}
              to={phase.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                currentPhase === phase.num
                  ? 'bg-stone-900 text-white'
                  : currentPhase > phase.num
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentPhase > phase.num ? 'bg-emerald-500 text-white' : ''
              }`}>
                {currentPhase > phase.num ? '✓' : phase.num}
              </span>
              <span className="hidden lg:inline">{phase.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {formData.brideName && formData.groomName && (
            <span className="hidden sm:inline text-sm font-medium text-stone-600">
              {formData.brideName} & {formData.groomName}
            </span>
          )}
          <button
            onClick={handleSaveExit}
            className="text-xs font-medium text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </div>

      {/* Mobile phase indicator */}
      {currentPhase > 0 && (
        <div className="md:hidden px-4 pb-2">
          <div className="flex gap-1">
            {phases.map((phase) => (
              <Link
                key={phase.num}
                to={phase.path}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  currentPhase >= phase.num
                    ? currentPhase === phase.num ? 'bg-gold-500' : 'bg-emerald-400'
                    : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function getCurrentPhase(pathname) {
  const match = pathname.match(/\/phase\/(\d)/);
  return match ? parseInt(match[1]) : 0;
}
