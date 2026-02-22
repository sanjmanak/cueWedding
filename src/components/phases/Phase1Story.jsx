import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import Input from '../common/Input';
import Card from '../common/Card';
import Button from '../common/Button';
import {
  eventOptions, howMetOptions, datingAppOptions,
  guestCountOptions, vibeWords, bollywoodEras, westernMusicOptions,
} from '../../data/demoData';

const steps = [
  'The Couple',
  'How You Met',
  'Your Events',
  'Venue Details',
  'Guest Counts',
  'Vibe Check',
  'Phase 1 Complete!',
];

export default function Phase1Story() {
  const { formData, updateField, updateNestedField, setFormData } = useFormData();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);

  const handleStepChange = (newStep) => {
    setStep(newStep);
    if (newStep < steps.length - 1) {
      addToast('Saved!', 'success', 1500);
    }
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
      showCompletion={step === steps.length - 1}
    >
      {step === 0 && <StepNames formData={formData} updateField={updateField} />}
      {step === 1 && <StepHowMet formData={formData} updateField={updateField} setFormData={setFormData} />}
      {step === 2 && <StepEvents formData={formData} updateField={updateField} />}
      {step === 3 && <StepVenues formData={formData} updateNestedField={updateNestedField} setFormData={setFormData} />}
      {step === 4 && <StepGuestCounts formData={formData} updateNestedField={updateNestedField} />}
      {step === 5 && <StepVibe formData={formData} updateField={updateField} />}
      {step === 6 && <Phase1Summary formData={formData} />}
    </PhaseWrapper>
  );
}

function StepNames({ formData, updateField }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center mb-2">
        <p className="text-stone-500">Let's start with the two most important people.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">👰</span>
          <h3 className="font-heading text-lg font-semibold text-stone-800">The Bride</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.brideName || ''}
            onChange={(e) => updateField('brideName', e.target.value)}
            placeholder="First name"
          />
          <Input
            label="Last Name"
            value={formData.brideLastName || ''}
            onChange={(e) => updateField('brideLastName', e.target.value)}
            placeholder="Last name"
          />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🤵</span>
          <h3 className="font-heading text-lg font-semibold text-stone-800">The Groom</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.groomName || ''}
            onChange={(e) => updateField('groomName', e.target.value)}
            placeholder="First name"
          />
          <Input
            label="Last Name"
            value={formData.groomLastName || ''}
            onChange={(e) => updateField('groomLastName', e.target.value)}
            placeholder="Last name"
          />
        </div>
      </Card>

      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700 block">When does the celebration begin?</label>
        <Input
          label="First Event Date"
          type="date"
          value={formData.firstEventDate || ''}
          onChange={(e) => updateField('firstEventDate', e.target.value)}
        />
        <p className="text-xs text-stone-400">The date of your very first wedding event. We'll map specific dates to events later.</p>
      </div>
    </div>
  );
}

