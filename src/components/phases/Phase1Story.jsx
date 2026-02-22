import { useState } from 'react';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';
import {
  eventOptions, howMetOptions, datingAppOptions,
  guestCountOptions, vibeWords, bollywoodEras, westernMusicOptions,
} from '../../data/demoData';

const steps = [
  'Confirm Your Names',
  'How You Met',
  'Your Events',
  'Venue Details',
  'Guest Counts',
  'Vibe Check',
];

export default function Phase1Story() {
  const { formData, updateField, updateNestedField, setFormData } = useFormData();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);

  const handleStepChange = (newStep) => {
    setStep(newStep);
    addToast('Saved!', 'success', 1500);
  };

  return (
    <PhaseWrapper
      phase={1}
      phaseTitle="Your Story"
      steps={steps}
      currentStep={step}
      onStepChange={handleStepChange}
      nextPath="/phase/2"
      prevPath="/"
    >
      {step === 0 && <StepNames formData={formData} updateField={updateField} />}
      {step === 1 && <StepHowMet formData={formData} updateField={updateField} />}
      {step === 2 && <StepEvents formData={formData} updateField={updateField} />}
      {step === 3 && <StepVenues formData={formData} updateNestedField={updateNestedField} setFormData={setFormData} />}
      {step === 4 && <StepGuestCounts formData={formData} updateNestedField={updateNestedField} />}
      {step === 5 && <StepVibe formData={formData} updateField={updateField} />}
    </PhaseWrapper>
  );
}

function StepNames({ formData, updateField }) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">Let's start with the basics. Confirm your names and wedding date.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Bride's Name"
          value={formData.brideName || ''}
          onChange={(e) => updateField('brideName', e.target.value)}
          placeholder="First name"
        />
        <Input
          label="Groom's Name"
          value={formData.groomName || ''}
          onChange={(e) => updateField('groomName', e.target.value)}
          placeholder="First name"
        />
      </div>
      <Input
        label="Wedding Date"
        type="date"
        value={formData.weddingDate || ''}
        onChange={(e) => updateField('weddingDate', e.target.value)}
      />
    </div>
  );
}

function StepHowMet({ formData, updateField }) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">How did you two meet? This helps us personalize your experience.</p>
      <Select
        label="How did you meet?"
        options={howMetOptions}
        value={formData.howMet || ''}
        onChange={(e) => updateField('howMet', e.target.value)}
      />
      {formData.howMet === 'Dating App' && (
        <Select
          label="Which app?"
          options={datingAppOptions}
          value={formData.datingApp || ''}
          onChange={(e) => updateField('datingApp', e.target.value)}
        />
      )}
      <TextArea
        label="Any fun details about how you met? (optional)"
        value={formData.meetDetail || ''}
        onChange={(e) => updateField('meetDetail', e.target.value)}
        placeholder="e.g., He sent a message about my love for biryani..."
      />
    </div>
  );
}

function StepEvents({ formData, updateField }) {
  const selected = formData.selectedEvents || [];
  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((e) => e !== id) : [...selected, id];
    updateField('selectedEvents', next);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">What events are you planning? Select all that apply.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {eventOptions.map((event) => (
          <Card
            key={event.id}
            selected={selected.includes(event.id)}
            onClick={() => toggle(event.id)}
            className="p-4 text-center"
          >
            <div className="text-2xl mb-1">{event.emoji}</div>
            <div className="text-sm font-medium text-stone-700">{event.label}</div>
          </Card>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-sm text-emerald-600">
          {selected.length} event{selected.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}

function StepVenues({ formData, updateNestedField, setFormData }) {
  const events = formData.selectedEvents || [];
  const venues = formData.eventVenues || {};

  const updateVenue = (eventId, field, value) => {
    const current = venues[eventId] || {};
    updateNestedField('eventVenues', eventId, { ...current, [field]: value });
  };

  const linkVenue = (eventId, linkedEventId) => {
    if (linkedEventId && venues[linkedEventId]) {
      const source = venues[linkedEventId];
      updateNestedField('eventVenues', eventId, {
        name: source.name,
        address: source.address,
        setting: source.setting,
        linkedTo: linkedEventId,
      });
    } else {
      updateNestedField('eventVenues', eventId, { ...venues[eventId], linkedTo: '' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-stone-600">Where are your events happening?</p>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const venue = venues[eventId] || {};
        const otherEvents = events.filter((e) => e !== eventId && venues[e]?.name);
        return (
          <div key={eventId} className="border border-stone-200 rounded-xl p-5 space-y-4">
            <h3 className="font-heading text-lg font-semibold text-stone-800">
              {event?.emoji} {event?.label}
            </h3>
            {otherEvents.length > 0 && (
              <Select
                label="Link to another event's venue"
                options={[{ value: '', label: 'Enter new venue' }, ...otherEvents.map((e) => ({ value: e, label: `Same as ${eventOptions.find((o) => o.id === e)?.label}` }))]}
                value={venue.linkedTo || ''}
                onChange={(e) => linkVenue(eventId, e.target.value)}
              />
            )}
            <Input
              label="Venue Name"
              value={venue.name || ''}
              onChange={(e) => updateVenue(eventId, 'name', e.target.value)}
              placeholder="e.g., The Grand Ballroom"
            />
            <Input
              label="Address"
              value={venue.address || ''}
              onChange={(e) => updateVenue(eventId, 'address', e.target.value)}
              placeholder="Full address"
            />
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Setting</label>
              <div className="flex gap-3">
                {['indoor', 'outdoor', 'both'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateVenue(eventId, 'setting', s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      venue.setting === s
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'border-stone-300 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      {events.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-8">Go back to select events first.</p>
      )}
    </div>
  );
}

function StepGuestCounts({ formData, updateNestedField }) {
  const events = formData.selectedEvents || [];
  const counts = formData.eventGuestCounts || {};

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-stone-600">How many guests are you expecting at each event?</p>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        return (
          <div key={eventId} className="space-y-3">
            <h3 className="font-heading text-lg font-semibold text-stone-800">
              {event?.emoji} {event?.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {guestCountOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => updateNestedField('eventGuestCounts', eventId, count)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    counts[eventId] === count
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-stone-300 text-stone-600 hover:border-stone-400'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepVibe({ formData, updateField }) {
  const selected = formData.vibeWords || [];
  const toggleVibe = (word) => {
    if (selected.includes(word)) {
      updateField('vibeWords', selected.filter((w) => w !== word));
    } else if (selected.length < 3) {
      updateField('vibeWords', [...selected, word]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <p className="text-stone-600 mb-4">Pick 3 words that describe your wedding vibe.</p>
        <div className="flex flex-wrap gap-2">
          {vibeWords.map((word) => (
            <button
              key={word}
              onClick={() => toggleVibe(word)}
              disabled={selected.length >= 3 && !selected.includes(word)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                selected.includes(word)
                  ? 'bg-gold-600 text-white border-gold-600'
                  : 'border-stone-300 text-stone-600 hover:border-gold-400'
              }`}
            >
              {word}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-2">{selected.length}/3 selected</p>
      </div>

      <Select
        label="Bollywood era preference"
        options={bollywoodEras}
        value={formData.bollywoodEra || ''}
        onChange={(e) => updateField('bollywoodEra', e.target.value)}
      />

      <div>
        <label className="text-sm font-medium text-stone-700 mb-3 block">How much Western music?</label>
        <div className="grid grid-cols-2 gap-2">
          {westernMusicOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => updateField('westernMusic', opt)}
              className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors text-left cursor-pointer ${
                formData.westernMusic === opt
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
