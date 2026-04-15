# CLAUDE.md — Cue Wedding Planner

Context for future Claude Code sessions. Keep this short and accurate; prefer
linking to code over re-explaining it. `ARCHITECTURE.md` is the long-form doc.

## What this is

Cue is a wedding DJ planning app for a South Asian ("desi") wedding DJ company.
Couples fill a 6-phase questionnaire (Story → People → Soundtrack → Program →
Details → Review & Sign-off); output is a PDF run sheet for the DJ team.
Admins (DJ staff) create weddings, send invites, and edit/track progress.

- **Stack**: React 19 + Vite 7 + Tailwind v4 + Firebase (Auth + Firestore) + jsPDF.
- **Routing**: BrowserRouter (`src/main.jsx:12`); admin at `/admin/*`, couple at `/phase/1..6`.
- **Deploy**: Firebase Hosting (`npm run deploy:firebase`). GitHub Pages path
  (`homepage` in `package.json:6`) is legacy — current `vite.config.js` base is `/`.

## Entry points & mental map

| File | Role |
|---|---|
| `src/main.jsx` | Provider stack: Auth → FormData → Toast → App |
| `src/App.jsx` | Routes. `ProtectedRoute` gates phases; `/admin/*` uses `AdminLayout` |
| `src/lib/firebase.js` | Initializes Firebase only if env vars present; exposes `isFirebaseConfigured` |
| `src/context/AuthContext.jsx` | Email-link + Google sign-in; auto-links users to weddings by `?wedding=` param or email match |
| `src/context/FormDataContext.jsx` | Dual provider: Firestore (debounced 1.5s writes, load-once) OR localStorage fallback |
| `src/utils/progress.js` | Pure functions — used by both couple header and admin dashboard |
| `src/utils/generatePDF.js` | jsPDF run sheet, client-side |
| `src/data/demoData.js` | `blankFormData`, `defaultDemoData`, and every option list (events, eras, traditions, equipment) |

## Couple flow

`PhaseWrapper` (`src/components/common/PhaseWrapper.jsx`) is the shell for all
phases — step indicator, back/next, progress bar. Each phase reads/writes
through `useFormData()` only. **No phase component imports Firebase directly**
(verified `grep setDoc src/components/phases` → 0 matches). All writes flow
`phase → FormDataContext.setFormData → debounced setDoc(merge: true)`.

## Admin flow

- `src/components/admin/AdminDashboard.jsx` — unpaginated `getDocs(collection('weddings'))` at mount. Sort client-side by `meta.createdAt`.
- `src/components/admin/CreateWedding.jsx` — writes `weddings/{uuid}` with `meta.brideEmail/groomEmail` and an empty `ownerUids`. Builds invite URL `/?wedding=<id>`. Optionally sends email-link via `sendSignInLinkToEmail`.
- `src/components/admin/WeddingDetail.jsx` — big file (~940 lines). Holds: read-only dump, editable scalar fields (see `EDITABLE_PATHS` at `:30-41`), reminder panel (logs to `weddings/{id}/auditLog`), 50-row audit log reader.

## Data model (Firestore)

```
users/{uid}          { email, role: 'couple'|'admin', weddingId, displayName, ...timestamps }
weddings/{id}
  formData           { ...all fields from blankFormData }
  meta               { ownerUids[], brideEmail, groomEmail, status, createdAt, updatedAt,
                       lastReminderSent.{bride|groom}, lastEditedBy, lastEditedByEmail }
  auditLog/{autoId}  { action, field?, oldValue?, newValue?, recipient?, phase?,
                       editedBy, editedByEmail, editedAt }
```

Audit actions in the wild: `reminder_sent` and `field_edited` (admin edits only
— **couple edits are NOT audited**, see `WeddingDetail.jsx:304-347` for what is).

## Auth model

- Admins: Firebase email+password **or** Google. Role comes from the user doc's
  `role` field (see `AuthContext.jsx:89`). Set by hand in Firestore console —
  couples **cannot** self-promote because the rules block role changes.
- Couples: email-link (`signInWithEmailLink`) only. No password. Sign-in is
  triggered either by the admin pressing "Send Email" on the reminder panel,
  or by the couple entering their email on `/` (Landing).
- **Linking new sign-ins to weddings** (`AuthContext.jsx:79-161`): checks, in order, `?wedding=<id>` URL param (verified against brideEmail/groomEmail), then email match across all weddings, then creates a blank wedding as a fallback.

## Firestore security rules

Rules live in `firestore.rules`. Model:

