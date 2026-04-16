import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { calculateAllPhases } from '../../utils/progress';
import { blankFormData } from '../../data/demoData';
import { eventOptions } from '../../data/demoData';
import Avatar from '../common/Avatar';

export default function AdminDashboard() {
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // Sort by creation date (newest first)
      list.sort((a, b) => {
        const aTime = a.meta.createdAt?.seconds || 0;
        const bTime = b.meta.createdAt?.seconds || 0;
        return bTime - aTime;
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
  const needsAttention = weddings.filter((w) => {
    if (w.confirmed) return false;
    const lastUpdate = w.meta.updatedAt?.seconds || 0;
    const sevenDaysAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;
    return w.progress.total < 50 || lastUpdate < sevenDaysAgo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Weddings" value={weddings.length} color="bg-stone-900" />
        <StatCard label="In Progress" value={activeWeddings.length} color="bg-blue-600" />
        <StatCard label="Completed" value={completedWeddings.length} color="bg-emerald-600" />
        <StatCard label="Needs Attention" value={needsAttention.length} color="bg-amber-500" />
      </div>

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
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Couple</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">Events</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600 hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Progress</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {weddings.map((wedding) => (
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

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
          {value}
        </div>
        <span className="text-sm text-stone-600">{label}</span>
      </div>
    </div>
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
      <td className="px-4 py-3">
        <StatusBadge confirmed={wedding.confirmed} progress={wedding.progress.total} />
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

function getCoupleDisplayName(wedding) {
  const bride = wedding.brideName || '';
  const groom = wedding.groomName || '';
  if (bride && groom) return `${bride} & ${groom}`;
  if (bride) return bride;
  if (groom) return groom;
  return 'Unnamed Couple';
}
