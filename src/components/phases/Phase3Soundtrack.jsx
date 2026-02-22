import { useState } from 'react';
import { useFormData } from '../../context/FormDataContext';
import { useToast } from '../../context/ToastContext';
import PhaseWrapper from '../common/PhaseWrapper';
import MusicSearch from '../features/MusicSearch';
import Select from '../common/Select';
import Input from '../common/Input';
import Card from '../common/Card';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import { eventOptions, moodOptions } from '../../data/demoData';

const steps = [
  'Must-Play Songs',
  'Do-Not-Play Songs',
  'Vibe by Event',
  'Special Moments',
  'Custom Mixes',
  'Playlist Import',
];

export default function Phase3Soundtrack() {
  const { formData, updateField, setFormData } = useFormData();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);

  const handleStepChange = (s) => {
    setStep(s);
    addToast('Saved!', 'success', 1500);
  };

  return (
    <PhaseWrapper
      phase={3}
      phaseTitle="Your Soundtrack"
      steps={steps}
      currentStep={step}
      onStepChange={handleStepChange}
      nextPath="/phase/4"
      prevPath="/phase/2"
    >
      {step === 0 && <StepMustPlay formData={formData} setFormData={setFormData} addToast={addToast} />}
      {step === 1 && <StepDoNotPlay formData={formData} setFormData={setFormData} addToast={addToast} />}
      {step === 2 && <StepVibeByEvent formData={formData} setFormData={setFormData} />}
      {step === 3 && <StepSpecialMoments formData={formData} setFormData={setFormData} />}
      {step === 4 && <StepCustomMixes formData={formData} updateField={updateField} addToast={addToast} />}
      {step === 5 && <StepPlaylistImport formData={formData} />}
    </PhaseWrapper>
  );
}