- `users/{uid}`: self read/write only; admin can read any. `role` is
  protected — creates must be non-admin, updates can't change it.
- `weddings/{id}`: readable by owners, admins, or email-matched couples
  (the last one enables the "claim" flow in `AuthContext.linkUserToWedding`).
  Owners can edit `formData` and benign meta but **not** `meta.ownerUids`,
  `meta.brideEmail`, or `meta.groomEmail` — admin-controlled to prevent
  takeover. Email-matched couples can only add themselves to `ownerUids`.
- `weddings/{id}/auditLog`: append-only. Create-only; no updates or deletes.
  `editedBy` must equal `request.auth.uid`, so no forging entries under
  someone else's name.

**Promoting a user to admin** (manual, until we build admin UI):
1. Firebase Console → Firestore → `users/{uid}` → set `role: 'admin'`.
2. No Cloud Function required; the rules read this field on every request.

**Deploying rule changes**: `npx firebase deploy --only firestore:rules`
(needs `.firebaserc` pointed at the real project and `firebase login`).
Test first in the Firebase Console → Firestore → Rules Playground.

## Known sharp edges

- **`.firebaserc` is placeholder** (`"default": "YOUR_PROJECT_ID_HERE"`) — real project ID lives only in `.env`/CI secrets. `firebase deploy` will fail until this is set.
- **Email case sensitivity**: rules compare `resource.data.meta.brideEmail == request.auth.token.email` literal. `CreateWedding.jsx` lowercases stored emails, and Firebase normalizes auth tokens for email-link/Google — but email+password admins with a mixed-case email could slip through the cracks. If claim flow misbehaves, check casing.
- **No real-time sync**: admin views reload manually after writes (`loadWedding`, `loadAuditLog`). No `onSnapshot` anywhere.
- **Bundle size**: main chunk is ~1.2 MB raw / 372 kB gzip (`npm run build` warns). `jspdf` and `firebase` are imported eagerly via `App.jsx → Phase6Review → utils/generatePDF.js`. Candidates for `React.lazy`: all of `/admin/*`, `Phase6Review`, and `generatePDF`.
- **Couple-side edits are silent** — no audit trail. Only admin edits log to `auditLog`. Wiring this up is the obvious next slice.
- **StrictMode is on** (`main.jsx:11`); effects double-fire in dev. Magic-link handler already guards with `magicLinkHandled.current` ref.
- **Two persistent lint warnings** (`npm run lint`): `FormDataContext.jsx:38` calls `setState` inside an effect body, and `ToastContext.jsx:64` mixes hooks with component exports. Both need real refactors, not quick fixes.

## Dev commands

```bash
npm install
npm run dev               # Vite dev server
npm run build             # production build to dist/
npm run preview           # serve dist/
npm run lint              # eslint
npm run deploy:firebase   # build + firebase deploy (needs firebase login)
```

For local Firebase work without polluting prod, set
`VITE_USE_FIREBASE_EMULATORS=true` and run `firebase emulators:start`.

## Conventions

- **Colors**: `stone-*` for neutrals, `gold-*` for accent (defined in `index.css:4-16`), `emerald-*` for success, `amber-*` for warnings.
- **Forms**: use the wrappers in `src/components/common/` (`Input`, `Select`, `TextArea`, `Button`).
- **State updates**: always `setFormData(prev => ({...prev, ...}))` — never read current `formData` inside a handler and mutate from that snapshot (there's a documented bug history here — see commits `55808d6`, `feb689a`).
- **Array edits in forms**: compute new array with `.map/.filter`, pass to `updateField`. Don't mutate.
- **Dates**: stored as ISO `YYYY-MM-DD` strings, rendered by appending `T00:00:00` to force local-time interpretation.

## When making changes

- Phase edits: touch the phase component + `progress.js` if the completion
  criteria change + demoData if a new option list is needed.
- Admin read-only → editable for a new field: add the path to `EDITABLE_PATHS`
  at `WeddingDetail.jsx:30`, then render an `EditableField` in the right `PhaseSection`.
- New audit action: write one `addDoc(collection(db, 'weddings', id, 'auditLog'), {...})` with a new `action` string, then teach `AuditEntryRow` (`WeddingDetail.jsx:777`) how to render it.
- Anything that writes Firestore: expect the current dev-mode rules to accept
  it; production rules will not. Test against rules early.

## Branch policy (web sessions)

Web sessions in this repo develop on `claude/build-cue-onboarding-app-*` branches.
Don't push to `main` directly; don't open PRs unless explicitly asked.