function StepHowMet({ formData, updateField, setFormData }) {
  const selectedOption = howMetOptions.find((o) => o.id === formData.howMet);

  const selectHowMet = (optionId) => {
    setFormData((prev) => ({
      ...prev,
      howMet: optionId,
      howMetDetail: '',
      datingApp: optionId === 'dating-app' ? prev.datingApp : '',
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-2">
        <p className="text-sm tracking-widest text-gold-600 uppercase mb-2">Chapter One</p>
        <h2 className="font-heading text-2xl font-semibold text-stone-800">Your love story</h2>
        <p className="text-stone-500 mt-2">We love sharing how couples met during announcements</p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        {/* How did you meet buttons */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-3">How did you two meet?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {howMetOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => selectHowMet(option.id)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  formData.howMet === option.id
                    ? 'bg-gold-50 border-gold-400 text-gold-700'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dating app follow-up — inline within same card */}
        {selectedOption?.followUpType === 'apps' && (
          <div className="animate-fade-in-up">
            <label className="block text-sm font-medium text-stone-700 mb-3">
              {selectedOption.followUp} <span className="text-stone-400 font-normal">Your DJ might have fun with this</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {datingAppOptions.map((app) => (
                <button
                  key={app}
                  onClick={() => updateField('datingApp', app)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    formData.datingApp === app
                      ? 'bg-gold-50 border-gold-400 text-gold-700'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {app}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text follow-up for other options — inline within same card */}
        {selectedOption?.followUpType === 'text' && (
          <div className="animate-fade-in-up">
            <label className="block text-sm font-medium text-stone-700 mb-2">{selectedOption.followUp}</label>
            <input
              type="text"
              value={formData.howMetDetail || ''}
              onChange={(e) => updateField('howMetDetail', e.target.value)}
              placeholder={selectedOption.followUp}
              className="w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400"
            />
          </div>
        )}

        {/* Fun detail — always visible, part of same card */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Any fun detail your DJ should know? <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.meetDetail || ''}
            onChange={(e) => updateField('meetDetail', e.target.value)}
            placeholder="e.g., He proposed at the same restaurant where they had their first date"
            className="w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400"
          />
        </div>
      </Card>
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
      <div className="text-center mb-2">
        <p className="text-stone-500">What events are you planning? Tap all that apply.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {eventOptions.map((event) => (
          <button
            key={event.id}
            onClick={() => toggle(event.id)}
            className={`p-5 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer ${
              selected.includes(event.id)
                ? 'border-gold-500 bg-gold-50 shadow-sm scale-[1.02]'
                : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
            }`}
          >
            <div className="text-3xl mb-2">{event.emoji}</div>
            <div className="text-sm font-medium text-stone-700">{event.label}</div>
            {selected.includes(event.id) && (
              <div className="text-gold-600 text-xs mt-1 font-medium">Selected</div>
            )}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gold-700 font-medium">
            {selected.length} event{selected.length > 1 ? 's' : ''} selected
          </p>
        </div>
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
      updateNestedField('eventVenues', eventId, { name: '', address: '', setting: '', linkedTo: '' });
    }
  };

  // Build cascading list: an event can only "same as" events that appear before it and have a venue name
  const getPreviousVenueEvents = (eventId) => {
    const idx = events.indexOf(eventId);
    return events
      .slice(0, idx)
      .filter((e) => venues[e]?.name);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-2">
        <p className="text-stone-500">Where is each event happening?</p>
      </div>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const venue = venues[eventId] || {};
        const previousEvents = getPreviousVenueEvents(eventId);
        const isLinked = venue.linkedTo && venues[venue.linkedTo]?.name;

        return (
          <Card key={eventId} className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{event?.emoji}</span>
              <h3 className="font-heading text-lg font-semibold text-stone-800">{event?.label}</h3>
            </div>

            {previousEvents.length > 0 && (
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Choose venue</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => linkVenue(eventId, '')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      !venue.linkedTo
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'border-stone-300 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    New venue
                  </button>
                  {previousEvents.map((e) => {
                    const label = eventOptions.find((o) => o.id === e)?.label;
                    return (
                      <button
                        key={e}
                        onClick={() => linkVenue(eventId, e)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                          venue.linkedTo === e
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'border-stone-300 text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        Same as {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isLinked ? (
              <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                <p className="text-sm text-stone-600">
                  📍 {venue.name} — {venue.address}
                  {venue.setting && <span className="ml-2 text-xs bg-stone-200 px-2 py-0.5 rounded">{venue.setting}</span>}
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </Card>
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
      <div className="text-center mb-2">
        <p className="text-stone-500">How many guests are you expecting at each event?</p>
      </div>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        return (
          <Card key={eventId} className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{event?.emoji}</span>
              <h3 className="font-heading text-lg font-semibold text-stone-800">{event?.label}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {guestCountOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => updateNestedField('eventGuestCounts', eventId, count)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                    counts[eventId] === count
                      ? 'bg-gold-600 text-white border-gold-600 shadow-sm'
                      : 'border-stone-300 text-stone-600 hover:border-gold-400'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </Card>
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
      <div className="text-center mb-2">
        <p className="text-stone-500">Last step — let's nail the vibe.</p>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-stone-800">Pick 3 words that describe your wedding vibe</h3>
        <div className="flex flex-wrap gap-2">
          {vibeWords.map((word) => (
            <button
              key={word}
              onClick={() => toggleVibe(word)}
              disabled={selected.length >= 3 && !selected.includes(word)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                selected.includes(word)
                  ? 'bg-gold-600 text-white border-gold-600 shadow-sm scale-105'
                  : 'border-stone-300 text-stone-600 hover:border-gold-400'
              }`}
            >
              {word}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400">{selected.length}/3 selected</p>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-stone-800">Bollywood era preference</h3>
        <div className="flex flex-wrap gap-2">
          {bollywoodEras.map((era) => (
            <button
              key={era}
              onClick={() => updateField('bollywoodEra', era)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                formData.bollywoodEra === era
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400'
              }`}
            >
              {era}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-stone-800">How much Western music?</h3>
        <div className="grid grid-cols-2 gap-2">
          {westernMusicOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => updateField('westernMusic', opt)}
              className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all text-left cursor-pointer ${
                formData.westernMusic === opt
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Phase1Summary({ formData }) {
  const navigate = useNavigate();
  const events = formData.selectedEvents || [];
  const venues = formData.eventVenues || {};
  const counts = formData.eventGuestCounts || {};
  const metOption = howMetOptions.find((o) => o.id === formData.howMet);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Celebration header */}
      <div className="text-center py-6">
        <div className="text-5xl mb-4">🎊</div>
        <h2 className="font-heading text-3xl font-semibold text-stone-900 mb-2">
          Phase 1 Complete!
        </h2>
        <p className="text-stone-500 max-w-md mx-auto">
          Beautiful. Here's everything we know about your celebration so far.
        </p>
      </div>

      {/* The Couple */}
      <Card className="p-6 bg-gradient-to-br from-gold-50 to-white">
        <div className="text-center">
          <p className="text-xs tracking-widest uppercase text-gold-600 font-semibold mb-3">The Couple</p>
          <h3 className="font-heading text-2xl font-semibold text-stone-900">
            {formData.brideName || 'Bride'} {formData.brideLastName && formData.brideLastName}
            <span className="text-gold-500 mx-3">&</span>
            {formData.groomName || 'Groom'} {formData.groomLastName && formData.groomLastName}
          </h3>
          <p className="text-stone-500 mt-2">{formatDate(formData.firstEventDate)}</p>
          {metOption && (
            <p className="text-sm text-stone-400 mt-1">
              Met via {metOption.label.toLowerCase()}
              {formData.datingApp ? ` (${formData.datingApp})` : ''}
              {formData.howMetDetail ? ` — ${formData.howMetDetail}` : ''}
            </p>
          )}
        </div>
      </Card>

      {/* Events & Venues */}
      <div>
        <p className="text-xs tracking-widest uppercase text-gold-600 font-semibold mb-3">Your Events</p>
        <div className="space-y-2">
          {events.map((eventId) => {
            const event = eventOptions.find((e) => e.id === eventId);
            const venue = venues[eventId];
            const count = counts[eventId];
            return (
              <div key={eventId} className="flex items-center gap-4 bg-white rounded-lg border border-stone-200 p-4">
                <span className="text-2xl">{event?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800">{event?.label}</p>
                  {venue?.name && (
                    <p className="text-sm text-stone-500 truncate">
                      {venue.name}
                      {venue.setting && <span className="ml-2 text-xs bg-stone-100 px-2 py-0.5 rounded">{venue.setting}</span>}
                    </p>
                  )}
                </div>
                {count && (
                  <span className="text-xs bg-gold-100 text-gold-700 px-2.5 py-1 rounded-full font-medium">
                    {count} guests
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vibe */}
      {(formData.vibeWords?.length > 0 || formData.bollywoodEra || formData.westernMusic) && (
        <div>
          <p className="text-xs tracking-widest uppercase text-gold-600 font-semibold mb-3">The Vibe</p>
          <Card className="p-5">
            {formData.vibeWords?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.vibeWords.map((word) => (
                  <span key={word} className="px-3 py-1.5 rounded-full text-sm font-medium bg-gold-100 text-gold-700">
                    {word}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-500">
              {formData.bollywoodEra && <span>Bollywood: {formData.bollywoodEra}</span>}
              {formData.westernMusic && <span>Western: {formData.westernMusic}</span>}
            </div>
          </Card>
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-4">
        <Button variant="primary" size="lg" onClick={() => navigate('/phase/2')}>
          Continue to Your People →
        </Button>
        <p className="text-xs text-stone-400 mt-3">You can always come back and edit this later.</p>
      </div>
    </div>
  );
}
