import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import ProgressBar from './ProgressBar';

export default function PhaseWrapper({
  phase,
  phaseTitle,
  steps,
  currentStep,
  onStepChange,
  children,
  nextPath,
  prevPath,
}) {
  const navigate = useNavigate();
  const totalSteps = steps.length;

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
      {/* Phase header */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest text-gold-600 uppercase mb-1">
          Phase {phase} of 6
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-stone-900 mb-2">
          {phaseTitle}
        </h1>
        <ProgressBar value={currentStep + 1} max={totalSteps} className="mt-4" />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-stone-400">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs text-stone-500 font-medium">
            {steps[currentStep]}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-stone-200">
        <Button variant="ghost" onClick={handleBack}>
          ← Back
        </Button>
        <Button variant="primary" onClick={handleNext}>
          {currentStep < totalSteps - 1 ? 'Continue →' : 'Next Phase →'}
        </Button>
      </div>
    </div>
  );
}
