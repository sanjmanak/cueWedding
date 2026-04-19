import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { calculateAllPhases } from '../../utils/progress';
import { blankFormData } from '../../data/demoData';
import { eventOptions } from '../../data/demoData';
import { formatRelativeTime } from '../../utils/time';
import Avatar from '../common/Avatar';

const STALLED_DAYS = 3;
const STALLED_RED_DAYS = 7;

export default function AdminDashboard() {
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ key: 'updatedAt', direction: 'desc' });
  const [stalledOnly, setStalledOnly] = useState(false);

  useEffect(() => {
    loadWeddings();
  }, []);

  async function loadWeddings() {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    try {
      const snap = await getDocs(collection(db, 'weddings'));
      const list = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const formData = { ...blankFormData, ...(data.formData || {}) };
        const progress = calculateAllPhases(formData);

        list.push({
          id: docSnap.id,
          brideName: formData.brideName || '',
          brideLastName: formData.brideLastName || '',
          groomName: formData.groomName || '',
          groomLastName: formData.groomLastName || '',
          firstEventDate: formData.firstEventDate || '',
          selectedEvents: formData.selectedEvents || [],
          confirmed: formData.confirmed || false,
          progress,
          meta: data.meta || {},
          profilePhoto: data.meta?.profile?.photo || null,
        });
      });

      setWeddings(list);
    } catch (err) {
      console.error('Error loading weddings:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeWeddings = weddings.filter((w) => !w.confirmed);
  const completedWeddings = weddings.filter((w) => w.confirmed);
  const stalledWeddings = weddings.filter(isStalled);

  const visibleWeddings = useMemo(() => {
    const base = stalledOnly ? weddings.filter(isStalled) : weddings;
    const sorted = [...base].sort(compareWeddings(sort));
    return sorted;
  }, [weddings, sort, stalledOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' }
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
        <Link
          to="/admin/weddings/new"
          className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          + New Wedding
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Weddings" value={weddings.length} color="bg-stone-900" />
        <StatCard label="In Progress" value={activeWeddings.length} color="bg-blue-600" />
        <StatCard label="Completed" value={completedWeddings.length} color="bg-emerald-600" />
        <StatCard
          label={`⚠ Stalled (>${STALLED_DAYS} days)`}
          value={stalledWeddings.length}
          color="bg-amber-500"
          active={stalledOnly}
          onClick={() => setStalledOnly((v) => !v)}
        />
      </div>

      {stalledOnly && (
        <div className="flex items-center justify-between mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <span className="text-amber-800">
            Showing {stalledWeddings.length} stalled wedding{stalledWeddings.length === 1 ? '' : 's'} (no updates in {STALLED_DAYS}+ days, under 80% complete)
          </span>
          <button
            onClick={() => setStalledOnly(false)}
            className="text-amber-700 hover:text-amber-900 font-medium"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Wedding list */}
      {weddings.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-lg mb-4">No weddings yet</p>
          <Link
            to="/admin/weddings/new"
            className="text-stone-600 hover:text-stone-900 text-sm underline"
          >
            Create your first wedding
          </Link>
        </div>
      ) : visibleWeddings.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-lg">No stalled weddings — everyone's on track.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <SortableTh label="Couple" sortKey="couple" sort={sort} onClick={toggleSort} />
                  <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">Events</th>
                  <SortableTh label="First Event Date" sortKey="firstEventDate" sort={sort} onClick={toggleSort} className="hidden md:table-cell" />
                  <SortableTh label="Progress" sortKey="progress" sort={sort} onClick={toggleSort} />
                  <SortableTh label="Last Updated" sortKey="updatedAt" sort={sort} onClick={toggleSort} className="hidden sm:table-cell" />
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleWeddings.map((wedding) => (
                  <WeddingRow key={wedding.id} wedding={wedding} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableTh({ label, sortKey, sort, onClick, className = '' }) {
  const active = sort.key === sortKey;
  const arrow = active ? (sort.direction === 'asc' ? '↑' : '↓') : '';
  const base = 'text-left px-4 py-3 font-medium text-stone-600 cursor-pointer select-none hover:text-stone-900';
  return (
    <th
      className={`${base} ${className}`.trim()}
      onClick={() => onClick(sortKey)}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-xs ${active ? 'text-stone-900' : 'text-stone-300'}`}>
          {arrow || '↕'}
        </span>
      </span>
    </th>
  );
}

function StatCard({ label, value, color, onClick, active }) {
  const base = 'bg-white rounded-xl border p-5 text-left w-full transition-all';
  const interactive = onClick
    ? active
      ? 'border-amber-400 ring-2 ring-amber-200 cursor-pointer'
      : 'border-stone-200 hover:border-stone-300 hover:shadow-sm cursor-pointer'
    : 'border-stone-200';
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`${base} ${interactive}`} onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0`}>
          {value}
        </div>
        <span className="text-sm text-stone-600">{label}</span>
      </div>
    </Tag>
  );
}

function WeddingRow({ wedding }) {
  const coupleName = getCoupleDisplayName(wedding);
  const eventLabels = wedding.selectedEvents
    .map((id) => eventOptions.find((e) => e.id === id))
    .filter(Boolean)
    .map((e) => e.emoji)
    .join(' ');

  const dateStr = wedding.firstEventDate
    ? new Date(wedding.firstEventDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const updatedAtMs = getUpdatedAtMs(wedding);
  const updatedStr = updatedAtMs ? formatRelativeTime(new Date(updatedAtMs)) : '—';
  const days = getDaysSinceUpdate(wedding);
  const stalled = isStalled(wedding);

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            photoUrl={wedding.profilePhoto?.dataUrl}
            brideName={wedding.brideName}
            groomName={wedding.groomName}
            size={36}
          />
          <div className="min-w-0">
            <div className="font-medium text-stone-900 truncate">{coupleName}</div>
            {wedding.meta.brideEmail && (
              <div className="text-xs text-stone-400 truncate max-w-[200px]">{wedding.meta.brideEmail}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-base" title={wedding.selectedEvents.join(', ')}>
          {eventLabels || '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-stone-600 hidden md:table-cell">{dateStr}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                wedding.progress.total >= 80 ? 'bg-emerald-500' :
                wedding.progress.total >= 40 ? 'bg-amber-500' : 'bg-stone-400'
              }`}
              style={{ width: `${wedding.progress.total}%` }}
            />
          </div>
          <span className="text-xs text-stone-500 w-8">{wedding.progress.total}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{updatedStr}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge confirmed={wedding.confirmed} progress={wedding.progress.total} />
          {stalled && <StalledPill days={days} />}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          to={`/admin/weddings/${wedding.id}`}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100 transition-colors"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function StatusBadge({ confirmed, progress }) {
  if (confirmed) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Completed</span>;
  }
  if (progress === 0) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">New</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">In Progress</span>;
}

function StalledPill({ days }) {
  const red = days != null && days > STALLED_RED_DAYS;
  const cls = red
    ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700';
  const label = days != null ? `⚠ Stalled · ${Math.floor(days)}d` : '⚠ Stalled';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function getUpdatedAtMs(wedding) {
  const u = wedding.meta.updatedAt?.seconds;
  const c = wedding.meta.createdAt?.seconds;
  const sec = u || c || 0;
  return sec * 1000;
}

function getDaysSinceUpdate(wedding) {
  const ms = getUpdatedAtMs(wedding);
  if (!ms) return null;
  return (Date.now() - ms) / 86400000;
}

function isStalled(wedding) {
  if (wedding.confirmed) return false;
  if (wedding.progress.total >= 80) return false;
  const days = getDaysSinceUpdate(wedding);
  return days != null && days > STALLED_DAYS;
}

function compareWeddings(sort) {
  const dir = sort.direction === 'asc' ? 1 : -1;
  return (a, b) => {
    const av = sortValue(a, sort.key);
    const bv = sortValue(b, sort.key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // nulls last
    if (bv == null) return -1;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  };
}

function sortValue(wedding, key) {
  switch (key) {
    case 'couple':
      return getCoupleDisplayName(wedding).toLowerCase();
    case 'firstEventDate':
      return wedding.firstEventDate || null;
    case 'progress':
      return wedding.progress.total;
    case 'updatedAt':
      return getUpdatedAtMs(wedding) || null;
    default:
      return null;
  }
}

function getCoupleDisplayName(wedding) {
  const bride = wedding.brideName || '';
  const groom = wedding.groomName || '';
  if (bride && groom) return `${bride} & ${groom}`;
  if (bride) return bride;
  if (groom) return groom;
  return 'Unnamed Couple';
}
