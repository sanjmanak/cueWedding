import { useState } from 'react';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import MusicSearch from '../features/MusicSearch';
import {
  eventOptions, templateOptions, timelineBlockTypes, ceremonyTraditions,
} from '../../data/demoData';

const steps = [
  'Event Templates',
  'Timeline Builder',
  'Performances',
  'Speeches',
  'Ceremony Details',
  'Key Moments Review',
];

export default function Phase4Program() {
  const { formData, setFormData } = useFormData();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);

  const handleStepChange = (s) => {
    setStep(s);
    addToast('Saved!', 'success', 1500);
  };

  return (
    <PhaseWrapper
      phase={4}
      phaseTitle="Your Program"
      steps={steps}
      currentStep={step}
      onStepChange={handleStepChange}
      nextPath="/phase/5"
      prevPath="/phase/3"
    >
      {step === 0 && <StepTemplates formData={formData} setFormData={setFormData} />}
      {step === 1 && <StepTimeline formData={formData} setFormData={setFormData} addToast={addToast} />}
      {step === 2 && <StepPerformances formData={formData} setFormData={setFormData} addToast={addToast} />}
      {step === 3 && <StepSpeeches formData={formData} setFormData={setFormData} addToast={addToast} />}
      {step === 4 && <StepCeremony formData={formData} setFormData={setFormData} />}
      {step === 5 && <StepReview formData={formData} />}
    </PhaseWrapper>
  );
}

