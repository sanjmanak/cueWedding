import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { blankFormData, eventOptions, ceremonyTraditions, equipmentOptions } from '../../data/demoData';
import { calculateAllPhases } from '../../utils/progress';
import { generateRunSheet } from '../../utils/generatePDF';

export default function WeddingDetail() {
  const { weddingId } = useParams();
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState({ 1: true });

  useEffect(() => {
    loadWedding();
  }, [weddingId]);

  async function loadWedding() {
    if (!isFirebaseConfigured || !db || !weddingId) {
      setLoading(false);
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'weddings', weddingId));
      if (snap.exists()) {
        const data = snap.data();
        setWedding({
          id: snap.id,
          formData: { ...blankFormData, ...(data.formData || {}) },
          meta: data.meta || {},
        });
      }
    } catch (err) {
      console.error('Error loading wedding:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500">Wedding not found.</p>
        <Link to="/admin" className="text-sm text-stone-600 hover:text-stone-900 underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const d = wedding.formData;
  const progress = calculateAllPhases(d);

  const togglePhase = (phase) => {
    setExpandedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  const handleDownloadPDF = () => {
    generateRunSheet(d);
  };

  const coupleName = [d.brideName, d.groomName].filter(Boolean).join(' & ') || 'Unnamed Couple';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/admin" className="text-xs text-stone-400 hover:text-stone-600 mb-1 inline-block">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-stone-900">{coupleName}</h1>
          {d.firstEventDate && (
            <p className="text-sm text-stone-500 mt-1">
              {new Date(d.firstEventDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          )}
        </div>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Download PDF
        </button>
      </div>

      {/* Progress overview */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-stone-700">Overall Progress</span>
          <span className="text-sm font-semibold text-stone-900">{progress.total}%</span>
        </div>
        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${
              progress.total >= 80 ? 'bg-emerald-500' : progress.total >= 40 ? 'bg-amber-500' : 'bg-stone-400'
            }`}
            style={{ width: `${progress.total}%` }}
          />
        </div>
        <div className="grid grid-cols-6 gap-2">
          {['Story', 'People', 'Soundtrack', 'Program', 'Details', 'Review'].map((label, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-stone-400">{label}</div>
              <div className={`text-sm font-semibold ${progress.phases[i + 1] >= 80 ? 'text-emerald-600' : progress.phases[i + 1] > 0 ? 'text-amber-600' : 'text-stone-300'}`}>
                {progress.phases[i + 1]}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase sections */}
      <div className="space-y-3">
        <PhaseSection title="Phase 1: Your Story" phase={1} progress={progress.phases[1]} expanded={expandedPhases[1]} onToggle={() => togglePhase(1)}>
          <DataRow label="Bride" value={`${d.brideName} ${d.brideLastName}`.trim()} />
          <DataRow label="Groom" value={`${d.groomName} ${d.groomLastName}`.trim()} />
          <DataRow label="How They Met" value={d.howMet} />
          {d.datingApp && <DataRow label="Dating App" value={d.datingApp} />}
          {d.meetDetail && <DataRow label="Fun Detail" value={d.meetDetail} />}
          <DataRow label="Events" value={d.selectedEvents?.map(id => eventOptions.find(e => e.id === id)?.label).filter(Boolean).join(', ')} />
          <DataRow label="Vibe" value={d.vibeWords?.join(', ')} />
          <DataRow label="Bollywood Era" value={d.bollywoodEra} />
          <DataRow label="Western Music" value={d.westernMusic} />
          {d.selectedEvents?.map(eventId => {
            const venue = d.eventVenues?.[eventId];
            const date = d.eventDates?.[eventId];
            const guests = d.eventGuestCounts?.[eventId];
            const eventLabel = eventOptions.find(e => e.id === eventId)?.label || eventId;
            if (!venue?.name && !date && !guests) return null;
            return (
              <div key={eventId} className="mt-2 pl-3 border-l-2 border-stone-200">
                <div className="text-xs font-medium text-stone-500 mb-1">{eventLabel}</div>
                {venue?.name && <DataRow label="Venue" value={`${venue.name}${venue.address ? ' — ' + venue.address : ''} (${venue.setting || ''})`} small />}
                {date && <DataRow label="Date" value={date} small />}
                {guests && <DataRow label="Guests" value={guests} small />}
              </div>
            );
          })}
        </PhaseSection>

        <PhaseSection title="Phase 2: Your People" phase={2} progress={progress.phases[2]} expanded={expandedPhases[2]} onToggle={() => togglePhase(2)}>
          <DataRow label="Bride's Father" value={d.brideParents?.father} />
          <DataRow label="Bride's Mother" value={d.brideParents?.mother} />
          <DataRow label="Groom's Father" value={d.groomParents?.father} />
          <DataRow label="Groom's Mother" value={d.groomParents?.mother} />
          {d.siblings?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-stone-500 mb-1">Siblings & Wedding Party ({d.siblings.length})</div>
              {d.siblings.map(p => (
                <DataRow key={p.id} label={p.role} value={`${p.name} (${p.side})`} small />
              ))}
            </div>
          )}
          {d.keyRelatives?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-stone-500 mb-1">Key Relatives ({d.keyRelatives.length})</div>
              {d.keyRelatives.map(p => (
                <DataRow key={p.id} label={p.role} value={`${p.name} (${p.side})`} small />
              ))}
            </div>
          )}
          {d.otherVIPs?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-stone-500 mb-1">Other VIPs ({d.otherVIPs.length})</div>
              {d.otherVIPs.map(p => (
                <DataRow key={p.id} label={p.role} value={`${p.name} (${p.side})`} small />
              ))}
            </div>
          )}
          {Object.keys(d.pronunciations || {}).length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-stone-500 mb-1">Pronunciations</div>
              {Object.entries(d.pronunciations).map(([name, pron]) => (
                <DataRow key={name} label={name} value={pron} small />
              ))}
            </div>
          )}
        </PhaseSection>

        <PhaseSection title="Phase 3: Your Soundtrack" phase={3} progress={progress.phases[3]} expanded={expandedPhases[3]} onToggle={() => togglePhase(3)}>
          {d.mustPlaySongs?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-stone-500 mb-1">Must-Play Songs ({d.mustPlaySongs.length})</div>
              {d.mustPlaySongs.map(s => (
                <DataRow key={s.id} label={s.event || 'General'} value={`${s.name} — ${s.artist}`} small />
              ))}
            </div>
          )}
          {d.doNotPlaySongs?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-stone-500 mb-1">Do Not Play ({d.doNotPlaySongs.length})</div>
              {d.doNotPlaySongs.map(s => (
                <DataRow key={s.id} label="" value={`${s.name} — ${s.artist}`} small />
              ))}
            </div>
          )}
          {Object.keys(d.eventVibes || {}).length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-stone-500 mb-1">Vibe by Event</div>
              {Object.entries(d.eventVibes).map(([eventId, vibe]) => (
                <DataRow key={eventId} label={eventOptions.find(e => e.id === eventId)?.label || eventId} value={vibe} small />
              ))}
            </div>
          )}
          {d.specialMoments && Object.keys(d.specialMoments).length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-stone-500 mb-1">Special Moments</div>
              {Object.entries(d.specialMoments).map(([key, moment]) => {
                if (!moment?.type) return null;
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                let value = moment.type;
                if (moment.type === 'song') value = `${moment.name} — ${moment.artist}`;
                else if (moment.type === 'dj-choice') value = 'DJ Choice';
                else if (moment.type === 'surprise') value = 'Surprise';
                else if (moment.type === 'skip') value = 'Skip';
                return <DataRow key={key} label={label} value={value} small />;
              })}
            </div>
          )}
          {d.playlistUrl && <DataRow label="Playlist URL" value={d.playlistUrl} />}
        </PhaseSection>

        <PhaseSection title="Phase 4: Your Program" phase={4} progress={progress.phases[4]} expanded={expandedPhases[4]} onToggle={() => togglePhase(4)}>
          {d.selectedEvents?.map(eventId => {
            const timeline = d.timelines?.[eventId];
            const template = d.eventTemplates?.[eventId];
            const startTime = d.eventStartTimes?.[eventId];
            const eventLabel = eventOptions.find(e => e.id === eventId)?.label || eventId;
            if (!timeline?.length && !template) return null;
            return (
              <div key={eventId} className="mb-3 pl-3 border-l-2 border-stone-200">
                <div className="text-xs font-medium text-stone-500 mb-1">
                  {eventLabel} {startTime && `(Start: ${startTime})`}
                </div>
                {template && <DataRow label="Template" value={template} small />}
                {timeline?.map((block, i) => (
                  <div key={block.id} className="text-xs text-stone-600 py-0.5">
                    <span className="text-stone-400">{i + 1}.</span>{' '}
                    <span className="font-medium">{block.label}</span>{' '}
                    <span className="text-stone-400">({block.duration}min)</span>
                    {block.performerName && <span className="text-stone-500"> — {block.performerName}</span>}
                    {block.speaker && <span className="text-stone-500"> — {block.speaker}</span>}
                  </div>
                ))}
              </div>
            );
          })}
          {d.ceremonyTraditions?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-stone-500 mb-1">Ceremony Traditions</div>
              <div className="text-xs text-stone-600">
                {d.ceremonyTraditions.map(id => ceremonyTraditions.find(t => t.id === id)?.label).filter(Boolean).join(', ')}
              </div>
            </div>
          )}
        </PhaseSection>

        <PhaseSection title="Phase 5: Final Details" phase={5} progress={progress.phases[5]} expanded={expandedPhases[5]} onToggle={() => togglePhase(5)}>
          {d.vendors && Object.entries(d.vendors).map(([role, vendor]) => {
            if (!vendor?.name) return null;
            return (
              <DataRow key={role} label={role.charAt(0).toUpperCase() + role.slice(1)}
                value={`${vendor.name}${vendor.phone ? ' | ' + vendor.phone : ''}${vendor.email ? ' | ' + vendor.email : ''}`} small />
            );
          })}
          <DataRow label="Lighting Color" value={d.lightingColor ? <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block border border-stone-300" style={{ backgroundColor: d.lightingColor }} />{d.lightingColor}</span> : ''} />
          <DataRow label="Equipment" value={d.equipment?.join(', ')} />
          <DataRow label="Photo Booth" value={d.photoBooth ? 'Yes' : 'No'} />
          {d.surprises && <DataRow label="Surprises" value={d.surprises} />}
          {d.additionalNotes && <DataRow label="Notes" value={d.additionalNotes} />}
        </PhaseSection>

        <PhaseSection title="Phase 6: Review & Sign-off" phase={6} progress={progress.phases[6]} expanded={expandedPhases[6]} onToggle={() => togglePhase(6)}>
          <DataRow label="Confirmed" value={d.confirmed ? 'Yes' : 'Not yet'} />
          <DataRow label="Signature" value={d.signatureName} />
          <DataRow label="Signature Date" value={d.signatureDate} />
        </PhaseSection>
      </div>
    </div>
  );
}

function PhaseSection({ title, phase, progress, expanded, onToggle, children }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            progress >= 80 ? 'bg-emerald-100 text-emerald-700' :
            progress > 0 ? 'bg-amber-100 text-amber-700' :
            'bg-stone-100 text-stone-400'
          }`}>
            {phase}
          </span>
          <span className="text-sm font-medium text-stone-900">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${progress >= 80 ? 'text-emerald-600' : progress > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
            {progress}%
          </span>
          <span className="text-stone-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-100 pt-3 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value, small }) {
  if (!value && value !== 0) return null;
  return (
    <div className={`flex gap-2 ${small ? 'text-xs' : 'text-sm'} py-0.5`}>
      {label && <span className="text-stone-400 min-w-[100px] shrink-0">{label}:</span>}
      <span className="text-stone-700">{value}</span>
    </div>
  );
}
