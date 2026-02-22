import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import { useProgress } from '../../hooks/useProgress';
import { generateRunSheet } from '../../utils/generatePDF';
import PhaseWrapper from '../common/PhaseWrapper';
import Button from '../common/Button';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import { eventOptions } from '../../data/demoData';

const steps = ['Summary Dashboard', 'Final Review', 'Confirmation'];

export default function Phase6Review() {
  const { formData, setFormData, updateField } = useFormData();
  const { addToast } = useToast();
  const progress = useProgress(formData);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const handleStepChange = (s) => {
    if (s === 2 && !formData.confirmed) {
      addToast('Please confirm your information first.', 'error');
      return;
    }
    setStep(s);
    if (s === 2 && formData.confirmed) {
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d97706', '#f59e0b', '#fbbf24', '#10b981', '#ffffff'],
        });
      }, 300);
    }
  };

  return (
    <PhaseWrapper
      phase={6}
      phaseTitle="Review & Sign-off"
      steps={steps}
      currentStep={step}
      onStepChange={handleStepChange}
      prevPath="/phase/5"
    >
      {step === 0 && <StepSummary formData={formData} progress={progress} navigate={navigate} />}
      {step === 1 && <StepFinalReview formData={formData} updateField={updateField} setFormData={setFormData} />}
      {step === 2 && <StepConfirmation formData={formData} addToast={addToast} />}
    </PhaseWrapper>
  );
}

