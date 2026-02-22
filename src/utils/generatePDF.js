import jsPDF from 'jspdf';
import { eventOptions } from '../data/demoData';

const GOLD = [217, 119, 6];
const DARK = [41, 37, 36];
const GRAY = [120, 113, 108];
const LIGHT = [245, 245, 244];

export function generateRunSheet(data) {
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

  const heading = (text, size = 16) => {
    checkPage(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...DARK);
    doc.text(text, margin, y);
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
    doc.setTextColor(...GOLD);
    doc.text(text, margin, y);
    y += 6;
  };

  const bodyText = (text, indent = 0) => {
    checkPage(8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, pageW - margin * 2 - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5;
  };

  const labelValue = (label, value, indent = 0) => {
    checkPage(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label, margin + indent, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(String(value || '—'), margin + indent + 40, y);
    y += 6;
  };

  const spacer = (h = 4) => { y += h; };

  // ===== COVER PAGE =====
  doc.setFillColor(...LIGHT);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Logo placeholder
  doc.setFontSize(12);
  doc.setTextColor(...GRAY);
  doc.text('Special Occasions DJ · Lighting · Technology', pageW / 2, 40, { align: 'center' });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...DARK);
  doc.text('Wedding Run Sheet', pageW / 2, 80, { align: 'center' });

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
    subheading(`${event?.emoji || ''} ${event?.label || eventId}`);
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
    doc.text(person.name, cols[0], y);
    doc.text(person.role || '', cols[1], y);
    doc.text(person.pronunciation || '', cols[2], y);
    doc.text(person.style || '', cols[3], y);
    y += 5;
  });

  // ===== SECTION 4: MUSIC =====
  spacer(8);
  heading('4. Music');

  subheading('Must-Play Songs');
  (data.mustPlaySongs || []).forEach((song) => {
    checkPage(8);
    const eventLabel = eventOptions.find((e) => e.id === song.event)?.label || '';
    bodyText(`• ${song.name} — ${song.artist}${eventLabel ? ` [${eventLabel}]` : ''}`, 4);
  });

  spacer();
  subheading('Do-Not-Play Songs');
  (data.doNotPlaySongs || []).forEach((song) => {
    checkPage(8);
    bodyText(`• ${song.name} — ${song.artist}`, 4);
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

  // ===== SECTION 5: PROGRAM TIMELINE =====
  doc.addPage();
  y = margin;
  heading('5. Program Timeline');

  (data.selectedEvents || []).forEach((eventId) => {
    const event = eventOptions.find((e) => e.id === eventId);
    const blocks = data.timelines?.[eventId] || [];
    if (blocks.length === 0) return;
    checkPage(20);
    subheading(`${event?.emoji || ''} ${event?.label || eventId}`);
    let cumMin = 0;
    blocks.forEach((block) => {
      checkPage(8);
      bodyText(`+${cumMin}min  ${block.label} (${block.duration}min)`, 4);
      cumMin += block.duration || 0;
    });
    spacer();
  });

  // Performances
  if (data.performances?.length) {
    spacer();
    subheading('Performances');
    data.performances.forEach((p) => {
      checkPage(8);
      bodyText(`• ${p.groupName}: "${p.songName}" (${p.duration}min)`, 4);
    });
  }

  // Speeches
  if (data.speeches?.length) {
    spacer();
    subheading('Speeches');
    data.speeches.forEach((s) => {
      checkPage(8);
      bodyText(`• ${s.speaker} (${s.relationship}) — after ${s.afterMoment}`, 4);
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
    doc.text(data.signatureName, margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`Date: ${data.signatureDate || '—'}`, margin, y);
  } else {
    bodyText('Not yet signed.');
  }

  // Save
  const fileName = `${data.brideName || 'Wedding'}_${data.groomName || ''}_RunSheet.pdf`;
  doc.save(fileName);
}
