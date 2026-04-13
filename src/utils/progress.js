// Progress calculation functions — shared between couple app and admin dashboard
// These are pure functions (no hooks) so they can be used anywhere.

export function calculatePhase1(d) {
  let score = 0, total = 6;
  if (d.brideName && d.groomName) score++;
  if (d.firstEventDate) score++;
  if (d.howMet) score++;
  if (d.selectedEvents?.length > 0) score++;
  if (d.selectedEvents?.some(e => d.eventVenues?.[e]?.name)) score++;
  if (d.vibeWords?.length >= 3) score++;
  return Math.round((score / total) * 100);
}

export function calculatePhase2(d) {
  let score = 0, total = 4;
  if (d.brideParents?.father || d.brideParents?.mother) score++;
  if (d.groomParents?.father || d.groomParents?.mother) score++;
  if (d.siblings?.length > 0) score++;
  if (Object.keys(d.announcementStyles || {}).length > 0) score++;
  return Math.round((score / total) * 100);
}

export function calculatePhase3(d) {
  let score = 0, total = 4;
  if (d.mustPlaySongs?.length > 0) score++;
  if (d.doNotPlaySongs?.length > 0) score++;
  if (Object.keys(d.eventVibes || {}).length > 0) score++;
  if (d.specialMoments?.firstDance?.type) score++;
  return Math.round((score / total) * 100);
}

export function calculatePhase4(d) {
  let score = 0, total = 3;
  if (Object.keys(d.eventTemplates || {}).length > 0) score++;
  if (Object.keys(d.timelines || {}).some(k => d.timelines[k]?.length > 0)) score++;
  const hasDetails = Object.values(d.timelines || {}).some(blocks =>
    (blocks || []).some(b => (b.type === 'performance' && b.performerName) || (b.type === 'speech' && b.speaker))
  );
  if (hasDetails || d.performances?.length > 0 || d.speeches?.length > 0) score++;
  return Math.round((score / total) * 100);
}

export function calculatePhase5(d) {
  let score = 0, total = 3;
  if (Object.values(d.vendors || {}).some(v => v.name)) score++;
  if (d.equipment?.length > 0) score++;
  if (d.lightingColor) score++;
  return Math.round((score / total) * 100);
}

export function calculatePhase6(d) {
  let score = 0, total = 2;
  if (d.confirmed) score++;
  if (d.signatureName) score++;
  return Math.round((score / total) * 100);
}

export function calculateAllPhases(d) {
  const phases = {
    1: calculatePhase1(d),
    2: calculatePhase2(d),
    3: calculatePhase3(d),
    4: calculatePhase4(d),
    5: calculatePhase5(d),
    6: calculatePhase6(d),
  };
  const total = Object.values(phases).reduce((sum, p) => sum + p, 0) / 6;
  return { phases, total: Math.round(total) };
}
