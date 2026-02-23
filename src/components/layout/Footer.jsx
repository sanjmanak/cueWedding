import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';

export default function Footer() {
  const { resetToBlank, resetToDemo } = useFormData();
  const { addToast } = useToast();

  const handleReset = () => {
    if (window.confirm('Clear all data and start fresh? This cannot be undone.')) {
      resetToBlank();
      addToast('All data cleared — fresh start!', 'info');
    }
  };

  const handleRestoreDemo = () => {
    if (window.confirm('Restore demo data? This will overwrite your current entries.')) {
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleRestoreDemo}
            className="text-xs text-stone-400 hover:text-stone-600 px-3 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Restore Demo Data
          </button>
          <button
            onClick={handleReset}
            className="text-xs text-red-400 hover:text-red-600 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </footer>
  );
}