function SongList({ songs, onRemove }) {
  if (!songs?.length) return null;
  return (
    <div className="space-y-2 mt-4">
      {songs.map((song) => (
        <div key={song.id} className="flex items-center gap-3 bg-stone-50 rounded-lg p-3">
          {song.albumArt ? (
            <img src={song.albumArt} alt="" className="w-10 h-10 rounded" />
          ) : (
            <div className="w-10 h-10 rounded bg-stone-200 flex items-center justify-center text-stone-400">♫</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">{song.name}</p>
            <p className="text-xs text-stone-500 truncate">{song.artist}</p>
          </div>
          {song.event && (
            <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded">
              {eventOptions.find((e) => e.id === song.event)?.label || song.event}
            </span>
          )}
          <button
            onClick={() => onRemove(song.id)}
            className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function StepMustPlay({ formData, setFormData, addToast }) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const songs = formData.mustPlaySongs || [];
  const events = formData.selectedEvents || [];

  const addSong = (track) => {
    const newSong = {
      id: Date.now().toString(),
      trackId: track.id,
      name: track.name,
      artist: track.artist,
      albumArt: track.albumArt || '',
      event: selectedEvent,
    };
    setFormData((prev) => ({ ...prev, mustPlaySongs: [...(prev.mustPlaySongs || []), newSong] }));
    addToast(`"${track.name}" added!`, 'success');
  };

  const removeSong = (id) => {
    setFormData((prev) => ({ ...prev, mustPlaySongs: prev.mustPlaySongs.filter((s) => s.id !== id) }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <p className="text-stone-600 mb-1">
          Songs that <strong>must</strong> be played at your wedding.
        </p>
        <p className="text-xs text-stone-400">Target: up to 20 songs across all events</p>
      </div>

      <Select
        label="For which event?"
        options={events.map((e) => ({ value: e, label: eventOptions.find((o) => o.id === e)?.label || e }))}
        value={selectedEvent}
        onChange={(e) => setSelectedEvent(e.target.value)}
      />

      <MusicSearch onSelect={addSong} placeholder="Search songs to add..." />

      <SongList songs={songs} onRemove={removeSong} />

      <p className="text-xs text-stone-400">{songs.length}/20 songs added</p>
    </div>
  );
}

function StepDoNotPlay({ formData, setFormData, addToast }) {
  const songs = formData.doNotPlaySongs || [];

  const addSong = (track) => {
    const newSong = {
      id: Date.now().toString(),
      trackId: track.id,
      name: track.name,
      artist: track.artist,
      albumArt: track.albumArt || '',
    };
    setFormData((prev) => ({ ...prev, doNotPlaySongs: [...(prev.doNotPlaySongs || []), newSong] }));
    addToast(`"${track.name}" added to do-not-play`, 'info');
  };

  const removeSong = (id) => {
    setFormData((prev) => ({ ...prev, doNotPlaySongs: prev.doNotPlaySongs.filter((s) => s.id !== id) }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium text-sm">We take this seriously. 🚫</p>
        <p className="text-red-600 text-xs mt-1">
          These songs will <strong>never</strong> be played at your wedding. Period.
        </p>
      </div>

      <MusicSearch onSelect={addSong} placeholder="Search songs to ban..." />

      <SongList songs={songs} onRemove={removeSong} />
    </div>
  );
}

function StepVibeByEvent({ formData, setFormData }) {
  const events = formData.selectedEvents || [];
  const vibes = formData.eventVibes || {};

  const updateVibe = (eventId, vibe) => {
    setFormData((prev) => ({
      ...prev,
      eventVibes: { ...prev.eventVibes, [eventId]: vibe },
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">What vibe do you want at each event?</p>
      {events.map((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const options = moodOptions[eventId] || moodOptions.reception;
        return (
          <div key={eventId} className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-stone-800">
              {event?.emoji} {event?.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((mood) => (
                <button
                  key={mood}
                  onClick={() => updateVibe(eventId, mood)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors text-left cursor-pointer ${
                    vibes[eventId] === mood
                      ? 'bg-gold-600 text-white border-gold-600'
                      : 'border-stone-300 text-stone-600 hover:border-gold-400'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepSpecialMoments({ formData, setFormData }) {
  const moments = formData.specialMoments || {};

  const momentFields = [
    { key: 'firstDance', label: 'First Dance' },
    { key: 'fatherDaughter', label: 'Father-Daughter Dance' },
    { key: 'motherSon', label: 'Mother-Son Dance' },
    { key: 'coupleEntrance', label: 'Couple Entrance' },
    { key: 'lastSong', label: 'Last Song of the Night' },
  ];

  const typeOptions = {
    firstDance: ['song', 'not-sure'],
    fatherDaughter: ['song', 'skip'],
    motherSon: ['song', 'skip'],
    coupleEntrance: ['song', 'surprise'],
    lastSong: ['song', 'dj-choice'],
  };

  const typeLabels = {
    'song': 'Choose a song',
    'not-sure': 'Not sure yet',
    'skip': 'Skip this',
    'surprise': 'Surprise me!',
    'dj-choice': "DJ's choice",
  };

  const updateMoment = (key, data) => {
    setFormData((prev) => ({
      ...prev,
      specialMoments: { ...prev.specialMoments, [key]: data },
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">Choose songs for your most special moments.</p>
      {momentFields.map(({ key, label }) => {
        const moment = moments[key] || {};
        const options = typeOptions[key];
        return (
          <Card key={key} className="p-5 space-y-3">
            <h3 className="font-medium text-stone-800">{label}</h3>
            <div className="flex gap-2 flex-wrap">
              {options.map((type) => (
                <button
                  key={type}
                  onClick={() => updateMoment(key, { type })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    moment.type === type
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-stone-300 text-stone-500'
                  }`}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
            {moment.type === 'song' && (
              <div className="mt-2">
                {moment.name ? (
                  <div className="flex items-center gap-3 bg-stone-50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded bg-gold-100 flex items-center justify-center text-gold-600">♫</div>
                    <div>
                      <p className="text-sm font-medium">{moment.name}</p>
                      <p className="text-xs text-stone-500">{moment.artist}</p>
                    </div>
                    <button
                      onClick={() => updateMoment(key, { type: 'song' })}
                      className="ml-auto text-stone-400 hover:text-red-500 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <MusicSearch
                    onSelect={(track) => updateMoment(key, { type: 'song', name: track.name, artist: track.artist, trackId: track.id, previewUrl: track.previewUrl })}
                    placeholder={`Search for ${label.toLowerCase()} song...`}
                  />
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function StepCustomMixes({ formData, updateField, addToast }) {
  const mixes = formData.customMixes || [];

  const addMix = () => {
    updateField('customMixes', [...mixes, { id: Date.now().toString(), name: '', songs: '', timestamps: '', notes: '' }]);
    addToast('Mix request added!', 'success', 1500);
  };

  const updateMix = (id, field, value) => {
    updateField('customMixes', mixes.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const removeMix = (id) => {
    updateField('customMixes', mixes.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <p className="text-stone-600">Need custom mashups or mixes? (Optional)</p>
        <div className="bg-gold-50 border border-gold-200 rounded-lg p-3 mt-3">
          <p className="text-gold-800 text-xs font-medium">
            💡 Custom mix editing is billed at $100/hr. We'll confirm scope before starting.
          </p>
        </div>
      </div>

      {mixes.map((mix) => (
        <Card key={mix.id} className="p-4 space-y-3">
          <div className="flex justify-between">
            <Input
              label="Performance / Mix Name"
              value={mix.name}
              onChange={(e) => updateMix(mix.id, 'name', e.target.value)}
              placeholder="e.g., Couple's Mashup"
              className="flex-1"
            />
            <button onClick={() => removeMix(mix.id)} className="ml-2 mt-6 text-stone-400 hover:text-red-500 cursor-pointer">✕</button>
          </div>
          <TextArea
            label="Songs to include"
            value={mix.songs}
            onChange={(e) => updateMix(mix.id, 'songs', e.target.value)}
            placeholder="List the songs and artists..."
          />
          <Input
            label="Timestamp notes (optional)"
            value={mix.timestamps}
            onChange={(e) => updateMix(mix.id, 'timestamps', e.target.value)}
            placeholder="e.g., Start with chorus of Song A, transition at 1:30..."
          />
        </Card>
      ))}

      <Button variant="secondary" size="sm" onClick={addMix}>
        + Add Custom Mix Request
      </Button>
    </div>
  );
}

function StepPlaylistImport() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <p className="text-stone-600">Have a playlist you'd like us to reference? Share it here.</p>

      <Card className="p-8 text-center">
        <div className="text-4xl mb-4">🎵</div>
        <h3 className="font-heading text-xl font-semibold text-stone-800 mb-2">Share a Playlist</h3>
        <p className="text-sm text-stone-500 mb-6">
          Paste a link to your Spotify, Apple Music, or YouTube Music playlist.
          We'll use it as inspiration for your event soundtrack.
        </p>
        <input
          type="url"
          placeholder="https://open.spotify.com/playlist/... or any playlist link"
          className="w-full px-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent mb-4"
        />
        <Button variant="primary" size="md" onClick={() => alert('Playlist link saved! Your DJ will review it.')}>
          Save Playlist Link
        </Button>
      </Card>

      <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
        <p className="text-gold-800 text-sm">
          💡 Tip: Even if you've added must-play songs above, sharing a full playlist helps us
          understand your overall taste and fill in the gaps between key moments.
        </p>
      </div>
    </div>
  );
}
