# Cue Wedding DJ Planning Platform — Architecture & Documentation

> **Status**: Prototype (scaling for production rollout)
> **Live Demo**: https://sanjmanak.github.io/cueWedding
> **Stack**: React 19 + Vite + Tailwind CSS v4 + jsPDF

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Application Flow](#application-flow)
3. [Project Structure](#project-structure)
4. [State Management](#state-management)
5. [Data Model](#data-model)
6. [Phase-by-Phase Breakdown](#phase-by-phase-breakdown)
7. [Key Components](#key-components)
8. [Design Decisions](#design-decisions)
9. [Third-Party Dependencies](#third-party-dependencies)
10. [Known Limitations & Future Work](#known-limitations--future-work)

---

## What This App Does

Cue is a **wedding DJ planning platform** designed specifically for **South Asian (Desi) weddings**. It guides couples through a 6-phase workflow to capture everything a DJ needs to deliver a perfect multi-event wedding celebration.

The core idea: instead of back-and-forth emails and spreadsheets, couples fill out an interactive questionnaire that covers their story, people, music, program timeline, production details, and final sign-off. The output is a comprehensive "run sheet" PDF that the DJ team uses to plan and execute the events.

**Target users**:
- Couples planning their wedding (primary)
- DJ companies onboarding new clients (admin-side, future)

**Business context**: This is a prototype for a $5M/year wedding DJ company. The admin (DJ company) will send a magic link invite to each couple. By the time the couple opens the app, basic configuration (genders, event types, etc.) may already be pre-set.

---

## Application Flow

```
Landing Page (Magic Link Auth Simulation)
    │
    ▼
Phase 1: Your Story ──────────── 7 steps
    │  Couple names, date, how they met, events, venues + dates, guest counts, vibe
    │
Phase 2: Your People ─────────── 7 steps
    │  Parents, siblings, wedding party, relatives, VIPs, pronunciations, announcements
    │
Phase 3: Your Soundtrack ──────── 6 steps
    │  Must-play songs, do-not-play, vibe per event, special moments, custom mixes, playlists
    │
Phase 4: Your Program ────────── 6 steps
    │  Event templates, timeline builder (with start time), performances, speeches, ceremony, review
    │
Phase 5: Final Details ────────── 4 steps
    │  Vendor contacts, production/equipment, surprises, additional notes
    │
Phase 6: Review & Sign-off ────── 3 steps
       Summary dashboard, confirmation checkbox + signature, PDF download + confetti
```

Users can navigate freely between phases and steps. Progress is tracked per-phase and shown in the header. All data persists in localStorage.

---

## Project Structure

```
src/
├── main.jsx                          # App entry point, providers, HashRouter
├── App.jsx                           # Route definitions for all phases
├── index.css                         # Global styles (Tailwind base)
│
├── components/
│   ├── Landing.jsx                   # Login/welcome screen with magic link simulation
│   ├── common/
│   │   ├── Button.jsx                # Styled button with variants (primary, gold, outline)
│   │   ├── Input.jsx                 # Form input with auto-validation (email, phone)
│   │   ├── Select.jsx                # Styled select dropdown
│   │   ├── TextArea.jsx              # Styled textarea
│   │   ├── Card.jsx                  # Card container with optional selected state
│   │   ├── PhaseWrapper.jsx          # Phase shell: step nav, back/forward, progress
│   │   └── ProgressBar.jsx           # Animated progress bar
│   ├── features/
│   │   └── MusicSearch.jsx           # iTunes Search API integration with audio preview
│   ├── layout/
│   │   ├── Header.jsx                # Top nav with phase indicators + Save & Exit
│   │   └── Footer.jsx                # Reset buttons (clear all / restore demo)
│   └── phases/
│       ├── Phase1Story.jsx           # Couple info, events, venues, dates, vibe
│       ├── Phase2People.jsx          # Family, wedding party, VIPs, pronunciations
│       ├── Phase3Soundtrack.jsx      # Music preferences, special moments
│       ├── Phase4Program.jsx         # Timeline builder, performances, speeches
│       ├── Phase5Details.jsx         # Vendors, equipment, production
│       └── Phase6Review.jsx          # Summary dashboard, sign-off, PDF export
│
├── context/
│   ├── FormDataContext.jsx           # Global form state (Context + useLocalStorage)
│   └── ToastContext.jsx              # Toast notification system
│
├── hooks/
│   ├── useLocalStorage.js            # Generic localStorage persistence hook
│   ├── useProgress.js                # Per-phase completion percentage calculator
│   └── useMusic.js                   # iTunes API search with debounce + audio preview
│
├── data/
│   └── demoData.js                   # Constants, options, default demo data, blank template
│
└── utils/
    └── generatePDF.js                # jsPDF-based run sheet generator (multi-page)
```

---

## State Management

### Architecture: React Context + localStorage

All form data lives in a single object managed by `FormDataContext`, backed by `useLocalStorage` for persistence.

```
FormDataProvider (wraps entire app)
  └── useLocalStorage('cue-wedding-data', defaultDemoData)
      ├── formData          → Current state object
      ├── setFormData(fn)   → Bulk update (spread pattern)
      ├── updateField(k,v)  → Top-level field update
      ├── updateNestedField(parent,k,v) → Nested object update
      ├── resetToDemo()     → Restore pre-filled demo data
      ├── resetToBlank()    → Clear everything to empty slate
      └── clearAll()        → Remove localStorage entry entirely
```

### Key Patterns

**Direct field update:**
```js
updateField('brideName', 'Alexsa');
```

**Nested field update (objects within objects):**
```js
updateNestedField('eventVenues', 'sangeet', { name: 'Crystal Ballroom', ... });
```

**Bulk state update (multiple fields at once):**
```js
setFormData(prev => ({ ...prev, howMet: 'dating-app', datingApp: '' }));
```

**Array management (add/remove/update items in lists):**
```js
updateField('siblings', [...prev, newSibling]);          // Add
updateField('siblings', prev.filter(s => s.id !== id));   // Remove
```

### Reset Behavior

Two reset options in the footer:
- **"Reset All Data"** → Clears everything to a completely blank state (`blankFormData`). No events, no names, no selections. Fresh start.
- **"Restore Demo Data"** → Restores the pre-filled demo dataset showing Alexsa & Kishan's wedding.

---

## Data Model

The complete form data object structure:

```js
{
  // ── Phase 1: Your Story ──
  brideName: string,
  brideLastName: string,
  groomName: string,
  groomLastName: string,
  firstEventDate: string,         // ISO date 'YYYY-MM-DD'
  howMet: string,                 // ID from howMetOptions
  datingApp: string,              // If howMet === 'dating-app'
  howMetDetail: string,           // If howMet is text-based
  meetDetail: string,             // Optional fun detail
  selectedEvents: string[],       // Array of event IDs: ['sangeet', 'reception', ...]
  eventVenues: {                  // Keyed by event ID
    [eventId]: {
      name: string,
      address: string,
      setting: 'indoor' | 'outdoor' | 'both',
      linkedTo?: string,          // References another event's venue
    }
  },
  eventDates: {                   // Per-event date
    [eventId]: string             // ISO date 'YYYY-MM-DD'
  },
  eventGuestCounts: {
    [eventId]: '<100' | '100-200' | '200-300' | '300-400' | '400+'
  },
  vibeWords: string[],            // Max 3 selections
  bollywoodEra: string,
  westernMusic: string,

  // ── Phase 2: Your People ──
  brideParents: { father: string, mother: string },
  groomParents: { father: string, mother: string },
  siblings: [{ id, name, role, side, pronunciation }],
  keyRelatives: [{ id, name, role, side, pronunciation }],
  otherVIPs: [{ id, name, role, side, pronunciation }],
  pronunciations: { [name]: string },       // Phonetic guides
  announcementStyles: { [name]: string },   // 'formal' | 'first' | custom

  // ── Phase 3: Your Soundtrack ──
  mustPlaySongs: [{ id, trackId, name, artist, albumArt, event }],
  doNotPlaySongs: [{ id, trackId, name, artist, albumArt }],
  eventVibes: { [eventId]: string },        // Mood selection per event
  specialMoments: {
    firstDance: { type, name?, artist?, trackId? },
    fatherDaughter: { ... },
    motherSon: { ... },
    coupleEntrance: { ... },
    lastSong: { ... },
  },
  customMixes: [{ id, description }],
  playlistUrl: string,

  // ── Phase 4: Your Program ──
  eventTemplates: { [eventId]: string },    // Template ID
  eventStartTimes: { [eventId]: string },   // 24h format 'HH:MM'
  timelines: {
    [eventId]: [{
      id: string,
      type: 'performance' | 'speech' | 'tradition' | 'cocktail' | 'dance-set' | 'dinner' | 'break' | 'other',
      label: string,
      duration: number,           // Minutes
      details: string,
      performerName?: string,     // Performance blocks
      songName?: string,
      speaker?: string,           // Speech blocks
      relationship?: string,
    }]
  },
  performances: [],
  speeches: [],
  ceremonyTraditions: string[],   // IDs: ['baraat', 'pheras', ...]
  ceremonySongs: { [traditionId]: { name, artist } },

  // ── Phase 5: Final Details ──
  vendors: {
    planner: { name, phone, email },
    photographer: { name, phone, email },
    videographer: { name, phone, email },
    decorator: { name, phone, email },
  },
  lightingColor: string,          // Hex color
  equipment: string[],            // Selected equipment items
  photoBooth: boolean,
  surprises: string,
  additionalNotes: string,

  // ── Phase 6: Sign-off ──
  confirmed: boolean,
  signatureName: string,
  signatureDate: string,          // ISO date
}
```

---

## Phase-by-Phase Breakdown

### Phase 1: Your Story (7 steps)

| Step | What it captures | Key UX |
|------|------------------|--------|
| The Couple | Bride/groom names, first event date | Side-by-side name inputs |
| How You Met | Love story origin (dating app, friends, etc.) | Conditional follow-ups based on selection |
| Your Events | Which events (haldi, mehndi, sangeet, etc.) | Toggle grid with emoji buttons |
| Venue & Date Details | Per-event venue + date | Cascading venue linking, date picker per event |
| Guest Counts | Expected attendance per event | Button buckets: <100, 100-200, 200-300, 300-400, 400+ |
| Vibe Check | 3 vibe words, Bollywood era, western music level | Pill buttons with max-3 selection |
| Phase 1 Complete | Summary card | Review all Phase 1 data |

**Design choices:**
- Venues support "Same as [previous event]" linking to reduce repetitive entry
- The header text "Where and when is each event happening?" combines venue + date entry
- Date is collected per-event (not just a single wedding date) because Desi weddings span multiple days

### Phase 2: Your People (7 steps)

| Step | What it captures |
|------|------------------|
| Family | Bride's parents, groom's parents |
| Siblings & Party | Siblings, maid of honor, best man, etc. |
| Key Relatives | Grandparents, aunts, uncles |
| VIPs | MC, special guests |
| Pronunciations | Phonetic guides for difficult names |
| Announcement Style | How each person should be announced (formal vs. first name) |
| Summary | Stats by side (bride/groom) |

**Design choices:**
- Pronunciation guides are critical for Desi weddings — names like "Arjun" need guidance ("AR-jun")
- Announcement styles let the DJ know: "Mr. and Mrs. Vikram Shah" vs. just "Vikram and Anita"

### Phase 3: Your Soundtrack (6 steps)

| Step | What it captures |
|------|------------------|
| Must-Play Songs | Songs that absolutely must be played (up to 20) |
| Do-Not-Play Songs | Banned songs |
| Vibe by Event | Mood/energy selection per event |
| Special Moments | First dance, father-daughter, mother-son, entrance, last song |
| Custom Mixes | Mashup/remix requests |
| Playlist Import | Spotify/Apple Music/YouTube playlist link |

**Design choices:**
- Uses **iTunes Search API** for real-time song lookup with album art and 30-second audio previews
- Must-play songs are tied to specific events (e.g., "play this at the sangeet")
- Special moments support multiple response types: specific song, DJ choice, surprise, or skip

### Phase 4: Your Program (6 steps)

| Step | What it captures |
|------|------------------|
| Event Templates | Starting template per event (traditional, modern, scratch) |
| Timeline Builder | Drag-to-reorder blocks with start time and durations |
| Performances | Performer names, songs, durations for each performance block |
| Speeches | Speaker names, relationships, durations |
| Ceremony Details | Hindu ceremony traditions with optional song assignments |
| Key Moments Review | Full timeline view with estimated timestamps |

**Design choices:**
- **Start Time**: Each event can have a `+Start Time` (added once). This is a single time picker (e.g., 7:00 PM)
- **Timeline blocks**: 8 types — Performance, Speech, Tradition, Cocktail, Dance Set, Dinner, Break, Other
- **Estimated timestamps**: When start time is set, the review shows real clock times instead of offsets. Every 4 items, a milestone badge appears (e.g., "Estimated ~8-8:30 PM") so couples can see roughly when each segment happens
- Blocks are reorderable with up/down arrows, editable inline for label and duration

### Phase 5: Final Details (4 steps)

| Step | What it captures |
|------|------------------|
| Vendor Contacts | Planner, photographer, videographer, decorator — name, phone, email |
| Production Preferences | Lighting color (color picker), equipment checklist, photo booth |
| Surprises | Free-text for creative ideas and special requests |
| Additional Notes | Catch-all for anything else |

**Design choices:**
- Vendor contact cards expand on click (collapsed by default, show "Added" badge when filled)
- Phone and email fields have client-side validation (format checks on blur)

### Phase 6: Review & Sign-off (3 steps)

| Step | What it captures |
|------|------------------|
| Summary Dashboard | Per-phase progress cards with expand/collapse and edit links |
| Final Review | Confirmation checkbox + typed signature |
| Confirmation | Confetti celebration + PDF download |

**Design choices:**
- Progress percentage is calculated per-phase and shown in the dashboard
- Confirmation requires explicit checkbox before proceeding
- PDF run sheet is generated client-side using jsPDF — no server needed

---

## Key Components

### PhaseWrapper
Reusable shell that wraps every phase. Handles:
- Step indicator (1 of 7, 2 of 7, etc.)
- Back/Next navigation within steps
- Phase-to-phase navigation
- Completion state for the final step

### MusicSearch
Real-time search against the iTunes API:
- 300ms debounce, minimum 2 characters
- Returns top 10 results with album art, artist, track name
- 30-second audio preview with play/pause toggle
- Used in Phase 3 (must-play, do-not-play) and Phase 4 (ceremony songs)

### Input (Common)
Enhanced input component with built-in validation:
- **Email**: Validates format on blur (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Phone**: Validates format on blur (`/^[\d\s()+-]{7,}$/`)
- Shows red error state with message when invalid
- Validation can be disabled with `validate={false}`

### Toast System
Non-blocking notification system:
- Types: success (green), error (red), info (gray), warning (gold)
- Auto-dismiss with configurable duration
- Fixed position top-right with smooth fade animations

---

## Design Decisions

### Why localStorage (not a database)?
This is a prototype. localStorage provides:
- Zero infrastructure cost
- Instant persistence across page refreshes
- No auth needed for demo
- Easy migration path: swap `useLocalStorage` for a Firestore/API hook later

### Why HashRouter?
Deployed to GitHub Pages, which doesn't support server-side routing for SPAs. HashRouter (`/#/phase/1`) works without server configuration.

### Why iTunes API (not Spotify)?
- No API key required
- No user authentication needed
- Includes 30-second audio previews
- Album artwork included
- Works for both Bollywood and Western music

### Why jsPDF (client-side PDF)?
- No server needed for PDF generation
- Instant download, no upload/processing wait
- All data is already on the client
- Trade-off: less visual control than server-rendered PDFs, but sufficient for a run sheet

### Why Tailwind CSS v4?
- Rapid prototyping with utility classes
- Consistent design system (stone, gold color palette)
- No separate CSS files to manage
- Easy responsive design (sm: breakpoints)

### Guest Count Buckets
Buckets are: `<100`, `100-200`, `200-300`, `300-400`, `400+`. These reflect typical Desi wedding sizes and are cleaner ranges that help the DJ team plan equipment, setup, and staffing.

---

## Third-Party Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| react | UI framework | 19.2.0 |
| react-router-dom | Client-side routing | 7.13.0 |
| jspdf | Client-side PDF generation | ^3.0 |
| canvas-confetti | Celebration effect on sign-off | ^1.9 |
| tailwindcss | Utility-first CSS | 4.2.0 |
| vite | Build tool + dev server | 7.3.1 |

---

## Firebase Backend

### Authentication
- **Firebase Auth** with email magic link and Google sign-in
- Email link: couple receives sign-in link via email, clicks to authenticate
- Google: one-click sign-in via popup
- Sessions persist across browser restarts
- When Firebase is not configured (no `.env`), falls back to demo mode with localStorage

### Firestore Data Model
```
users/{uid}
  email: string
  phone: string
  role: 'couple' | 'admin'
  weddingId: string
  displayName: string
  createdAt: Timestamp
  lastLoginAt: Timestamp

weddings/{weddingId}
  formData: { ...all form fields from blankFormData... }
  meta:
    ownerUids: string[]
    brideEmail: string
    groomEmail: string
    createdAt: Timestamp
    updatedAt: Timestamp
    status: 'active' | 'completed' | 'archived'
```

### Data Persistence
- **Firestore mode** (Firebase configured): Data loaded once via `getDoc`, then debounced writes (1.5s) via `setDoc` with merge. Offline persistence enabled via `persistentLocalCache`.
- **localStorage mode** (Firebase not configured): Original behavior, demo data pre-loaded.
- The `FormDataProvider` automatically selects the right mode.

### Firebase Hosting
- Deployed to Firebase Hosting (replaces GitHub Pages for production)
- SPA rewrite rules in `firebase.json`
- BrowserRouter (no more HashRouter)
- Deploy: `npm run deploy:firebase`

---

## Admin Dashboard

### Access Control
- Admin users have `role: 'admin'` in their Firestore user document
- To make a user an admin: set their `role` field to `'admin'` in Firebase Console > Firestore > users collection
- Admin routes at `/admin/*` are protected by role check in `AdminLayout`
- Non-admin users see an "Access Denied" page

### Admin Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | AdminDashboard | Stats cards + wedding list table |
| `/admin/weddings/new` | CreateWedding | Create wedding + send invitations |
| `/admin/weddings/:id` | WeddingDetail | Read-only view of couple's full data |

### Admin Features (B0 — Current)
- **Dashboard**: View all weddings with progress %, status badges, event dates
- **Quick Stats**: Total weddings, in-progress, completed, needs attention
- **Create Wedding**: Enter couple names/emails, auto-creates Firestore documents, generates invite link, sends magic link emails
- **View Wedding**: Expandable read-only view of all 6 phases, progress per phase, PDF download

### Admin Features (B1 — Planned)
- Edit couple's data with audit trail
- Send reminder nudges
- Archive completed weddings
- Team roles (lead DJ, MC, coordinator)
- Filters and search

---

## Known Limitations & Current State

### Completed
- Real authentication (email magic link + Google sign-in)
- Firestore cloud persistence (cross-device, cross-browser)
- Admin dashboard with wedding management
- Protected routes for both couple and admin flows
- Firebase Hosting deployment

### Remaining Limitations
- **No multi-user editing** — both partners can't collaborate simultaneously (real-time sync not yet implemented)
- **No audit trail** — changes are not logged with who/when
- **No SMS notifications** — requires Twilio + Cloud Functions (Blaze plan)
- **No song deduplication** — same song can be added to must-play and do-not-play
- **PDF is basic** — functional but not visually polished
- **No email matching on sign-in** — couples must be given direct links; email-based auto-linking not yet implemented

### Production Roadmap
- **Real-time Sync**: Both partners edit simultaneously (Firestore onSnapshot)
- **Audit Trail**: Per-wedding change log (Firestore subcollection)
- **SMS Notifications**: Welcome texts, reminders (Twilio + Cloud Functions)
- **Gender Configuration**: Admin pre-sets partner terminology
- **Enhanced PDF**: Server-rendered with professional styling
- **Analytics**: Completion rates, drop-off points, popular song choices
