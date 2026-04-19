import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import ProgressBar from './ProgressBar';
import Avatar from './Avatar';
import { useFormData } from '../../context/FormDataContext';
import { formatRelativeTime } from '../../utils/time';

export default function PhaseWrapper({
  phase,
  phaseTitle,
  steps,
  currentStep,
  onStepChange,
  children,
  nextPath,
  prevPath,
  showCompletion = false,
}) {
  const navigate = useNavigate();
  const { formData, profilePhoto, saveState } = useFormData();
  const totalSteps = steps.length;
  const isCompletionStep = showCompletion && currentStep === totalSteps - 1;
  const coupleName = [formData?.brideName, formData?.groomName].filter(Boolean).join(' & ');
  const showCoupleChip = Boolean(profilePhoto?.dataUrl || coupleName);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1);
    } else if (nextPath) {
      navigate(nextPath);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    } else if (prevPath) {
      navigate(prevPath);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Phase header — hidden on completion step */}
      {!isCompletionStep && (
        <div className="mb-8">
          {showCoupleChip && (
            <div className="flex items-center gap-2.5 mb-4">
              <Avatar
                photoUrl={profilePhoto?.dataUrl}
                brideName={formData?.brideName}
                groomName={formData?.groomName}
                size={36}
              />
              {coupleName && (
                <span className="text-sm font-medium text-stone-700 truncate">
                  {coupleName}
                </span>
              )}
            </div>
          )}
          <p className="text-xs font-semibold tracking-widest text-gold-600 uppercase mb-1">
            Phase {phase} of 6
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-stone-900 mb-2">
            {phaseTitle}
          </h1>
          <ProgressBar value={currentStep + 1} max={totalSteps} className="mt-4" />
          <div className="flex justify-between items-center gap-3 mt-2">
            <span className="text-xs text-stone-400">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <div className="flex items-center gap-3 min-w-0">
              <SavedIndicator saveState={saveState} />
              <span className="text-xs text-stone-500 font-medium truncate">
                {steps[currentStep]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Navigation — different layout for completion step */}
      {!isCompletionStep && (
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-stone-200">
          <Button variant="ghost" onClick={handleBack}>
            ← Back
          </Button>
          <Button variant="primary" onClick={handleNext}>
            {currentStep < totalSteps - 1 ? 'Continue →' : 'Next Phase →'}
          </Button>
        </div>
      )}

      {isCompletionStep && (
        <div className="flex justify-center mt-6">
          <Button variant="ghost" onClick={() => onStepChange(0)}>
            ← Review & Edit Phase {phase}
          </Button>
        </div>
      )}
    </div>
  );
}

// Surfaces the debounced Firestore write lifecycle in the wizard header.
// Hidden in demo mode (saveState is null) and before the first user edit.
function SavedIndicator({ saveState }) {
  // Tick once a minute so "Saved · 2m ago" advances without another save.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!saveState) return null;
  const { status, lastSavedAt } = saveState;
  if (status === 'saved' && !lastSavedAt) return null;

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-stone-400">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
        Saving…
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Save failed — retrying
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-stone-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Saved · {formatRelativeTime(lastSavedAt)}
    </span>
  );
}
