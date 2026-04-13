import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { getAuthEmailLinkUrl } from '../../lib/authRedirect';
import { blankFormData } from '../../data/demoData';

function getInviteErrorMessage(email, err) {
  switch (err?.code) {
    case 'auth/unauthorized-continue-uri':
      return `Failed to send invite to ${email}. Add this deployed domain to Firebase Auth → Settings → Authorized domains.`;
    case 'auth/operation-not-allowed':
      return `Failed to send invite to ${email}. Enable Email/Password and Email link sign-in in Firebase Auth.`;
    case 'auth/invalid-email':
      return `Failed to send invite to ${email}. The email address is invalid.`;
    default:
      return `Failed to send invite to ${email}. Make sure Email Link sign-in is enabled in Firebase Auth.`;
  }
}

export default function CreateWedding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    brideName: '',
    brideLastName: '',
    brideEmail: '',
    groomName: '',
    groomLastName: '',
    groomEmail: '',
    firstEventDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null); // { weddingId, inviteUrl }
  const [sendingInvite, setSendingInvite] = useState({ bride: false, groom: false });
  const [inviteSent, setInviteSent] = useState({ bride: false, groom: false });
  const [error, setError] = useState(null);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.brideName.trim() || !form.groomName.trim()) {
      setError('Please enter both names.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const weddingId = crypto.randomUUID();

      // Pre-fill form data with what the admin entered
      const prefilledData = {
        ...blankFormData,
        brideName: form.brideName.trim(),
        brideLastName: form.brideLastName.trim(),
        groomName: form.groomName.trim(),
        groomLastName: form.groomLastName.trim(),
        firstEventDate: form.firstEventDate,
      };

      await setDoc(doc(db, 'weddings', weddingId), {
        formData: prefilledData,
        meta: {
          ownerUids: [],
          brideEmail: form.brideEmail.trim().toLowerCase(),
          groomEmail: form.groomEmail.trim().toLowerCase(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active',
        },
      });

      const inviteUrl = getAuthEmailLinkUrl(`/?wedding=${weddingId}`);
      setCreated({ weddingId, inviteUrl });
    } catch (err) {
      console.error('Error creating wedding:', err);
      setError('Failed to create wedding. Check your Firestore rules.');
    } finally {
      setSaving(false);
    }
  };

  const sendInviteEmail = async (to) => {
    const email = to === 'bride' ? form.brideEmail.trim() : form.groomEmail.trim();
    if (!email) return;

    setSendingInvite((prev) => ({ ...prev, [to]: true }));

    try {
      const actionCodeSettings = {
        url: created.inviteUrl,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      setInviteSent((prev) => ({ ...prev, [to]: true }));
    } catch (err) {
      console.error(`Error sending invite to ${to}:`, err);
      setError(getInviteErrorMessage(email, err));
    } finally {
      setSendingInvite((prev) => ({ ...prev, [to]: false }));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(created.inviteUrl);
  };

  if (created) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-stone-200 p-8">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">✓</div>
            <h2 className="text-xl font-semibold text-stone-900">Wedding Created</h2>
            <p className="text-stone-500 text-sm mt-1">
              {form.brideName} & {form.groomName}
            </p>
          </div>

          {/* Invite link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">Invite Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={created.inviteUrl}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-xs bg-stone-50 text-stone-600"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Share this link with the couple to start their planning.
            </p>
          </div>

          {/* Send invitations */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-stone-700">Send Email Invitations</h3>

            {form.brideEmail && (
              <div className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm text-stone-700">{form.brideName}</div>
                  <div className="text-xs text-stone-400">{form.brideEmail}</div>
                </div>
                <button
                  onClick={() => sendInviteEmail('bride')}
                  disabled={sendingInvite.bride || inviteSent.bride}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                >
                  {inviteSent.bride ? 'Sent!' : sendingInvite.bride ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            )}

            {form.groomEmail && (
              <div className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm text-stone-700">{form.groomName}</div>
                  <div className="text-xs text-stone-400">{form.groomEmail}</div>
                </div>
                <button
                  onClick={() => sendInviteEmail('groom')}
                  disabled={sendingInvite.groom || inviteSent.groom}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                >
                  {inviteSent.groom ? 'Sent!' : sendingInvite.groom ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            )}

            {!form.brideEmail && !form.groomEmail && (
              <p className="text-xs text-stone-400">No emails entered. Share the invite link directly.</p>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="flex-1 px-4 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate(`/admin/weddings/${created.weddingId}`)}
              className="flex-1 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
            >
              View Wedding
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Create New Wedding</h1>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
        {/* Bride */}
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3">The Bride</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">First Name *</label>
              <input
                type="text"
                value={form.brideName}
                onChange={(e) => updateForm('brideName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Last Name</label>
              <input
                type="text"
                value={form.brideLastName}
                onChange={(e) => updateForm('brideLastName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-stone-500 mb-1">Email</label>
            <input
              type="email"
              value={form.brideEmail}
              onChange={(e) => updateForm('brideEmail', e.target.value)}
              placeholder="For sending the invitation"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>

        {/* Groom */}
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3">The Groom</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">First Name *</label>
              <input
                type="text"
                value={form.groomName}
                onChange={(e) => updateForm('groomName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Last Name</label>
              <input
                type="text"
                value={form.groomLastName}
                onChange={(e) => updateForm('groomLastName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-stone-500 mb-1">Email</label>
            <input
              type="email"
              value={form.groomEmail}
              onChange={(e) => updateForm('groomEmail', e.target.value)}
              placeholder="For sending the invitation"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs text-stone-500 mb-1">First Event Date</label>
          <input
            type="date"
            value={form.firstEventDate}
            onChange={(e) => updateForm('firstEventDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex-1 px-4 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? 'Creating...' : 'Create Wedding'}
          </button>
        </div>
      </form>
    </div>
  );
}
