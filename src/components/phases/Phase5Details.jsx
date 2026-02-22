import { useState } from 'react';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Card from '../common/Card';
import { equipmentOptions } from '../../data/demoData';

const vendorTypes = [
  { key: 'planner', label: 'Planner / Coordinator', emoji: '📋' },
  { key: 'photographer', label: 'Photographer', emoji: '📸' },
  { key: 'videographer', label: 'Videographer', emoji: '🎬' },
  { key: 'decorator', label: 'Decorator / Florist', emoji: '💐' },
];

const steps = [
  'Vendor Contacts',
  'Production Preferences',
  'Surprises',
  'Additional Notes',
];

export default function Phase5Details() {
  const { formData, setFormData, updateField } = useFormData();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);

  const handleStepChange = (s) => {
    setStep(s);
    addToast('Saved!', 'success', 1500);
  };

  return (
    <PhaseWrapper
      phase={5}
      phaseTitle="Final Details"
      steps={steps}
      currentStep={step}
      onStepChange={handleStepChange}
      nextPath="/phase/6"
      prevPath="/phase/4"
    >
      {step === 0 && <StepVendors formData={formData} setFormData={setFormData} />}
      {step === 1 && <StepProduction formData={formData} updateField={updateField} setFormData={setFormData} />}
      {step === 2 && <StepSurprises formData={formData} updateField={updateField} />}
      {step === 3 && <StepNotes formData={formData} updateField={updateField} />}
    </PhaseWrapper>
  );
}

function StepVendors({ formData, setFormData }) {
  const vendors = formData.vendors || {};
  const [activeVendor, setActiveVendor] = useState(null);

  const updateVendor = (key, field, value) => {
    setFormData((prev) => ({
      ...prev,
      vendors: {
        ...prev.vendors,
        [key]: { ...(prev.vendors?.[key] || {}), [field]: value },
      },
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">Who else is on your vendor team? We'll coordinate with them.</p>
      <div className="grid grid-cols-2 gap-3">
        {vendorTypes.map(({ key, label, emoji }) => {
          const vendor = vendors[key] || {};
          const hasData = vendor.name || vendor.phone || vendor.email;
          const isActive = activeVendor === key;
          return (
            <button
              key={key}
              onClick={() => setActiveVendor(isActive ? null : key)}
              className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-gold-400 bg-gold-50 shadow-sm'
                  : hasData
                  ? 'border-green-300 bg-white'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <span className="text-3xl">{emoji}</span>
              <span className={`text-sm font-medium text-center leading-tight ${isActive ? 'text-gold-800' : 'text-stone-700'}`}>
                {label}
              </span>
              {hasData && !isActive && (
                <span className="text-xs text-stone-400 truncate max-w-full">{vendor.name}</span>
              )}
              {hasData && <span className="text-xs text-green-600 font-medium">Added</span>}
            </button>
          );
        })}
      </div>

      {activeVendor && (
        <Card className="p-5 space-y-3 animate-fade-in-up">
          <h3 className="font-medium text-stone-800">
            {vendorTypes.find((v) => v.key === activeVendor)?.emoji}{' '}
            {vendorTypes.find((v) => v.key === activeVendor)?.label}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Name"
              value={vendors[activeVendor]?.name || ''}
              onChange={(e) => updateVendor(activeVendor, 'name', e.target.value)}
              placeholder="Contact name"
            />
            <Input
              label="Phone"
              type="tel"
              value={vendors[activeVendor]?.phone || ''}
              onChange={(e) => updateVendor(activeVendor, 'phone', e.target.value)}
              placeholder="(555) 000-0000"
            />
            <Input
              label="Email"
              type="email"
              value={vendors[activeVendor]?.email || ''}
              onChange={(e) => updateVendor(activeVendor, 'email', e.target.value)}
              placeholder="email@example.com"
            />
          </div>
        </Card>
      )}
    </div>
  );
}

function StepProduction({ formData, updateField, setFormData }) {
  const equipment = formData.equipment || [];

  const toggleEquipment = (item) => {
    const next = equipment.includes(item)
      ? equipment.filter((e) => e !== item)
      : [...equipment, item];
    updateField('equipment', next);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <label className="text-sm font-medium text-stone-700 mb-3 block">Preferred Lighting Color</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={formData.lightingColor || '#d97706'}
            onChange={(e) => updateField('lightingColor', e.target.value)}
            className="w-12 h-12 rounded-lg border border-stone-300 cursor-pointer"
          />
          <span className="text-sm text-stone-500">{formData.lightingColor || '#d97706'}</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-stone-700 mb-3 block">Equipment Wishlist</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {equipmentOptions.map((item) => (
            <label
              key={item}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                equipment.includes(item)
                  ? 'bg-gold-50 border-gold-400 text-gold-800'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <input
                type="checkbox"
                checked={equipment.includes(item)}
                onChange={() => toggleEquipment(item)}
                className="rounded"
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-stone-700 mb-3 block">Photo Booth</label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => updateField('photoBooth', val)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                formData.photoBooth === val
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400'
              }`}
            >
              {val ? 'Yes, please!' : 'No thanks'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepSurprises({ formData, updateField }) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">
        Any surprises, special requests, or creative ideas? Nothing is too crazy!
      </p>
      <TextArea
        label="Surprises & Special Requests"
        value={formData.surprises || ''}
        onChange={(e) => updateField('surprises', e.target.value)}
        placeholder="e.g., We want a special mashup that transitions from a slow song into a high-energy Bollywood number..."
      />
      <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
        <p className="text-gold-800 text-sm">
          💡 The more details you share, the better we can make your vision come to life!
        </p>
      </div>
    </div>
  );
}

function StepNotes({ formData, updateField }) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">
        Anything else we should know? Last chance to add details before review.
      </p>
      <TextArea
        label="Additional Notes"
        value={formData.additionalNotes || ''}
        onChange={(e) => updateField('additionalNotes', e.target.value)}
        placeholder="e.g., Please coordinate with our videographer for announcements. Grandmother needs a chair near the dance floor..."
      />
    </div>
  );
}