function SectionCard({ title, progress, items, editPath, navigate }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-500'
            }`}
          >
            {progress === 100 ? '✓' : `${progress}%`}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-800">{title}</p>
            <ProgressBar value={progress} className="mt-1" showLabel={false} />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 cursor-pointer"
          >
            {expanded ? 'Collapse' : 'Details'}
          </button>
          {editPath && (
            <button
              onClick={() => navigate(editPath)}
              className="text-xs text-gold-600 hover:text-gold-700 px-2 py-1 cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      {expanded && items && (
        <div className="mt-3 pt-3 border-t border-stone-100 space-y-1">
          {items.map((item, i) => (
            <p key={i} className="text-xs text-stone-500">{item}</p>
          ))}
        </div>
      )}
    </Card>
  );
}

function StepSummary({ formData, progress, navigate }) {
  const sections = [
    {
      title: 'Your Story',
      progress: progress.phases[1],
      editPath: '/phase/1',
      items: [
        `${formData.brideName} & ${formData.groomName}`,
        `First Event: ${formData.firstEventDate || 'Not set'}`,
        `Events: ${(formData.selectedEvents || []).map((e) => eventOptions.find((o) => o.id === e)?.label).join(', ') || 'None'}`,
        `Vibe: ${(formData.vibeWords || []).join(', ') || 'Not set'}`,
      ],
    },
    {
      title: 'Your People',
      progress: progress.phases[2],
      editPath: '/phase/2',
      items: [
        `Bride's parents: ${formData.brideParents?.father || '—'} & ${formData.brideParents?.mother || '—'}`,
        `Groom's parents: ${formData.groomParents?.father || '—'} & ${formData.groomParents?.mother || '—'}`,
        `Wedding party: ${formData.siblings?.length || 0} members`,
        `VIPs: ${(formData.otherVIPs?.length || 0) + (formData.keyRelatives?.length || 0)} people`,
      ],
    },
    {
      title: 'Your Soundtrack',
      progress: progress.phases[3],
      editPath: '/phase/3',
      items: [
        `Must-play: ${formData.mustPlaySongs?.length || 0} songs`,
        `Do-not-play: ${formData.doNotPlaySongs?.length || 0} songs`,
        `Special moments: ${Object.values(formData.specialMoments || {}).filter((m) => m.type).length} configured`,
        `Custom mixes: ${formData.customMixes?.length || 0}`,
      ],
    },
    {
      title: 'Your Program',
      progress: progress.phases[4],
      editPath: '/phase/4',
      items: (() => {
        const timelines = formData.timelines || {};
        let perfCount = 0;
        let speechCount = 0;
        Object.values(timelines).forEach((blocks) => {
          (blocks || []).forEach((b) => {
            if (b.type === 'performance') perfCount++;
            if (b.type === 'speech') speechCount++;
          });
        });
        return [
          `Templates: ${Object.keys(formData.eventTemplates || {}).length} events configured`,
          `Performances: ${perfCount}`,
          `Speeches: ${speechCount}`,
          `Ceremony traditions: ${formData.ceremonyTraditions?.length || 0}`,
        ];
      })(),
    },
    {
      title: 'Final Details',
      progress: progress.phases[5],
      editPath: '/phase/5',
      items: [
        `Vendors: ${Object.values(formData.vendors || {}).filter((v) => v.name).length} contacts`,
        `Equipment: ${formData.equipment?.length || 0} items`,
        `Photo booth: ${formData.photoBooth ? 'Yes' : 'No'}`,
      ],
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-6">
        <p className="text-stone-600">Here's a summary of everything you've told us.</p>
        <div className="mt-3">
          <ProgressBar value={Math.round(progress.total)} className="max-w-xs mx-auto" />
          <p className="text-xs text-stone-400 mt-1">{Math.round(progress.total)}% complete</p>
        </div>
      </div>
      <div className="space-y-3">
        {sections.map((section) => (
          <SectionCard key={section.title} {...section} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}

function StepFinalReview({ formData, updateField, setFormData }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-semibold text-stone-900 mb-2">
          Everything look good?
        </h2>
        <p className="text-stone-600">
          Take a final look and confirm when you're ready.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.confirmed || false}
            onChange={(e) => updateField('confirmed', e.target.checked)}
            className="mt-1 rounded"
          />
          <span className="text-sm text-stone-700">
            I confirm that all information provided is accurate and complete to the best of my knowledge.
            I understand this will be used to plan our wedding entertainment.
          </span>
        </label>

        <div className="pt-4 border-t border-stone-200">
          <label className="text-sm font-medium text-stone-700 mb-2 block">
            Signature (type your full name)
          </label>
          <input
            value={formData.signatureName || ''}
            onChange={(e) => {
              updateField('signatureName', e.target.value);
              updateField('signatureDate', new Date().toISOString().split('T')[0]);
            }}
            placeholder="Type your full name"
            className="w-full px-4 py-3 rounded-lg border border-stone-300 text-lg italic font-heading focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          {formData.signatureDate && (
            <p className="text-xs text-stone-400 mt-2">
              Signed on {formData.signatureDate}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function StepConfirmation({ formData, addToast }) {
  const handleDownload = async () => {
    try {
      await generateRunSheet(formData);
      addToast('Run sheet downloaded!', 'success');
    } catch (err) {
      addToast('Error generating PDF. Check console.', 'error');
      console.error(err);
    }
  };

  return (
    <div className="text-center space-y-8 animate-fade-in-up py-8">
      <div>
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-heading text-3xl font-semibold text-stone-900 mb-2">
          You're all set!
        </h2>
        <p className="text-stone-600 max-w-md mx-auto">
          Thank you, {formData.brideName} & {formData.groomName}. Your wedding planner is complete.
          We can't wait to make your celebration unforgettable.
        </p>
      </div>

      <Button variant="gold" size="xl" onClick={handleDownload}>
        📄 Download Run Sheet (PDF)
      </Button>

      <Card className="p-6 max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-stone-200 mx-auto mb-3 flex items-center justify-center text-2xl">
          🎧
        </div>
        <h3 className="font-heading text-lg font-semibold text-stone-800">Your DJ Team</h3>
        <p className="text-sm text-stone-600 mt-1">Special Occasions DJ</p>
        <p className="text-xs text-stone-400 mt-1">We'll be in touch to finalize everything!</p>
      </Card>

      {formData.signatureName && (
        <div className="pt-4 border-t border-stone-200 inline-block">
          <p className="text-sm text-stone-500">Signed by</p>
          <p className="font-heading text-xl italic text-stone-800">{formData.signatureName}</p>
          <p className="text-xs text-stone-400">{formData.signatureDate}</p>
        </div>
      )}
    </div>
  );
}
