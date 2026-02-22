import { useState } from 'react';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';
import Select from '../common/Select';

const steps = [
  'Immediate Family',
  'Siblings & Wedding Party',
  'Key Relatives',
  'Other VIPs',
  'Pronunciations',
  'Announcement Style',
];

export default function Phase2People() {
  const { formData, updateField, updateNestedField, setFormData } = useFormData();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);

  const handleStepChange = (s) => {
    setStep(s);
    addToast('Saved!', 'success', 1500);
  };

  return (
    <PhaseWrapper
      phase={2}
      phaseTitle="Your People"
      steps={steps}
      currentStep={step}
      onStepChange={handleStepChange}
      nextPath="/phase/3"
      prevPath="/phase/1"
    >
      {step === 0 && <StepFamily formData={formData} updateNestedField={updateNestedField} />}
      {step === 1 && <StepSiblings formData={formData} updateField={updateField} addToast={addToast} />}
      {step === 2 && <StepRelatives formData={formData} updateField={updateField} addToast={addToast} />}
      {step === 3 && <StepVIPs formData={formData} updateField={updateField} addToast={addToast} />}
      {step === 4 && <StepPronunciations formData={formData} updateField={updateField} setFormData={setFormData} />}
      {step === 5 && <StepAnnouncement formData={formData} setFormData={setFormData} />}
    </PhaseWrapper>
  );
}

