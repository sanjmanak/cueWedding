import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';

export default function Footer() {
  const { resetToDemo } = useFormData();
  const { addToast } = useToast();

  const handleReset = () => {
    if (window.confirm('Reset all data to demo defaults? This cannot be undone.')) {
      resetToDemo();
      addToast('Demo data restored!', 'info');
    }
  };

  return (
    <footer className="border-t border-stone-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-stone-400">
          Cue — Wedding DJ Planning Platform &middot; Demo Mode
        </p>
        <button
          onClick={handleReset}
          className="text-xs text-stone-400 hover:text-stone-600 px-3 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          Reset Demo Data
        </button>
      </div>
    </footer>
  );
}
