import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '../../lib/firebase';
import { blankFormData, eventOptions, ceremonyTraditions, equipmentOptions, bollywoodEras, westernMusicOptions } from '../../data/demoData';
import { calculateAllPhases } from '../../utils/progress';
import { generateRunSheet } from '../../utils/generatePDF';
import { useAuth } from '../../context/AuthContext';

const PHASE_LABELS = {
  1: 'Your Story',
  2: 'Your People',
  3: 'Your Soundtrack',
  4: 'Your Program',
  5: 'Final Details',
  6: 'Review & Sign-off',
};

// Return the lowest-numbered phase below 80% completion, or null if all are complete.
function findLowestIncompletePhase(phases) {
  for (let p = 1; p <= 6; p++) {
    if ((phases[p] || 0) < 80) return p;
  }
  return null;
}

const VENDOR_ROLES = ['planner', 'photographer', 'videographer', 'decorator'];

const EDITABLE_PATHS = [
  'brideName', 'brideLastName', 'groomName', 'groomLastName',
  'firstEventDate', 'bollywoodEra', 'westernMusic',
  'brideParents.father', 'brideParents.mother',
  'groomParents.father', 'groomParents.mother',
  'lightingColor', 'photoBooth', 'surprises', 'additionalNotes',
  ...VENDOR_ROLES.flatMap((role) => [
    `vendors.${role}.name`,
    `vendors.${role}.phone`,
    `vendors.${role}.email`,
  ]),
];

