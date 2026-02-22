import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

const steps = [
  'Immediate Family',
  'Siblings & Wedding Party',
  'Key Relatives',
  'Other VIPs',
  'Pronunciations',
  'Announcement Style',
  'Phase 2 Complete!',
];

export default function Phase2People() {
  const { formData, updateField, updateNestedField, setFormData } = useFormData();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);

  const handleStepChange = (s) => {
    setStep(s);
    if (s < steps.length - 1) {
      addToast('Saved!', 'success', 1500);
    }
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
      showCompletion={step === steps.length - 1}
    >
      {step === 0 && <StepFamily formData={formData} updateNestedField={updateNestedField} />}
      {step === 1 && <StepSiblings formData={formData} updateField={updateField} addToast={addToast} />}
      {step === 2 && <StepRelatives formData={formData} updateField={updateField} addToast={addToast} />}
      {step === 3 && <StepVIPs formData={formData} updateField={updateField} addToast={addToast} />}
      {step === 4 && <StepPronunciations formData={formData} setFormData={setFormData} />}
      {step === 5 && <StepAnnouncement formData={formData} setFormData={setFormData} />}
      {step === 6 && <Phase2Summary formData={formData} />}
    </PhaseWrapper>
  );
}

function ExpandableSection({ icon, title, subtitle, defaultOpen = false, children, count }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
      isOpen ? 'border-gold-300 shadow-sm' : 'border-stone-200 hover:border-stone-300'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 text-left cursor-pointer"
      >
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg font-semibold text-stone-800">{title}</h3>
          <p className="text-sm text-stone-500">{subtitle}</p>
        </div>
        {count > 0 && (
          <span className="text-xs bg-gold-100 text-gold-700 px-2.5 py-1 rounded-full font-medium">
            {count}
          </span>
        )}
        <span className={`text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-up border-t border-stone-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function StepFamily({ formData, updateNestedField }) {
  const brideComplete = formData.brideParents?.father || formData.brideParents?.mother;
  const groomComplete = formData.groomParents?.father || formData.groomParents?.mother;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-2">
        <p className="text-stone-500">Let's meet the families. Tap each to fill in the details.</p>
      </div>

      <ExpandableSection
        icon="👰"
        title="Bride's Parents"
        subtitle={brideComplete ? `${formData.brideParents?.father || '—'} & ${formData.brideParents?.mother || '—'}` : 'Tap to add names'}
        defaultOpen={true}
        count={brideComplete ? undefined : 0}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Father's Name"
            value={formData.brideParents?.father || ''}
            onChange={(e) => updateNestedField('brideParents', 'father', e.target.value)}
            placeholder="Father's full name"
          />
          <Input
            label="Mother's Name"
            value={formData.brideParents?.mother || ''}
            onChange={(e) => updateNestedField('brideParents', 'mother', e.target.value)}
            placeholder="Mother's full name"
          />
        </div>
      </ExpandableSection>

      <ExpandableSection
        icon="🤵"
        title="Groom's Parents"
        subtitle={groomComplete ? `${formData.groomParents?.father || '—'} & ${formData.groomParents?.mother || '—'}` : 'Tap to add names'}
        defaultOpen={!brideComplete}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Father's Name"
            value={formData.groomParents?.father || ''}
            onChange={(e) => updateNestedField('groomParents', 'father', e.target.value)}
            placeholder="Father's full name"
          />
          <Input
            label="Mother's Name"
            value={formData.groomParents?.mother || ''}
            onChange={(e) => updateNestedField('groomParents', 'mother', e.target.value)}
            placeholder="Mother's full name"
          />
        </div>
      </ExpandableSection>
    </div>
  );
}

function PersonList({ items, updateField, fieldName, addToast, subtitle }) {
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
      <div className="text-center mb-2">
        <p className="text-stone-500">{subtitle}</p>
      </div>

      {(items || []).map((person, index) => (
        <Card key={person.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-stone-400">Person {index + 1}</span>
            <button
              onClick={() => removePerson(person.id)}
              className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2">
              {['bride', 'groom'].map((side) => (
                <button
                  key={side}
                  onClick={() => updatePerson(person.id, 'side', side)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    person.side === side
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-stone-300 text-stone-500 hover:border-stone-400'
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
              Needs pronunciation help
            </label>
          </div>
        </Card>
      ))}

      <button
        onClick={addPerson}
        className="w-full py-3 rounded-xl border-2 border-dashed border-stone-300 text-sm font-medium text-stone-500 hover:border-gold-400 hover:text-gold-600 transition-colors cursor-pointer"
      >
        + Add Person
      </button>

      {(items || []).length === 0 && (
        <p className="text-center text-sm text-stone-400 py-4">
          No one added yet. Click above to add someone.
        </p>
      )}
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
      <div className="text-center mb-2">
        <p className="text-stone-500">Help us pronounce these names correctly.</p>
      </div>

      {allPeople.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-3xl mb-3">👍</div>
          <p className="text-stone-500 text-sm">No names flagged for pronunciation help.</p>
          <p className="text-stone-400 text-xs mt-1">
            Go back and check "Needs pronunciation help" on any name.
          </p>
        </Card>
      ) : (
        allPeople.map((person) => (
          <Card key={person.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-800">{person.name}</span>
              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">{person.role}</span>
            </div>
            <Input
              label="How do you say it?"
              value={pronunciations[person.name] || ''}
              onChange={(e) => updatePronunciation(person.name, e.target.value)}
              placeholder="e.g., AR-jun Shah"
            />
          </Card>
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
    { value: 'formal', label: 'Formal' },
    { value: 'first', label: 'First Name' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-2">
        <p className="text-stone-500">How should each person be announced?</p>
      </div>

      {allPeople.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-stone-400 text-sm">Add people in previous steps to set announcement styles.</p>
        </Card>
      ) : (
        allPeople.map((person) => (
          <div key={person.name} className="flex items-center justify-between bg-white rounded-xl border border-stone-200 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-800 truncate">{person.name}</p>
              <p className="text-xs text-stone-400">{person.role}</p>
            </div>
            <div className="flex gap-1 ml-3">
              {styleOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateStyle(person.name, s.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
        ))
      )}
    </div>
  );
}

function Phase2Summary({ formData }) {
  const navigate = useNavigate();

  const allPeople = [];
  if (formData.brideParents?.father) allPeople.push({ name: formData.brideParents.father, role: "Bride's Father", side: 'bride' });
  if (formData.brideParents?.mother) allPeople.push({ name: formData.brideParents.mother, role: "Bride's Mother", side: 'bride' });
  if (formData.groomParents?.father) allPeople.push({ name: formData.groomParents.father, role: "Groom's Father", side: 'groom' });
  if (formData.groomParents?.mother) allPeople.push({ name: formData.groomParents.mother, role: "Groom's Mother", side: 'groom' });
  (formData.siblings || []).forEach((p) => { if (p.name) allPeople.push(p); });
  (formData.keyRelatives || []).forEach((p) => { if (p.name) allPeople.push(p); });
  (formData.otherVIPs || []).forEach((p) => { if (p.name) allPeople.push(p); });

  const brideSide = allPeople.filter((p) => p.side === 'bride');
  const groomSide = allPeople.filter((p) => p.side === 'groom');
  const pronunciationCount = Object.keys(formData.pronunciations || {}).length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Celebration header */}
      <div className="text-center py-6">
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
        <h2 className="font-heading text-3xl font-semibold text-stone-900 mb-2">
          Phase 2 Complete!
        </h2>
        <p className="text-stone-500 max-w-md mx-auto">
          We know your people. Here's the VIP roster for your big day.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-heading font-semibold text-gold-600">{allPeople.length}</p>
          <p className="text-xs text-stone-500 mt-1">Total People</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-heading font-semibold text-gold-600">{brideSide.length}</p>
          <p className="text-xs text-stone-500 mt-1">Bride's Side</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-heading font-semibold text-gold-600">{groomSide.length}</p>
          <p className="text-xs text-stone-500 mt-1">Groom's Side</p>
        </Card>
      </div>

      {/* People list */}
      {allPeople.length > 0 && (
        <div>
          <p className="text-xs tracking-widest uppercase text-gold-600 font-semibold mb-3">Your People</p>
          <div className="space-y-2">
            {allPeople.map((person, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-lg border border-stone-200 p-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 text-sm font-medium">
                  {person.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{person.name}</p>
                  <p className="text-xs text-stone-400">{person.role}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  person.side === 'bride' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {person.side === 'bride' ? "Bride" : "Groom"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pronunciationCount > 0 && (
        <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
          <p className="text-sm text-gold-800">
            📝 {pronunciationCount} name{pronunciationCount > 1 ? 's' : ''} with pronunciation guides recorded.
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-4">
        <Button variant="primary" size="lg" onClick={() => navigate('/phase/3')}>
          Continue to Your Soundtrack →
        </Button>
        <p className="text-xs text-stone-400 mt-3">You can always come back and edit this later.</p>
      </div>
    </div>
  );
}