function StepTemplates({ formData, setFormData }) {
  const events = formData.selectedEvents || [];
  const templates = formData.eventTemplates || {};

  const selectTemplate = (eventId, templateId) => {
    setFormData((prev) => ({
      ...prev,
      eventTemplates: { ...prev.eventTemplates, [eventId]: templateId },
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-stone-600">Choose a starting template for each event's program.</p>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const options = templateOptions[eventId] || templateOptions.default;
        return (
          <div key={eventId} className="space-y-3">
            <h3 className="font-heading text-lg font-semibold text-stone-800">
              {event?.emoji} {event?.label}
            </h3>
            <div className="grid gap-2">
              {options.map((tmpl) => (
                <Card
                  key={tmpl.id}
                  selected={templates[eventId] === tmpl.id}
                  onClick={() => selectTemplate(eventId, tmpl.id)}
                  className="p-4"
                >
                  <p className="text-sm font-medium text-stone-800">{tmpl.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{tmpl.description}</p>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepTimeline({ formData, setFormData, addToast }) {
  const events = formData.selectedEvents || [];
  const timelines = formData.timelines || {};
  const [activeEvent, setActiveEvent] = useState(events[0] || '');

  const blocks = timelines[activeEvent] || [];

  const addBlock = (type) => {
    const blockType = timelineBlockTypes.find((b) => b.id === type);
    const newBlock = {
      id: Date.now().toString(),
      type,
      label: blockType?.label || 'Block',
      duration: type === 'dinner' ? 45 : type === 'break' ? 15 : type === 'dance-set' ? 30 : 5,
      details: '',
    };
    setFormData((prev) => ({
      ...prev,
      timelines: {
        ...prev.timelines,
        [activeEvent]: [...(prev.timelines?.[activeEvent] || []), newBlock],
      },
    }));
    addToast('Block added!', 'success', 1500);
  };

  const updateBlock = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      timelines: {
        ...prev.timelines,
        [activeEvent]: (prev.timelines?.[activeEvent] || []).map((b) =>
          b.id === id ? { ...b, [field]: value } : b
        ),
      },
    }));
  };

  const removeBlock = (id) => {
    setFormData((prev) => ({
      ...prev,
      timelines: {
        ...prev.timelines,
        [activeEvent]: (prev.timelines?.[activeEvent] || []).filter((b) => b.id !== id),
      },
    }));
  };

  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    const target = index + direction;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setFormData((prev) => ({
      ...prev,
      timelines: { ...prev.timelines, [activeEvent]: newBlocks },
    }));
  };

  const totalMinutes = blocks.reduce((sum, b) => sum + (b.duration || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">Build your event timeline by adding and ordering blocks.</p>

      {/* Event selector */}
      <div className="flex gap-2 flex-wrap">
        {events.map((eventId) => {
          const event = eventOptions.find((e) => e.id === eventId);
          return (
            <button
              key={eventId}
              onClick={() => setActiveEvent(eventId)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeEvent === eventId
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {event?.emoji} {event?.label}
            </button>
          );
        })}
      </div>

      {/* Add block buttons */}
      <div className="flex gap-2 flex-wrap">
        {timelineBlockTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => addBlock(type.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-stone-300 text-stone-500 hover:border-gold-400 hover:text-gold-600 transition-colors cursor-pointer"
          >
            {type.icon} + {type.label}
          </button>
        ))}
      </div>

      {/* Timeline blocks */}
      <div className="space-y-2">
        {blocks.map((block, index) => {
          const blockType = timelineBlockTypes.find((b) => b.id === block.type);
          return (
            <div
              key={block.id}
              className={`flex items-center gap-3 rounded-lg border border-stone-200 p-3 ${blockType?.color || ''}`}
            >
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveBlock(index, -1)} className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer leading-none">▲</button>
                <button onClick={() => moveBlock(index, 1)} className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer leading-none">▼</button>
              </div>
              <span className="text-lg">{blockType?.icon}</span>
              <input
                value={block.label}
                onChange={(e) => updateBlock(block.id, 'label', e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium outline-none"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={block.duration}
                  onChange={(e) => updateBlock(block.id, 'duration', parseInt(e.target.value) || 0)}
                  className="w-12 text-xs text-center bg-white/50 rounded border border-stone-300 py-1"
                />
                <span className="text-xs text-stone-500">min</span>
              </div>
              <button onClick={() => removeBlock(block.id)} className="text-stone-400 hover:text-red-500 cursor-pointer">✕</button>
            </div>
          );
        })}
      </div>

      {blocks.length > 0 && (
        <p className="text-sm text-stone-500">
          Total: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
        </p>
      )}
    </div>
  );
}

function StepPerformances({ formData, setFormData, addToast }) {
  const performances = formData.performances || [];
  const events = formData.selectedEvents || [];

  const addPerformance = () => {
    setFormData((prev) => ({
      ...prev,
      performances: [...(prev.performances || []),
        { id: Date.now().toString(), groupName: '', songName: '', duration: 5, event: events[0] || '' }],
    }));
    addToast('Performance added!', 'success', 1500);
  };

  const updatePerformance = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      performances: (prev.performances || []).map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  const removePerformance = (id) => {
    setFormData((prev) => ({
      ...prev,
      performances: (prev.performances || []).filter((p) => p.id !== id),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">List all performances planned for your events.</p>
      {performances.map((perf) => (
        <Card key={perf.id} className="p-4 space-y-3">
          <div className="flex justify-between">
            <Input
              label="Group / Performer Name"
              value={perf.groupName}
              onChange={(e) => updatePerformance(perf.id, 'groupName', e.target.value)}
              placeholder="e.g., Bride Squad"
              className="flex-1"
            />
            <button onClick={() => removePerformance(perf.id)} className="ml-2 mt-6 text-stone-400 hover:text-red-500 cursor-pointer">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Song"
              value={perf.songName}
              onChange={(e) => updatePerformance(perf.id, 'songName', e.target.value)}
              placeholder="Song name"
            />
            <Input
              label="Duration (min)"
              type="number"
              value={perf.duration}
              onChange={(e) => updatePerformance(perf.id, 'duration', parseInt(e.target.value) || 0)}
            />
            <Select
              label="Event"
              options={events.map((e) => ({ value: e, label: eventOptions.find((o) => o.id === e)?.label }))}
              value={perf.event}
              onChange={(e) => updatePerformance(perf.id, 'event', e.target.value)}
            />
          </div>
        </Card>
      ))}
      <Button variant="secondary" size="sm" onClick={addPerformance}>
        + Add Performance
      </Button>
    </div>
  );
}

function StepSpeeches({ formData, setFormData, addToast }) {
  const speeches = formData.speeches || [];
  const events = formData.selectedEvents || [];

  const addSpeech = () => {
    setFormData((prev) => ({
      ...prev,
      speeches: [...(prev.speeches || []),
        { id: Date.now().toString(), speaker: '', relationship: '', afterMoment: '', event: events[0] || '' }],
    }));
    addToast('Speech added!', 'success', 1500);
  };

  const updateSpeech = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      speeches: (prev.speeches || []).map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSpeech = (id) => {
    setFormData((prev) => ({
      ...prev,
      speeches: (prev.speeches || []).filter((s) => s.id !== id),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">Who's giving speeches? Let us know the order.</p>
      {speeches.map((speech) => (
        <Card key={speech.id} className="p-4 space-y-3">
          <div className="flex justify-between">
            <Input
              label="Speaker Name"
              value={speech.speaker}
              onChange={(e) => updateSpeech(speech.id, 'speaker', e.target.value)}
              className="flex-1"
            />
            <button onClick={() => removeSpeech(speech.id)} className="ml-2 mt-6 text-stone-400 hover:text-red-500 cursor-pointer">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Relationship"
              value={speech.relationship}
              onChange={(e) => updateSpeech(speech.id, 'relationship', e.target.value)}
              placeholder="e.g., Best Man"
            />
            <Input
              label="After which moment?"
              value={speech.afterMoment}
              onChange={(e) => updateSpeech(speech.id, 'afterMoment', e.target.value)}
              placeholder="e.g., Grand Entrance"
            />
            <Select
              label="Event"
              options={events.map((e) => ({ value: e, label: eventOptions.find((o) => o.id === e)?.label }))}
              value={speech.event}
              onChange={(e) => updateSpeech(speech.id, 'event', e.target.value)}
            />
          </div>
        </Card>
      ))}
      <Button variant="secondary" size="sm" onClick={addSpeech}>
        + Add Speech
      </Button>
    </div>
  );
}

function StepCeremony({ formData, setFormData }) {
  const hasCeremony = formData.selectedEvents?.includes('ceremony');
  const selected = formData.ceremonyTraditions || [];
  const songs = formData.ceremonySongs || {};

  if (!hasCeremony) {
    return (
      <div className="text-center py-12 animate-fade-in-up">
        <p className="text-stone-400">Ceremony event not selected. You can skip this step.</p>
      </div>
    );
  }

  const toggleTradition = (id) => {
    const next = selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id];
    setFormData((prev) => ({ ...prev, ceremonyTraditions: next }));
  };

  const setSong = (traditionId, track) => {
    setFormData((prev) => ({
      ...prev,
      ceremonySongs: { ...prev.ceremonySongs, [traditionId]: { name: track.name, artist: track.artist } },
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">Select the ceremony traditions you're including.</p>
      {ceremonyTraditions.map((tradition) => (
        <div key={tradition.id} className="border border-stone-200 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(tradition.id)}
              onChange={() => toggleTradition(tradition.id)}
              className="rounded"
            />
            <span className="text-sm font-medium text-stone-800">{tradition.label}</span>
          </label>
          {selected.includes(tradition.id) && (
            <div className="mt-3 pl-7">
              {songs[tradition.id] ? (
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <span>🎵 {songs[tradition.id].name} — {songs[tradition.id].artist}</span>
                  <button
                    onClick={() => setFormData((prev) => {
                      const next = { ...prev.ceremonySongs };
                      delete next[tradition.id];
                      return { ...prev, ceremonySongs: next };
                    })}
                    className="text-stone-400 hover:text-red-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <MusicSearch
                  onSelect={(track) => setSong(tradition.id, track)}
                  placeholder={`Search song for ${tradition.label}...`}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StepReview({ formData }) {
  const events = formData.selectedEvents || [];
  const timelines = formData.timelines || {};

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-stone-600">Here's an overview of your event programs.</p>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const blocks = timelines[eventId] || [];
        let cumMinutes = 0;
        return (
          <div key={eventId} className="space-y-3">
            <h3 className="font-heading text-xl font-semibold text-stone-800">
              {event?.emoji} {event?.label}
            </h3>
            {blocks.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No timeline blocks yet.</p>
            ) : (
              <div className="relative pl-6 border-l-2 border-gold-300 space-y-3">
                {blocks.map((block) => {
                  const startMin = cumMinutes;
                  cumMinutes += block.duration || 0;
                  const blockType = timelineBlockTypes.find((b) => b.id === block.type);
                  return (
                    <div key={block.id} className="relative">
                      <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-gold-500 border-2 border-white" />
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-stone-400 w-12">+{startMin}m</span>
                        <span className="text-sm">{blockType?.icon}</span>
                        <span className="text-sm font-medium text-stone-700">{block.label}</span>
                        <span className="text-xs text-stone-400">({block.duration}min)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
