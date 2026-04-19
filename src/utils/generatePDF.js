import jsPDF from 'jspdf';
import { eventOptions, ceremonyTraditions } from '../data/demoData';

const GOLD = [217, 119, 6];
const DARK = [41, 37, 36];
const GRAY = [120, 113, 108];
const LIGHT = [245, 245, 244];

// Strip emojis and other non-printable characters that jsPDF can't render
const clean = (str) => str ? str.replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{Sc}]/gu, '').trim() : '';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Wrap any VIP name in `text` with its pronunciation: "Raj Patel" -> "Raj Patel (RAH-j)".
// Skips names already followed by an open paren to avoid double-wrapping.
const inlinePronunciations = (text, data) => {
  if (!text) return text;
  const prons = data?.pronunciations || {};
  let out = String(text);
  // Longest names first so "Raj Patel" matches before "Raj".
  const entries = Object.entries(prons)
    .filter(([name, pron]) => name && pron)
    .sort((a, b) => b[0].length - a[0].length);
  entries.forEach(([name, pron]) => {
    const re = new RegExp(`${escapeRegex(name)}(?!\\s*\\()`, 'g');
    out = out.replace(re, `${name} (${pron})`);
  });
  return out;
};

// Resolve a song for a timeline block. Performance blocks store songName/performerName
// directly; tradition blocks are matched against specialMoments by label keywords.
const resolveBlockSong = (block, data) => {
  if (!block) return null;
  if (block.type === 'performance' && (block.songName || block.performerName)) {
    return { name: block.songName || '', artist: block.performerName || '' };
  }
  if (block.type === 'tradition') {
    const label = (block.label || '').toLowerCase();
    const sm = data?.specialMoments || {};
    const matchers = [
      ['firstDance', ['first dance']],
      ['fatherDaughter', ['father-daughter', 'father daughter']],
      ['motherSon', ['mother-son', 'mother son']],
      ['coupleEntrance', ['grand entrance', 'couple entrance', 'entrance']],
      ['lastSong', ['last song', 'last dance']],
    ];
    for (const [key, keys] of matchers) {
      if (keys.some((k) => label.includes(k)) && sm[key]?.type === 'song') {
        return { name: sm[key].name || '', artist: sm[key].artist || '' };
      }
    }
  }
  return null;
};