function StepFamily({ formData, updateNestedField }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-stone-600">Who are the immediate family members we should know about?</p>

      <div className="border border-stone-200 rounded-xl p-5 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-stone-800">Bride's Parents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Father's Name"
            value={formData.brideParents?.father || ''}
            onChange={(e) => updateNestedField('brideParents', 'father', e.target.value)}
          />
          <Input
            label="Mother's Name"
            value={formData.brideParents?.mother || ''}
            onChange={(e) => updateNestedField('brideParents', 'mother', e.target.value)}
          />
        </div>
      </div>

      <div className="border border-stone-200 rounded-xl p-5 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-stone-800">Groom's Parents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Father's Name"
            value={formData.groomParents?.father || ''}
            onChange={(e) => updateNestedField('groomParents', 'father', e.target.value)}
          />
          <Input
            label="Mother's Name"
            value={formData.groomParents?.mother || ''}
            onChange={(e) => updateNestedField('groomParents', 'mother', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function PersonList({ items, updateField, fieldName, addToast, title, subtitle }) {
  const addPerson = () => {
    const newPerson = { id: Date.now().toString(), name: '', role: '', side: 'bride', pronunciation: false };
    updateField(fieldName, [...(items || []), newPerson]);
    addToast('Person added!', 'success', 1500);
  };

  const updatePerson = (id, field, value) => {
    updateField(fieldName, (items || []).map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removePerson = (id) => {
    updateField(fieldName, (items || []).filter((p) => p.id !== id));
    addToast('Removed', 'info', 1500);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <p className="text-stone-600">{subtitle}</p>
      {(items || []).map((person) => (
        <Card key={person.id} className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <Input
                label="Name"
                value={person.name}
                onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                placeholder="Full name"
              />
              <Input
                label="Role / Relationship"
                value={person.role}
                onChange={(e) => updatePerson(person.id, 'role', e.target.value)}
                placeholder="e.g., Maid of Honor"
              />
            </div>
            <button
              onClick={() => removePerson(person.id)}
              className="ml-2 mt-6 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {['bride', 'groom'].map((side) => (
                <button
                  key={side}
                  onClick={() => updatePerson(person.id, 'side', side)}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                    person.side === side
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-stone-300 text-stone-500'
                  }`}
                >
                  {side === 'bride' ? "Bride's Side" : "Groom's Side"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer">
              <input
                type="checkbox"
                checked={person.pronunciation || false}
                onChange={(e) => updatePerson(person.id, 'pronunciation', e.target.checked)}
                className="rounded"
              />
              Flag for pronunciation
            </label>
          </div>
        </Card>
      ))}
      <Button variant="secondary" size="sm" onClick={addPerson}>
        + Add Person
      </Button>
    </div>
  );
}

function StepSiblings({ formData, updateField, addToast }) {
  return (
    <PersonList
      items={formData.siblings}
      updateField={updateField}
      fieldName="siblings"
      addToast={addToast}
      title="Siblings & Wedding Party"
      subtitle="Add siblings and members of the wedding party."
    />
  );
}

function StepRelatives({ formData, updateField, addToast }) {
  return (
    <PersonList
      items={formData.keyRelatives}
      updateField={updateField}
      fieldName="keyRelatives"
      addToast={addToast}
      title="Key Relatives"
      subtitle="Grandparents, aunts, uncles, or anyone with a special role."
    />
  );
}

function StepVIPs({ formData, updateField, addToast }) {
  return (
    <PersonList
      items={formData.otherVIPs}
      updateField={updateField}
      fieldName="otherVIPs"
      addToast={addToast}
      title="Other VIPs"
      subtitle="Anyone getting announced, giving speeches, or otherwise important."
    />
  );
}

function StepPronunciations({ formData, setFormData }) {
  const allPeople = [
    ...(formData.siblings || []),
    ...(formData.keyRelatives || []),
    ...(formData.otherVIPs || []),
  ].filter((p) => p.pronunciation && p.name);

  const pronunciations = formData.pronunciations || {};

  const updatePronunciation = (name, phonetic) => {
    setFormData((prev) => ({
      ...prev,
      pronunciations: { ...prev.pronunciations, [name]: phonetic },
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">
        Help us pronounce these names correctly. Type out the phonetic spelling.
      </p>
      {allPeople.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <p className="text-lg mb-2">No names flagged</p>
          <p className="text-sm">Go back and flag names that need pronunciation help.</p>
        </div>
      ) : (
        allPeople.map((person) => (
          <div key={person.id} className="border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-800">{person.name}</span>
              <span className="text-xs text-stone-400">{person.role}</span>
            </div>
            <Input
              label="Phonetic pronunciation"
              value={pronunciations[person.name] || ''}
              onChange={(e) => updatePronunciation(person.name, e.target.value)}
              placeholder="e.g., AR-jun Shah"
            />
            <button className="flex items-center gap-2 text-xs text-gold-600 hover:text-gold-700 cursor-pointer">
              🎙️ Record pronunciation (demo)
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function StepAnnouncement({ formData, setFormData }) {
  const allPeople = [];
  if (formData.brideParents?.father) allPeople.push({ name: formData.brideParents.father, role: "Bride's Father" });
  if (formData.brideParents?.mother) allPeople.push({ name: formData.brideParents.mother, role: "Bride's Mother" });
  if (formData.groomParents?.father) allPeople.push({ name: formData.groomParents.father, role: "Groom's Father" });
  if (formData.groomParents?.mother) allPeople.push({ name: formData.groomParents.mother, role: "Groom's Mother" });
  (formData.siblings || []).forEach((p) => { if (p.name) allPeople.push(p); });
  (formData.keyRelatives || []).forEach((p) => { if (p.name) allPeople.push(p); });
  (formData.otherVIPs || []).forEach((p) => { if (p.name) allPeople.push(p); });

  const styles = formData.announcementStyles || {};

  const updateStyle = (name, style) => {
    setFormData((prev) => ({
      ...prev,
      announcementStyles: { ...prev.announcementStyles, [name]: style },
    }));
  };

  const styleOptions = [
    { value: 'formal', label: 'Formal (Mr. & Mrs.)' },
    { value: 'first', label: 'First Names' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <p className="text-stone-600">How should each person be announced?</p>
      {allPeople.map((person) => (
        <div key={person.name} className="flex items-center justify-between border border-stone-200 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-stone-800">{person.name}</p>
            <p className="text-xs text-stone-400">{person.role}</p>
          </div>
          <div className="flex gap-1">
            {styleOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => updateStyle(person.name, s.value)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  (styles[person.name] || 'formal') === s.value
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
