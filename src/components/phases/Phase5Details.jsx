import { useState } from 'react';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Card from '../common/Card';
import { equipmentOptions } from '../../data/demoData';

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
  const vendorTypes = [
    { key: 'planner', label: 'Wedding Planner / Coordinator' },
    { key: 'photographer', label: 'Photographer' },
    { key: 'videographer', label: 'Videographer' },
    { key: 'decorator', label: 'Decorator / Florist' },
  ];

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
      {vendorTypes.map(({ key, label }) => {
        const vendor = vendors[key] || {};
        return (
          <Card key={key} className="p-5 space-y-3">
            <h3 className="font-medium text-stone-800">{label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Name"
                value={vendor.name || ''}
                onChange={(e) => updateVendor(key, 'name', e.target.value)}
                placeholder="Contact name"
              />
              <Input
                label="Phone"
                type="tel"
                value={vendor.phone || ''}
                onChange={(e) => updateVendor(key, 'phone', e.target.value)}
                placeholder="(555) 000-0000"
              />
              <Input
                label="Email"
                type="email"
                value={vendor.email || ''}
                onChange={(e) => updateVendor(key, 'email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </Card>
        );
      })}
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
