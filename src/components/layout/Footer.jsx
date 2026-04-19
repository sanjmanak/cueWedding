import { useFormData } from '../../context/FormDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Footer() {
  const { resetToDemo } = useFormData();
  const { isDemo } = useAuth();
  const { addToast } = useToast();

  // Two-step confirmation — single confirms have fired by accident in the past
  // and blown away a finished run sheet.
  const handleRestoreDemo = () => {
    const first = window.confirm(
      'Restore demo data?\n\nThis will OVERWRITE every answer you have entered — names, people, songs, timelines, everything. This cannot be undone.'
    );
    if (!first) return;
    const second = window.prompt(
      'Final check: to confirm you want to overwrite all of your data with demo data, type RESTORE below.'
    );
    if ((second || '').trim().toUpperCase() !== 'RESTORE') {
      addToast('Restore cancelled.', 'info');
      return;
    }
    resetToDemo();
    addToast('Demo data restored.', 'info');
  };

  return (
    <footer className="border-t border-stone-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-stone-400">
          Cue — Wedding DJ Planning Platform{isDemo ? ' \u00B7 Demo Mode' : ''}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRestoreDemo}
            className="text-xs text-stone-400 hover:text-stone-600 px-3 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Restore Demo Data
          </button>
        </div>
      </div>
    </footer>
  );
}