// Downscale images before embedding. The source logo is 3342x1533 at 373KB on
// disk, but Canvas.toDataURL('image/png') re-encodes unoptimized, then base64
// adds 33% — resulting in ~20MB embedded. Capping to 480px keeps the print
// looking crisp at 40mm while cutting file size by ~300x.
function loadImage(url, maxEdge = 480) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: w, height: h });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateRunSheet(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  const checkPage = (needed = 20) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Splits "1. Couple Profile" into { num: "01", title: "Couple Profile" }.
  // Untouched ("Ceremony") returns { num: null, title: "Ceremony" }.
  const splitHeading = (text) => {
    const match = text.match(/^(\d+)\.\s*(.+)$/);
    if (!match) return { num: null, title: text };
    return { num: String(match[1]).padStart(2, '0'), title: match[2] };
  };

  const heading = (text, size = 16) => {
    const { num, title } = splitHeading(text);
    // A 16pt bold cap is ~4mm tall, so the title baseline needs to sit well
    // below the eyebrow — 4mm was too tight and produced visible overlap.
    const eyebrowGap = 8;
    const titleCapHeight = size * 0.28;
    checkPage((num ? eyebrowGap : 0) + titleCapHeight + 12);
    if (num) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GOLD);
      doc.text(`SECTION ${num}`, margin, y, { charSpace: 0.8 });
      y += eyebrowGap;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...DARK);
    doc.text(clean(title), margin, y);
    y += size * 0.5 + 2;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  const subheading = (text) => {
    checkPage(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(clean(text), margin, y);
    y += 6;
  };

  const bodyText = (text, indent = 0) => {
    checkPage(8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(clean(text), pageW - margin * 2 - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5;
  };

  // Fixed label column (right-aligned) + wrapping value column. This avoids
  // long labels like "Bollywood Era" colliding with their value.
  const LABEL_COL_WIDTH = 32;
  const labelValue = (label, value, indent = 0) => {
    const labelRight = margin + indent + LABEL_COL_WIDTH;
    const valueX = labelRight + 4;
    const valueMaxWidth = pageW - margin - valueX;
    const valueStr = String(clean(value) || '—');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(valueStr, valueMaxWidth);
    const blockH = Math.max(6, lines.length * 5 + 1);
    checkPage(blockH + 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(clean(label), labelRight, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(lines, valueX, y);
    y += blockH;
  };

  const spacer = (h = 4) => { y += h; };

  // ===== COVER PAGE =====
  doc.setFillColor(...LIGHT);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Logo — preserve source aspect ratio, target ~50mm on the longest edge.
  let logoLoaded = false;
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const logo = await loadImage(baseUrl + 'logo.png');
    if (logo?.dataUrl) {
      const targetLongEdge = 50; // mm
      const ratio = logo.width / logo.height;
      const w = ratio >= 1 ? targetLongEdge : targetLongEdge * ratio;
      const h = ratio >= 1 ? targetLongEdge / ratio : targetLongEdge;
      doc.addImage(logo.dataUrl, 'PNG', (pageW - w) / 2, 25, w, h);
      logoLoaded = true;
    }
  } catch {
    // Logo failed to load, use text fallback
  }

  if (!logoLoaded) {
    doc.setFontSize(12);
    doc.setTextColor(...GRAY);
    doc.text('Special Occasions DJ - Lighting - Technology', pageW / 2, 40, { align: 'center' });
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...DARK);
  doc.text('Wedding Run Sheet', pageW / 2, logoLoaded ? 80 : 80, { align: 'center' });

  // Couple names
  doc.setFontSize(24);
  doc.setTextColor(...GOLD);
  doc.text(`${data.brideName || ''} & ${data.groomName || ''}`, pageW / 2, 100, { align: 'center' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...GRAY);
  const dateStr = data.firstEventDate ? new Date(data.firstEventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD';
  doc.text(dateStr, pageW / 2, 115, { align: 'center' });

  // Generated date
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW / 2, pageH - 20, { align: 'center' });

  // ===== DJ CUE CARD =====
  // Single-page condensed flowchart grouped by event day. Tape to the booth.
  doc.addPage();
  y = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text('DJ Cue Card', margin, y);
  y += 5;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    `${clean(data.brideName || '')} & ${clean(data.groomName || '')}  -  ${clean(dateStr)}`,
    margin,
    y,
  );
  y += 5;

  const selectedEventIds = data.selectedEvents || [];
  if (selectedEventIds.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('— no events selected —', margin, y);
    y += 5;
  } else {
    // Group events by date; undated events fall under "Date TBD".
    const eventsByDate = {};
    selectedEventIds.forEach((eventId) => {
      const d = data.eventDates?.[eventId] || '';
      if (!eventsByDate[d]) eventsByDate[d] = [];
      eventsByDate[d].push(eventId);
    });
    const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b);
    });

    const CUE_LINE = 3.6;
    const CUE_FONT = 8;

    sortedDates.forEach((date) => {
      const dayLabel = date
        ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          })
        : 'Date TBD';
      checkPage(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...GOLD);
      doc.text(clean(dayLabel), margin, y);
      y += CUE_LINE + 1.5;

      eventsByDate[date].forEach((eventId) => {
        const event = eventOptions.find((e) => e.id === eventId);
        const blocks = data.timelines?.[eventId] || [];
        checkPage(6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(CUE_FONT + 1);
        doc.setTextColor(...DARK);
        doc.text(clean(event?.label || eventId), margin + 2, y);
        y += CUE_LINE + 0.5;

        if (blocks.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(CUE_FONT);
          doc.setTextColor(...GRAY);
          doc.text('—', margin + 6, y);
          y += CUE_LINE;
        } else {
          let cumMin = 0;
          blocks.forEach((block) => {
            const parts = [`+${cumMin}min`, block.label || '—'];
            const song = resolveBlockSong(block, data);
            if (song && (song.name || song.artist)) {
              parts.push(`${song.name || 'TBD'}${song.artist ? ` (${song.artist})` : ''}`);
            } else if (block.type === 'speech' && block.speaker) {
              parts.push(block.speaker);
            }
            const line = inlinePronunciations(parts.join('  ·  '), data);
            checkPage(5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(CUE_FONT);
            doc.setTextColor(...DARK);
            const lines = doc.splitTextToSize(clean(line), pageW - margin * 2 - 6);
            doc.text(lines, margin + 6, y);
            y += CUE_LINE * lines.length;
            cumMin += block.duration || 0;
          });
        }
        y += 1;
      });
    });
  }

  // ===== SECTION 1: COUPLE PROFILE =====
  doc.addPage();
  y = margin;
  heading('1. Couple Profile');

  labelValue('Bride', data.brideName);
  labelValue('Groom', data.groomName);
  labelValue('Wedding Date', dateStr);
  labelValue('How They Met', data.howMet || '—');
  if (data.howMet === 'Dating App') labelValue('Dating App', data.datingApp);
  if (data.meetDetail) {
    spacer();
    subheading('Their Story');
    bodyText(data.meetDetail);
  }
  spacer();
  labelValue('Vibe', (data.vibeWords || []).join(', '));
  labelValue('Bollywood Era', data.bollywoodEra);
  labelValue('Western Music', data.westernMusic);

  // ===== SECTION 2: EVENT OVERVIEW =====
  spacer(8);
  heading('2. Event Overview');

  (data.selectedEvents || []).forEach((eventId) => {
    const event = eventOptions.find((e) => e.id === eventId);
    const venue = data.eventVenues?.[eventId] || {};
    const guests = data.eventGuestCounts?.[eventId] || '—';
    const vibe = data.eventVibes?.[eventId] || '—';
    checkPage(30);
    subheading(event?.label || eventId);
    labelValue('Venue', venue.name, 4);
    labelValue('Address', venue.address, 4);
    labelValue('Setting', venue.setting, 4);
    labelValue('Guests', guests, 4);
    labelValue('Mood', vibe, 4);
    spacer();
  });

  // ===== SECTION 3: VIP LIST =====
  doc.addPage();
  y = margin;
  heading('3. VIP List');

  const allPeople = [];
  if (data.brideParents?.father) allPeople.push({ name: data.brideParents.father, role: "Bride's Father", pronunciation: data.pronunciations?.[data.brideParents.father] || '', style: data.announcementStyles?.[data.brideParents.father] || 'formal' });
  if (data.brideParents?.mother) allPeople.push({ name: data.brideParents.mother, role: "Bride's Mother", pronunciation: data.pronunciations?.[data.brideParents.mother] || '', style: data.announcementStyles?.[data.brideParents.mother] || 'formal' });
  if (data.groomParents?.father) allPeople.push({ name: data.groomParents.father, role: "Groom's Father", pronunciation: data.pronunciations?.[data.groomParents.father] || '', style: data.announcementStyles?.[data.groomParents.father] || 'formal' });
  if (data.groomParents?.mother) allPeople.push({ name: data.groomParents.mother, role: "Groom's Mother", pronunciation: data.pronunciations?.[data.groomParents.mother] || '', style: data.announcementStyles?.[data.groomParents.mother] || 'formal' });
  [...(data.siblings || []), ...(data.keyRelatives || []), ...(data.otherVIPs || [])].forEach((p) => {
    if (p.name) allPeople.push({ name: p.name, role: p.role, pronunciation: data.pronunciations?.[p.name] || '', style: data.announcementStyles?.[p.name] || 'first' });
  });

  // Table header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const cols = [margin, margin + 45, margin + 80, margin + 115];
  doc.text('Name', cols[0], y);
  doc.text('Role', cols[1], y);
  doc.text('Pronunciation', cols[2], y);
  doc.text('Announce', cols[3], y);
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  allPeople.forEach((person) => {
    checkPage(8);
    doc.text(clean(person.name), cols[0], y);
    doc.text(clean(person.role || ''), cols[1], y);
    doc.text(clean(person.pronunciation || ''), cols[2], y);
    doc.text(clean(person.style || ''), cols[3], y);
    y += 5;
  });

  // ===== SECTION 4: MUSIC =====
  spacer(8);
  heading('4. Music');

  subheading('Must-Play Songs');
  (data.mustPlaySongs || []).forEach((song) => {
    checkPage(8);
    const eventLabel = eventOptions.find((e) => e.id === song.event)?.label || '';
    bodyText(`- ${song.name} — ${song.artist}${eventLabel ? ` [${eventLabel}]` : ''}`, 4);
  });

  spacer();
  subheading('Do-Not-Play Songs');
  (data.doNotPlaySongs || []).forEach((song) => {
    checkPage(8);
    bodyText(`- ${song.name} — ${song.artist}`, 4);
  });

  spacer();
  subheading('Special Moments');
  const momentLabels = { firstDance: 'First Dance', fatherDaughter: 'Father-Daughter', motherSon: 'Mother-Son', coupleEntrance: 'Couple Entrance', lastSong: 'Last Song' };
  Object.entries(data.specialMoments || {}).forEach(([key, val]) => {
    if (!val?.type) return;
    checkPage(8);
    const label = momentLabels[key] || key;
    if (val.type === 'song') {
      bodyText(`${label}: ${val.name || 'TBD'} — ${val.artist || ''}`, 4);
    } else {
      bodyText(`${label}: ${val.type.replace('-', ' ')}`, 4);
    }
  });

  // ===== CEREMONY =====
  // Lives between couple profile and the timeline; previously missing from PDF entirely.
  doc.addPage();
  y = margin;
  heading('Ceremony');

  const selectedTraditionIds = data.ceremonyTraditions || [];
  const ceremonySongs = data.ceremonySongs || {};
  if (selectedTraditionIds.length === 0) {
    bodyText('—');
  } else {
    const canonicalOrder = ceremonyTraditions.map((t) => t.id);
    const orderedTraditions = [...selectedTraditionIds].sort((a, b) => {
      const ai = canonicalOrder.indexOf(a);
      const bi = canonicalOrder.indexOf(b);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    orderedTraditions.forEach((tradId) => {
      const tradition = ceremonyTraditions.find((t) => t.id === tradId);
      const label = tradition?.label || tradId;
      const song = ceremonySongs[tradId];
      checkPage(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text(clean(label), margin + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      const songText = song?.name
        ? `${song.name}${song.artist ? ` — ${song.artist}` : ''}`
        : '— song TBD —';
      doc.text(clean(inlinePronunciations(songText, data)), margin + 45, y);
      y += 6;
    });
  }

  // ===== SECTION 5: PROGRAM TIMELINE =====
  doc.addPage();
  y = margin;
  heading('5. Program Timeline');

  // Format minutes-since-midnight as "7:05 PM".
  const formatClockTime = (totalMinutes) => {
    const h24 = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  const parseStartTime = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = String(hhmm).split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  // Column layout (mm). Widths tuned for A4 - margin * 2 = 170mm usable.
  const TIME_COL_W = 28;
  const ACTIVITY_COL_W = 72;
  const DURATION_COL_W = 18;
  const ROW_PAD_X = 2;
  const HEADER_ROW_H = 7;
  const ROW_MIN_H = 6.5;
  const ZEBRA_FILL = [250, 248, 244]; // warm off-white so it reads on screen + print
  const BORDER = [220, 217, 211];

  const drawTimelineTable = (blocks, startTimeMinutes) => {
    const tableLeft = margin;
    const tableRight = pageW - margin;
    const tableWidth = tableRight - tableLeft;
    const timeX = tableLeft;
    const activityX = timeX + TIME_COL_W;
    const durationX = activityX + ACTIVITY_COL_W;
    const detailsX = durationX + DURATION_COL_W;
    const detailsW = tableRight - detailsX;

    // Header row
    checkPage(HEADER_ROW_H + ROW_MIN_H + 4);
    doc.setFillColor(...DARK);
    doc.rect(tableLeft, y, tableWidth, HEADER_ROW_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const headerBaseline = y + HEADER_ROW_H - 2.2;
    doc.text('TIME', timeX + ROW_PAD_X, headerBaseline, { charSpace: 0.5 });
    doc.text('ACTIVITY', activityX + ROW_PAD_X, headerBaseline, { charSpace: 0.5 });
    doc.text('DUR', durationX + ROW_PAD_X, headerBaseline, { charSpace: 0.5 });
    doc.text('DETAILS', detailsX + ROW_PAD_X, headerBaseline, { charSpace: 0.5 });
    y += HEADER_ROW_H;

    let cumMin = 0;
    blocks.forEach((block, idx) => {
      const startMin = cumMin;
      const duration = block.duration || 0;
      cumMin += duration;

      // Build details string based on block type.
      let details = '';
      if (block.type === 'performance' && (block.performerName || block.songName)) {
        const performer = inlinePronunciations(block.performerName || '—', data);
        const song = block.songName ? `"${block.songName}"` : '—';
        details = `${performer} - ${song}`;
      } else if (block.type === 'speech' && block.speaker) {
        const speaker = inlinePronunciations(block.speaker, data);
        details = block.relationship ? `${speaker} (${block.relationship})` : speaker;
      }

      const timeLabel = startTimeMinutes !== null
        ? formatClockTime(startTimeMinutes + startMin)
        : `+${startMin}m`;
      const activityLabel = clean(block.label || '—');
      const durationLabel = `${duration}m`;
      const detailsLabel = clean(details);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const activityLines = doc.splitTextToSize(activityLabel, ACTIVITY_COL_W - ROW_PAD_X * 2);
      const detailsLines = detailsLabel
        ? doc.splitTextToSize(detailsLabel, detailsW - ROW_PAD_X * 2)
        : [];
      const contentLines = Math.max(1, activityLines.length, detailsLines.length);
      const rowH = Math.max(ROW_MIN_H, contentLines * 4.2 + 2);

      // Page-break before starting this row; redraw the table header on the
      // new page so the column meanings stay visible.
      if (y + rowH > pageH - margin) {
        doc.addPage();
        y = margin;
        doc.setFillColor(...DARK);
        doc.rect(tableLeft, y, tableWidth, HEADER_ROW_H, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        const hb = y + HEADER_ROW_H - 2.2;
        doc.text('TIME', timeX + ROW_PAD_X, hb, { charSpace: 0.5 });
        doc.text('ACTIVITY', activityX + ROW_PAD_X, hb, { charSpace: 0.5 });
        doc.text('DUR', durationX + ROW_PAD_X, hb, { charSpace: 0.5 });
        doc.text('DETAILS', detailsX + ROW_PAD_X, hb, { charSpace: 0.5 });
        y += HEADER_ROW_H;
      }

      // Zebra row background.
      if (idx % 2 === 0) {
        doc.setFillColor(...ZEBRA_FILL);
        doc.rect(tableLeft, y, tableWidth, rowH, 'F');
      }

      // Cell text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...GOLD);
      doc.text(timeLabel, timeX + ROW_PAD_X, y + 4.6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(activityLines, activityX + ROW_PAD_X, y + 4.6);

      doc.setTextColor(...GRAY);
      doc.text(durationLabel, durationX + ROW_PAD_X, y + 4.6);

      if (detailsLines.length) {
        doc.setTextColor(...DARK);
        doc.text(detailsLines, detailsX + ROW_PAD_X, y + 4.6);
      }

      y += rowH;
    });

    // Bottom border for the table.
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(tableLeft, y, tableRight, y);
  };

  (data.selectedEvents || []).forEach((eventId) => {
    const event = eventOptions.find((e) => e.id === eventId);
    const blocks = data.timelines?.[eventId] || [];
    if (blocks.length === 0) return;
    const startTimeMinutes = parseStartTime(data.eventStartTimes?.[eventId]);

    checkPage(30);

    // Event header with highlighted start time.
    subheading(event?.label || eventId);
    if (startTimeMinutes !== null) {
      // Pull y back up to sit next to the subheading and render a pill.
      const pillY = y - 6;
      const pillLabel = `Starts ${formatClockTime(startTimeMinutes)}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const pillTextW = doc.getTextWidth(pillLabel);
      const pillW = pillTextW + 6;
      const pillH = 5.5;
      const pillX = pageW - margin - pillW;
      doc.setFillColor(...GOLD);
      doc.roundedRect(pillX, pillY - pillH + 1.5, pillW, pillH, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(pillLabel, pillX + 3, pillY - 0.5);
    }
    y += 1;

    drawTimelineTable(blocks, startTimeMinutes);
    spacer(6);
  });

  // Legacy performances (from old data format)
  if (data.performances?.length) {
    spacer();
    subheading('Additional Performances');
    data.performances.forEach((p) => {
      checkPage(8);
      bodyText(`- ${p.groupName}: "${p.songName}" (${p.duration}min)`, 4);
    });
  }

  // Legacy speeches (from old data format)
  if (data.speeches?.length) {
    spacer();
    subheading('Additional Speeches');
    data.speeches.forEach((s) => {
      checkPage(8);
      bodyText(`- ${s.speaker} (${s.relationship}) — after ${s.afterMoment}`, 4);
    });
  }

  // ===== SECTION 6: PRODUCTION =====
  spacer(8);
  heading('6. Production Details');
  labelValue('Lighting Color', data.lightingColor);
  labelValue('Equipment', (data.equipment || []).join(', '));
  labelValue('Photo Booth', data.photoBooth ? 'Yes' : 'No');

  if (data.surprises) {
    spacer();
    subheading('Special Requests');
    bodyText(data.surprises);
  }
  if (data.additionalNotes) {
    spacer();
    subheading('Additional Notes');
    bodyText(data.additionalNotes);
  }

  // ===== SECTION 7: VENDOR CONTACTS =====
  spacer(8);
  heading('7. Vendor Contacts');

  const vendorLabels = { planner: 'Planner', photographer: 'Photographer', videographer: 'Videographer', decorator: 'Decorator' };
  Object.entries(data.vendors || {}).forEach(([key, vendor]) => {
    if (!vendor?.name) return;
    checkPage(12);
    subheading(vendorLabels[key] || key);
    labelValue('Name', vendor.name, 4);
    labelValue('Phone', vendor.phone, 4);
    labelValue('Email', vendor.email, 4);
    spacer(2);
  });

  // ===== SECTION 8: SIGN-OFF =====
  doc.addPage();
  y = margin;
  heading('8. Sign-off');

  if (data.signatureName) {
    spacer();
    bodyText('I confirm that all information provided is accurate and complete.');
    spacer(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(16);
    doc.setTextColor(...DARK);
    doc.text(clean(data.signatureName), margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`Date: ${data.signatureDate || '—'}`, margin, y);
  } else {
    bodyText('Not yet signed.');
  }

  // ===== RUNNING FOOTER =====
  // Field-use essential: when the DJ's printed pages get shuffled on the booth,
  // a page number + couple identity on every page lets them re-sequence fast.
  // Skip the cover (page 1).
  const totalPages = doc.getNumberOfPages();
  const coupleLine = `${clean(data.brideName || '')} & ${clean(data.groomName || '')}`;
  const footerLeft = [coupleLine.trim() && coupleLine, clean(dateStr)]
    .filter(Boolean)
    .join('  ·  ');
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    if (footerLeft) doc.text(footerLeft, margin, pageH - 10);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 10, { align: 'right' });
  }

  // Save
  const datePart = data.firstEventDate ? `_${data.firstEventDate}` : '';
  const fileName = `${data.brideName || 'Wedding'}_${data.groomName || ''}${datePart}_RunSheet.pdf`;
  doc.save(fileName);
}
