import { useState } from 'react';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import Card from '../common/Card';
import Input from '../common/Input';
import MusicSearch from '../features/MusicSearch';
import {
  eventOptions, templateOptions, templateTimelines, guidedTimelines,
  timelineBlockTypes, ceremonyTraditions,
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
  const { addToast } = useToast();
  const events = formData.selectedEvents || [];
  const templates = formData.eventTemplates || {};

  // Resolve the starter timeline + start time for a (event, template) pair.
  // 'guided' is event-specific; named templates are keyed by their id. 'scratch'
  // and unmapped combos return null — no seeding happens.
  const resolveStarter = (eventId, templateId) => {
    if (!templateId || templateId === 'scratch') return null;
    if (templateId === 'guided') return guidedTimelines[eventId] || null;
    return templateTimelines[templateId] || null;
  };

  const selectTemplate = (eventId, templateId) => {
    const starter = resolveStarter(eventId, templateId);
    const existing = formData.timelines?.[eventId] || [];

    if (starter && existing.length > 0) {
      const ok = window.confirm(
        'Replace this event\'s current timeline with the template? Your existing blocks will be cleared.'
      );
      if (!ok) {
        setFormData((prev) => ({
          ...prev,
          eventTemplates: { ...prev.eventTemplates, [eventId]: templateId },
        }));
        return;
      }
    }

    setFormData((prev) => {
      const next = {
        ...prev,
        eventTemplates: { ...prev.eventTemplates, [eventId]: templateId },
      };
      if (starter) {
        next.timelines = {
          ...prev.timelines,
          [eventId]: starter.blocks.map((b) => ({ ...b, id: crypto.randomUUID(), details: '' })),
        };
        if (!prev.eventStartTimes?.[eventId]) {
          next.eventStartTimes = {
            ...prev.eventStartTimes,
            [eventId]: starter.startTime,
          };
        }
      }
      return next;
    });

    if (starter) addToast('Template applied — edit the timeline next', 'success', 2000);
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
  const startTimes = formData.eventStartTimes || {};
  const [activeEvent, setActiveEvent] = useState(events[0] || '');

  const blocks = timelines[activeEvent] || [];
  const hasStartTime = !!startTimes[activeEvent];

  const addBlock = (type) => {
    const blockType = timelineBlockTypes.find((b) => b.id === type);
    const newBlock = {
      id: crypto.randomUUID(),
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

  const setStartTime = (time) => {
    setFormData((prev) => ({
      ...prev,
      eventStartTimes: { ...prev.eventStartTimes, [activeEvent]: time },
    }));
  };

  const removeStartTime = () => {
    setFormData((prev) => {
      const next = { ...prev.eventStartTimes };
      delete next[activeEvent];
      return { ...prev, eventStartTimes: next };
    });
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

  const formatTime12 = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

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

      {/* Start Time */}
      {hasStartTime ? (
        <div className="flex items-center gap-3 bg-gold-50 border border-gold-300 rounded-lg p-3">
          <span className="text-lg">🕐</span>
          <span className="text-sm font-medium text-gold-800">Start Time:</span>
          <input
            type="time"
            value={startTimes[activeEvent] || ''}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gold-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
          <span className="text-sm text-gold-600">{formatTime12(startTimes[activeEvent])}</span>
          <button
            onClick={removeStartTime}
            className="ml-auto text-gold-400 hover:text-red-500 cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Add block buttons */}
      <div className="flex gap-2 flex-wrap">
        {!hasStartTime && (
          <button
            onClick={() => setStartTime('19:00')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-gold-400 text-gold-600 hover:bg-gold-50 transition-colors cursor-pointer"
          >
            🕐 + Start Time
          </button>
        )}
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
          {hasStartTime && startTimes[activeEvent] && (() => {
            const [h, m] = startTimes[activeEvent].split(':').map(Number);
            const endMin = h * 60 + m + totalMinutes;
            const endH = Math.floor(endMin / 60) % 12 || 12;
            const endAmpm = Math.floor(endMin / 60) >= 12 ? 'PM' : 'AM';
            return ` (${formatTime12(startTimes[activeEvent])} – ${endH}:${(endMin % 60).toString().padStart(2, '0')} ${endAmpm})`;
          })()}
        </p>
      )}
    </div>
  );
}

function StepPerformances({ formData, setFormData, addToast }) {
  const events = formData.selectedEvents || [];
  const timelines = formData.timelines || {};

  const updateBlock = (eventId, blockId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      timelines: {
        ...prev.timelines,
        [eventId]: (prev.timelines?.[eventId] || []).map((b) =>
          b.id === blockId ? { ...b, [field]: value } : b
        ),
      },
    }));
  };

  const addPerformance = (eventId) => {
    const newBlock = {
      id: crypto.randomUUID(),
      type: 'performance',
      label: 'New Performance',
      duration: 5,
      details: '',
      performerName: '',
      songName: '',
    };
    setFormData((prev) => ({
      ...prev,
      timelines: {
        ...prev.timelines,
        [eventId]: [...(prev.timelines?.[eventId] || []), newBlock],
      },
    }));
    addToast('Performance added!', 'success', 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-stone-600">Fill in details for each performance in your timeline.</p>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const perfBlocks = (timelines[eventId] || []).filter((b) => b.type === 'performance');
        return (
          <div key={eventId} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest uppercase text-gold-600 font-semibold">
                {event?.label}
              </span>
              <span className="flex-1 border-t border-stone-200" />
              <span className="text-xs text-stone-400">{perfBlocks.length} performance{perfBlocks.length !== 1 ? 's' : ''}</span>
            </div>
            {perfBlocks.length === 0 ? (
              <p className="text-sm text-stone-400 italic pl-2">No performances in this event yet.</p>
            ) : (
              perfBlocks.map((block) => (
                <Card key={block.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎤</span>
                    <input
                      value={block.label}
                      onChange={(e) => updateBlock(eventId, block.id, 'label', e.target.value)}
                      className="flex-1 text-sm font-medium text-stone-700 bg-transparent outline-none border-b border-transparent focus:border-gold-400"
                      placeholder="Performance name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Performer / Group"
                      value={block.performerName || ''}
                      onChange={(e) => updateBlock(eventId, block.id, 'performerName', e.target.value)}
                      placeholder="e.g., Bride Squad"
                    />
                    <Input
                      label="Song"
                      value={block.songName || ''}
                      onChange={(e) => updateBlock(eventId, block.id, 'songName', e.target.value)}
                      placeholder="Song name"
                    />
                    <Input
                      label="Duration (min)"
                      type="number"
                      value={block.duration}
                      onChange={(e) => updateBlock(eventId, block.id, 'duration', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </Card>
              ))
            )}
            <button
              onClick={() => addPerformance(eventId)}
              className="w-full py-2 rounded-lg border border-dashed border-stone-300 text-xs font-medium text-stone-500 hover:border-gold-400 hover:text-gold-600 transition-colors cursor-pointer"
            >
              + Add Performance to {event?.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function StepSpeeches({ formData, setFormData, addToast }) {
  const events = formData.selectedEvents || [];
  const timelines = formData.timelines || {};

  const updateBlock = (eventId, blockId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      timelines: {
        ...prev.timelines,
        [eventId]: (prev.timelines?.[eventId] || []).map((b) =>
          b.id === blockId ? { ...b, [field]: value } : b
        ),
      },
    }));
  };

  const addSpeech = (eventId) => {
    const newBlock = {
      id: crypto.randomUUID(),
      type: 'speech',
      label: 'New Speech',
      duration: 5,
      details: '',
      speaker: '',
      relationship: '',
    };
    setFormData((prev) => ({
      ...prev,
      timelines: {
        ...prev.timelines,
        [eventId]: [...(prev.timelines?.[eventId] || []), newBlock],
      },
    }));
    addToast('Speech added!', 'success', 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-stone-600">Fill in details for each speech in your timeline.</p>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const speechBlocks = (timelines[eventId] || []).filter((b) => b.type === 'speech');
        return (
          <div key={eventId} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest uppercase text-gold-600 font-semibold">
                {event?.label}
              </span>
              <span className="flex-1 border-t border-stone-200" />
              <span className="text-xs text-stone-400">{speechBlocks.length} speech{speechBlocks.length !== 1 ? 'es' : ''}</span>
            </div>
            {speechBlocks.length === 0 ? (
              <p className="text-sm text-stone-400 italic pl-2">No speeches in this event yet.</p>
            ) : (
              speechBlocks.map((block) => (
                <Card key={block.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎙️</span>
                    <input
                      value={block.label}
                      onChange={(e) => updateBlock(eventId, block.id, 'label', e.target.value)}
                      className="flex-1 text-sm font-medium text-stone-700 bg-transparent outline-none border-b border-transparent focus:border-gold-400"
                      placeholder="Speech name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Speaker Name"
                      value={block.speaker || ''}
                      onChange={(e) => updateBlock(eventId, block.id, 'speaker', e.target.value)}
                      placeholder="e.g., Raj Patel"
                    />
                    <Input
                      label="Relationship"
                      value={block.relationship || ''}
                      onChange={(e) => updateBlock(eventId, block.id, 'relationship', e.target.value)}
                      placeholder="e.g., Father of the Bride"
                    />
                    <Input
                      label="Duration (min)"
                      type="number"
                      value={block.duration}
                      onChange={(e) => updateBlock(eventId, block.id, 'duration', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </Card>
              ))
            )}
            <button
              onClick={() => addSpeech(eventId)}
              className="w-full py-2 rounded-lg border border-dashed border-stone-300 text-xs font-medium text-stone-500 hover:border-gold-400 hover:text-gold-600 transition-colors cursor-pointer"
            >
              + Add Speech to {event?.label}
            </button>
          </div>
        );
      })}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ceremonyTraditions.map((tradition) => {
          const isSelected = selected.includes(tradition.id);
          return (
            <button
              key={tradition.id}
              onClick={() => toggleTradition(tradition.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer text-center ${
                isSelected
                  ? 'border-gold-400 bg-gold-50 shadow-sm'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <span className="text-3xl">{tradition.emoji}</span>
              <span className={`text-sm font-medium ${isSelected ? 'text-gold-800' : 'text-stone-700'}`}>
                {tradition.label}
              </span>
              <span className="text-xs text-stone-400 leading-tight">{tradition.description}</span>
              {isSelected && (
                <span className="text-xs text-gold-600 font-medium mt-1">Selected</span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <p className="text-sm font-medium text-stone-700">Assign songs to your selected traditions:</p>
          {selected.map((tradId) => {
            const tradition = ceremonyTraditions.find((t) => t.id === tradId);
            return (
              <div key={tradId} className="bg-white rounded-lg border border-stone-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{tradition?.emoji}</span>
                  <span className="text-sm font-medium text-stone-800">{tradition?.label}</span>
                </div>
                {songs[tradId] ? (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span>🎵 {songs[tradId].name} — {songs[tradId].artist}</span>
                    <button
                      onClick={() => setFormData((prev) => {
                        const next = { ...prev.ceremonySongs };
                        delete next[tradId];
                        return { ...prev, ceremonySongs: next };
                      })}
                      className="text-stone-400 hover:text-red-500 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <MusicSearch
                    onSelect={(track) => setSong(tradId, track)}
                    placeholder={`Search song for ${tradition?.label}...`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepReview({ formData }) {
  const events = formData.selectedEvents || [];
  const timelines = formData.timelines || {};
  const startTimes = formData.eventStartTimes || {};

  const formatTime12 = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60) % 12 || 12;
    const m = totalMinutes % 60;
    const ampm = Math.floor(totalMinutes / 60) % 24 >= 12 ? 'PM' : 'AM';
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatTimeRange = (startMin, endMin) => {
    const startH = Math.floor(startMin / 60) % 12 || 12;
    const endH = Math.floor(endMin / 60) % 12 || 12;
    const startAmpm = Math.floor(startMin / 60) % 24 >= 12 ? 'PM' : 'AM';
    const endAmpm = Math.floor(endMin / 60) % 24 >= 12 ? 'PM' : 'AM';
    if (startAmpm === endAmpm) {
      return `~${startH}–${endH} ${endAmpm}`;
    }
    return `~${startH} ${startAmpm}–${endH} ${endAmpm}`;
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="text-stone-600">Here's an overview of your event programs.</p>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const blocks = timelines[eventId] || [];
        const startTime = startTimes[eventId];
        let startTimeMinutes = null;
        if (startTime) {
          const [h, m] = startTime.split(':').map(Number);
          startTimeMinutes = h * 60 + m;
        }
        let cumMinutes = 0;

        return (
          <div key={eventId} className="space-y-3">
            <h3 className="font-heading text-xl font-semibold text-stone-800">
              {event?.emoji} {event?.label}
              {startTimeMinutes !== null && (
                <span className="ml-2 text-sm font-normal text-gold-600">
                  {formatTime12(startTimeMinutes)} start
                </span>
              )}
            </h3>
            {blocks.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No timeline blocks yet.</p>
            ) : (
              <div className="relative pl-6 border-l-2 border-gold-300 space-y-3">
                {blocks.map((block, index) => {
                  const startMin = cumMinutes;
                  cumMinutes += block.duration || 0;
                  const blockType = timelineBlockTypes.find((b) => b.id === block.type);
                  const hasPerf = block.type === 'performance' && (block.performerName || block.songName);
                  const hasSpeech = block.type === 'speech' && block.speaker;

                  // Show milestone timestamp every 4 items (after the 4th, 8th, etc.)
                  const showMilestone = startTimeMinutes !== null && (index + 1) % 4 === 0 && index < blocks.length - 1;
                  const milestoneTime = startTimeMinutes + cumMinutes;

                  // Calculate a range: current time to ~30 min ahead
                  const milestoneEndTime = milestoneTime + 30;

                  return (
                    <div key={block.id}>
                      <div className="relative">
                        <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-gold-500 border-2 border-white" />
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-stone-400 w-16">
                              {startTimeMinutes !== null
                                ? formatTime12(startTimeMinutes + startMin)
                                : `+${startMin}m`}
                            </span>
                            <span className="text-sm">{blockType?.icon}</span>
                            <span className="text-sm font-medium text-stone-700">{block.label}</span>
                            <span className="text-xs text-stone-400">({block.duration}min)</span>
                          </div>
                          {hasPerf && (
                            <p className="text-xs text-stone-500 ml-[4.5rem] mt-0.5">
                              {block.performerName}{block.songName ? ` — "${block.songName}"` : ''}
                            </p>
                          )}
                          {hasSpeech && (
                            <p className="text-xs text-stone-500 ml-[4.5rem] mt-0.5">
                              {block.speaker}{block.relationship ? ` (${block.relationship})` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      {showMilestone && (
                        <div className="relative mt-2 mb-1">
                          <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-gold-300 border-2 border-gold-100" />
                          <div className="bg-gold-50 border border-gold-200 rounded-md px-3 py-1.5 inline-block">
                            <span className="text-xs font-medium text-gold-700">
                              Estimated {formatTimeRange(milestoneTime, milestoneEndTime)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* End time */}
                {startTimeMinutes !== null && blocks.length > 0 && (
                  <div className="relative">
                    <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-stone-400 border-2 border-white" />
                    <span className="text-xs font-medium text-stone-500">
                      Estimated end: {formatTime12(startTimeMinutes + cumMinutes)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