function getIn(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setIn(obj, path, value) {
  const keys = path.split('.');
  const root = obj == null ? {} : (Array.isArray(obj) ? [...obj] : { ...obj });
  let cursor = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = cursor[key];
    cursor[key] = next == null ? {} : (Array.isArray(next) ? [...next] : { ...next });
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
  return root;
}

function valuesEqual(a, b) {
  if (a === b) return true;
  const aEmpty = a === undefined || a === null || a === '';
  const bEmpty = b === undefined || b === null || b === '';
  if (aEmpty && bEmpty) return true;
  return false;
}

function prettifyFieldPath(path) {
  if (!path) return '';
  return path
    .split('.')
    .map((segment) => segment.replace(/([A-Z])/g, ' $1').trim())
    .map((segment) => (segment ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : segment))
    .join(' · ');
}

function formatAuditValue(value) {
  if (value === null || value === undefined || value === '') return '∅';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '∅';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

function formatRelativeTime(value) {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function WeddingDetail() {
  const { weddingId } = useParams();
  const { user } = useAuth();
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState({ 1: true });
  const [reminder, setReminder] = useState({ sending: null, justSent: null, error: null });
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    loadWedding();
  }, [weddingId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadAuditLog();
      if (!cancelled) setAuditLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [weddingId]);

  async function loadAuditLog() {
    if (!isFirebaseConfigured || !db || !weddingId) return;
    try {
      const q = query(
        collection(db, 'weddings', weddingId, 'auditLog'),
        orderBy('editedAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      setAuditEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error loading audit log:', err);
    }
  }

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

  const lowestIncompletePhase = findLowestIncompletePhase(progress.phases);
  const targetPhase = lowestIncompletePhase || 6;
  const targetPhaseLabel = PHASE_LABELS[targetPhase];
  const actionUrl = `${window.location.origin}/phase/${targetPhase}`;

  const recipients = [
    { key: 'bride', firstName: d.brideName, email: wedding.meta?.brideEmail },
    { key: 'groom', firstName: d.groomName, email: wedding.meta?.groomEmail },
  ];

  const buildReminderMessage = (firstName) =>
    `Hi ${firstName || 'there'} — quick nudge from the Special Occasions DJ team. When you have a moment, could you jump back into your wedding planner and finish "${targetPhaseLabel}"? It only takes a few minutes.\n\n${actionUrl}\n\nWe've also emailed you a secure sign-in link. Thanks!`;

  async function sendReminder(recipient) {
    if (!isFirebaseConfigured || !db || !auth || !recipient.email) return;
    setReminder({ sending: recipient.key, justSent: null, error: null });

    try {
      await sendSignInLinkToEmail(auth, recipient.email, {
        url: actionUrl,
        handleCodeInApp: true,
      });

      // Record reminder timestamp on the wedding meta (merge-nested write).
      await setDoc(
        doc(db, 'weddings', weddingId),
        {
          meta: {
            lastReminderSent: {
              [recipient.key]: {
                to: recipient.email,
                phase: targetPhase,
                sentAt: serverTimestamp(),
              },
            },
            updatedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      // Log to the wedding's audit trail.
      await addDoc(collection(db, 'weddings', weddingId, 'auditLog'), {
        action: 'reminder_sent',
        recipient: recipient.key,
        toEmail: recipient.email,
        phase: targetPhase,
        phaseLabel: targetPhaseLabel,
        editedBy: user?.uid || null,
        editedByEmail: user?.email || null,
        editedAt: serverTimestamp(),
      });

      setReminder({ sending: null, justSent: recipient.key, error: null });
      await loadWedding();
    } catch (err) {
      console.error('Reminder send error:', err);
      setReminder({
        sending: null,
        justSent: null,
        error: `Failed to send reminder to ${recipient.email}. ${err.message || ''}`.trim(),
      });
    }
  }

  async function copyReminderMessage(recipient) {
    const message = buildReminderMessage(recipient.firstName);
    try {
      await navigator.clipboard.writeText(message);
      setCopyFeedback(recipient.key);
      setTimeout(() => setCopyFeedback((curr) => (curr === recipient.key ? null : curr)), 1800);
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
  }

  function enterEditMode() {
    setDraft(structuredClone(wedding.formData));
    setEditMode(true);
    setSaveError(null);
  }

  function cancelEdit() {
    setDraft(null);
    setEditMode(false);
    setSaveError(null);
  }

  function updateDraft(path, value) {
    setDraft((prev) => setIn(prev || {}, path, value));
  }

  async function handleSave() {
    if (!isFirebaseConfigured || !db || !draft) return;
    setSaving(true);
    setSaveError(null);

    try {
      // Diff draft vs original for the editable paths only.
      const original = wedding.formData;
      const diffs = [];
      for (const path of EDITABLE_PATHS) {
        const oldValue = getIn(original, path);
        const newValue = getIn(draft, path);
        if (!valuesEqual(oldValue, newValue)) {
          diffs.push({ path, oldValue, newValue });
        }
      }

      if (diffs.length === 0) {
        setEditMode(false);
        setDraft(null);
        setSaving(false);
        return;
      }

      // One write with the full merged formData. Merge protects sibling arrays
      // and meta fields we didn't touch.
      await setDoc(
        doc(db, 'weddings', weddingId),
        {
          formData: draft,
          meta: {
            updatedAt: serverTimestamp(),
            lastEditedBy: user?.uid || null,
            lastEditedByEmail: user?.email || null,
          },
        },
        { merge: true }
      );

      // One audit log entry per changed field.
      const sanitize = (v) => (v === undefined ? null : v);
      for (const { path, oldValue, newValue } of diffs) {
        await addDoc(collection(db, 'weddings', weddingId, 'auditLog'), {
          action: 'field_edited',
          field: path,
          oldValue: sanitize(oldValue),
          newValue: sanitize(newValue),
          editedBy: user?.uid || null,
          editedByEmail: user?.email || null,
          editedAt: serverTimestamp(),
        });
      }

      setEditMode(false);
      setDraft(null);
      await loadWedding();
      await loadAuditLog();
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

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
        <div className="flex items-center gap-2 shrink-0">
          {editMode ? (
            <>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-white border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isFirebaseConfigured}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={enterEditMode}
                disabled={!isFirebaseConfigured}
                className="px-4 py-2 rounded-lg bg-white border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
              >
                Edit
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {editMode && d.confirmed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
          The couple has signed off on these details. Saving edits will not reset their
          confirmation automatically — consider whether they need to re-sign.
        </div>
      )}

      {editMode && saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-xs text-red-700">
          {saveError}
        </div>
      )}

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

      {/* Reminder nudge panel */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-sm font-medium text-stone-700">Send Reminder</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {lowestIncompletePhase
                ? `Next up for the couple: Phase ${targetPhase} — ${targetPhaseLabel}`
                : 'All phases are looking good. Reminder will link to the review page.'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {recipients.map((r) => {
            const lastSent = wedding.meta?.lastReminderSent?.[r.key];
            const isSending = reminder.sending === r.key;
            const justSent = reminder.justSent === r.key;
            const disabled = !r.email || isSending || !isFirebaseConfigured;

            return (
              <div
                key={r.key}
                className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm text-stone-700">
                    {r.firstName || (r.key === 'bride' ? 'Bride' : 'Groom')}
                  </div>
                  <div className="text-xs text-stone-400 truncate">
                    {r.email || 'No email on file'}
                  </div>
                  {lastSent?.sentAt && (
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Last sent {formatRelativeTime(lastSent.sentAt)}
                      {lastSent.phase ? ` → Phase ${lastSent.phase}` : ''}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyReminderMessage(r)}
                    disabled={!r.email}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                  >
                    {copyFeedback === r.key ? 'Copied!' : 'Copy Message'}
                  </button>
                  <button
                    onClick={() => sendReminder(r)}
                    disabled={disabled}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                  >
                    {isSending ? 'Sending...' : justSent ? 'Sent!' : 'Send Email'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {reminder.error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
            {reminder.error}
          </div>
        )}

        {!recipients.some((r) => r.email) && (
          <p className="text-xs text-stone-400 mt-3">
            No email addresses on file for this couple. Add them when creating the wedding.
          </p>
        )}
      </div>

      {/* Phase sections */}
      <div className="space-y-3">
        <PhaseSection title="Phase 1: Your Story" phase={1} progress={progress.phases[1]} expanded={expandedPhases[1]} onToggle={() => togglePhase(1)}>
          {editMode ? (
            <>
              <EditableField label="Bride First Name" path="brideName" type="text" draft={draft} onChange={updateDraft} />
              <EditableField label="Bride Last Name" path="brideLastName" type="text" draft={draft} onChange={updateDraft} />
              <EditableField label="Groom First Name" path="groomName" type="text" draft={draft} onChange={updateDraft} />
              <EditableField label="Groom Last Name" path="groomLastName" type="text" draft={draft} onChange={updateDraft} />
              <EditableField label="First Event Date" path="firstEventDate" type="date" draft={draft} onChange={updateDraft} />
            </>
          ) : (
            <>
              <DataRow label="Bride" value={`${d.brideName} ${d.brideLastName}`.trim()} />
              <DataRow label="Groom" value={`${d.groomName} ${d.groomLastName}`.trim()} />
            </>
          )}
          <DataRow label="How They Met" value={d.howMet} />
          {d.datingApp && <DataRow label="Dating App" value={d.datingApp} />}
          {d.meetDetail && <DataRow label="Fun Detail" value={d.meetDetail} />}
          <DataRow label="Events" value={d.selectedEvents?.map(id => eventOptions.find(e => e.id === id)?.label).filter(Boolean).join(', ')} />
          <DataRow label="Vibe" value={d.vibeWords?.join(', ')} />
          {editMode ? (
            <>
              <EditableField label="Bollywood Era" path="bollywoodEra" type="select" options={bollywoodEras} draft={draft} onChange={updateDraft} />
              <EditableField label="Western Music" path="westernMusic" type="select" options={westernMusicOptions} draft={draft} onChange={updateDraft} />
            </>
          ) : (
            <>
              <DataRow label="Bollywood Era" value={d.bollywoodEra} />
              <DataRow label="Western Music" value={d.westernMusic} />
            </>
          )}
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
          {editMode ? (
            <>
              <EditableField label="Bride's Father" path="brideParents.father" type="text" draft={draft} onChange={updateDraft} />
              <EditableField label="Bride's Mother" path="brideParents.mother" type="text" draft={draft} onChange={updateDraft} />
              <EditableField label="Groom's Father" path="groomParents.father" type="text" draft={draft} onChange={updateDraft} />
              <EditableField label="Groom's Mother" path="groomParents.mother" type="text" draft={draft} onChange={updateDraft} />
            </>
          ) : (
            <>
              <DataRow label="Bride's Father" value={d.brideParents?.father} />
              <DataRow label="Bride's Mother" value={d.brideParents?.mother} />
              <DataRow label="Groom's Father" value={d.groomParents?.father} />
              <DataRow label="Groom's Mother" value={d.groomParents?.mother} />
            </>
          )}
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
          {editMode ? (
            VENDOR_ROLES.map((role) => (
              <div key={role} className="mt-2 pl-3 border-l-2 border-stone-200">
                <div className="text-xs font-medium text-stone-500 mb-1">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </div>
                <EditableField label="Name" path={`vendors.${role}.name`} type="text" draft={draft} onChange={updateDraft} small />
                <EditableField label="Phone" path={`vendors.${role}.phone`} type="text" draft={draft} onChange={updateDraft} small />
                <EditableField label="Email" path={`vendors.${role}.email`} type="text" draft={draft} onChange={updateDraft} small />
              </div>
            ))
          ) : (
            d.vendors && Object.entries(d.vendors).map(([role, vendor]) => {
              if (!vendor?.name) return null;
              return (
                <DataRow key={role} label={role.charAt(0).toUpperCase() + role.slice(1)}
                  value={`${vendor.name}${vendor.phone ? ' | ' + vendor.phone : ''}${vendor.email ? ' | ' + vendor.email : ''}`} small />
              );
            })
          )}
          {editMode ? (
            <EditableField label="Lighting Color" path="lightingColor" type="color" draft={draft} onChange={updateDraft} />
          ) : (
            <DataRow label="Lighting Color" value={d.lightingColor ? <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block border border-stone-300" style={{ backgroundColor: d.lightingColor }} />{d.lightingColor}</span> : ''} />
          )}
          <DataRow label="Equipment" value={d.equipment?.join(', ')} />
          {editMode ? (
            <EditableField label="Photo Booth" path="photoBooth" type="boolean" draft={draft} onChange={updateDraft} />
          ) : (
            <DataRow label="Photo Booth" value={d.photoBooth ? 'Yes' : 'No'} />
          )}
          {editMode ? (
            <>
              <EditableField label="Surprises" path="surprises" type="textarea" draft={draft} onChange={updateDraft} />
              <EditableField label="Notes" path="additionalNotes" type="textarea" draft={draft} onChange={updateDraft} />
            </>
          ) : (
            <>
              {d.surprises && <DataRow label="Surprises" value={d.surprises} />}
              {d.additionalNotes && <DataRow label="Notes" value={d.additionalNotes} />}
            </>
          )}
        </PhaseSection>

        <PhaseSection title="Phase 6: Review & Sign-off" phase={6} progress={progress.phases[6]} expanded={expandedPhases[6]} onToggle={() => togglePhase(6)}>
          <DataRow label="Confirmed" value={d.confirmed ? 'Yes' : 'Not yet'} />
          <DataRow label="Signature" value={d.signatureName} />
          <DataRow label="Signature Date" value={d.signatureDate} />
        </PhaseSection>

        {/* Change History */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <h2 className="text-sm font-medium text-stone-700 mb-3">Change History</h2>
          {auditLoading ? (
            <div className="text-xs text-stone-400">Loading…</div>
          ) : auditEntries.length === 0 ? (
            <div className="text-xs text-stone-400">No edits yet.</div>
          ) : (
            <div className="space-y-2">
              {auditEntries.map((entry) => (
                <AuditEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditEntryRow({ entry }) {
  const relativeTime = formatRelativeTime(entry.editedAt);
  const editor = entry.editedByEmail || 'Unknown editor';

  let actionLabel = entry.action || 'Change';
  let context = null;

  if (entry.action === 'reminder_sent') {
    actionLabel = 'Reminder sent';
    const recipient = entry.recipient || 'recipient';
    const toEmail = entry.toEmail || '—';
    const phaseLabel = entry.phaseLabel || (entry.phase ? `Phase ${entry.phase}` : 'the next phase');
    context = `Reminder sent to ${recipient} (${toEmail}) for ${phaseLabel}`;
  } else if (entry.action === 'field_edited') {
    actionLabel = 'Field edited';
    const prettyField = prettifyFieldPath(entry.field);
    context = `${prettyField}: ${formatAuditValue(entry.oldValue)} → ${formatAuditValue(entry.newValue)}`;
  }

  return (
    <div className="bg-stone-50 rounded-lg px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-stone-700">{actionLabel}</span>
        {relativeTime && <span className="text-stone-400 shrink-0">{relativeTime}</span>}
      </div>
      {context && <div className="text-stone-600 mt-0.5 break-words">{context}</div>}
      <div className="text-stone-400 mt-0.5 truncate">by {editor}</div>
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

function EditableField({ label, path, type = 'text', options, draft, onChange, small }) {
  const rawValue = getIn(draft, path);
  const stringValue = rawValue == null ? '' : rawValue;
  const inputBase =
    'w-full px-2 py-1 rounded border border-stone-300 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-500';

  let control;
  if (type === 'select') {
    control = (
      <select
        value={stringValue}
        onChange={(e) => onChange(path, e.target.value)}
        className={inputBase}
      >
        <option value="">— Select —</option>
        {(options || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  } else if (type === 'textarea') {
    control = (
      <textarea
        value={stringValue}
        onChange={(e) => onChange(path, e.target.value)}
        rows={2}
        className={inputBase}
      />
    );
  } else if (type === 'boolean') {
    const on = Boolean(rawValue);
    control = (
      <button
        type="button"
        onClick={() => onChange(path, !on)}
        className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors cursor-pointer ${on ? 'bg-emerald-500' : 'bg-stone-300'}`}
        aria-pressed={on}
      >
        <span
          className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    );
  } else if (type === 'color') {
    control = (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={stringValue || '#000000'}
          onChange={(e) => onChange(path, e.target.value)}
          className="w-10 h-7 rounded cursor-pointer border border-stone-300"
        />
        <input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(path, e.target.value)}
          className={`${inputBase} max-w-[140px]`}
        />
      </div>
    );
  } else if (type === 'date') {
    control = (
      <input
        type="date"
        value={stringValue}
        onChange={(e) => onChange(path, e.target.value)}
        className={inputBase}
      />
    );
  } else {
    control = (
      <input
        type="text"
        value={stringValue}
        onChange={(e) => onChange(path, e.target.value)}
        className={inputBase}
      />
    );
  }

  return (
    <div className={`flex gap-2 items-start ${small ? 'text-xs' : 'text-sm'} py-1`}>
      <span className="text-stone-400 min-w-[100px] shrink-0 pt-1.5">{label}:</span>
      <div className="flex-1 min-w-0">{control}</div>
    </div>
  );
}
