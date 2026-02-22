import { useMemo } from 'react';

export function useProgress(formData) {
  return useMemo(() => {
    const phases = {
      1: calculatePhase1(formData),
      2: calculatePhase2(formData),
      3: calculatePhase3(formData),
      4: calculatePhase4(formData),
      5: calculatePhase5(formData),
      6: calculatePhase6(formData),
    };

    const total = Object.values(phases).reduce((sum, p) => sum + p, 0) / 6;

    return { phases, total };
  }, [formData]);
}

function calculatePhase1(d) {
  let score = 0, total = 6;
  if (d.brideName && d.groomName) score++;
  if (d.firstEventDate) score++;
  if (d.howMet) score++;
  if (d.selectedEvents?.length > 0) score++;
  if (d.selectedEvents?.some(e => d.eventVenues?.[e]?.name)) score++;
  if (d.vibeWords?.length >= 3) score++;
  return Math.round((score / total) * 100);
}

function calculatePhase2(d) {
  let score = 0, total = 4;
  if (d.brideParents?.father || d.brideParents?.mother) score++;
  if (d.groomParents?.father || d.groomParents?.mother) score++;
  if (d.siblings?.length > 0) score++;
  if (Object.keys(d.announcementStyles || {}).length > 0) score++;
  return Math.round((score / total) * 100);
}

function calculatePhase3(d) {
  let score = 0, total = 4;
  if (d.mustPlaySongs?.length > 0) score++;
  if (d.doNotPlaySongs?.length > 0) score++;
  if (Object.keys(d.eventVibes || {}).length > 0) score++;
  if (d.specialMoments?.firstDance?.type) score++;
  return Math.round((score / total) * 100);
}

function calculatePhase4(d) {
  let score = 0, total = 3;
  if (Object.keys(d.eventTemplates || {}).length > 0) score++;
  if (Object.keys(d.timelines || {}).some(k => d.timelines[k]?.length > 0)) score++;
  if (d.performances?.length > 0 || d.speeches?.length > 0) score++;
  return Math.round((score / total) * 100);
}

function calculatePhase5(d) {
  let score = 0, total = 3;
  if (Object.values(d.vendors || {}).some(v => v.name)) score++;
  if (d.equipment?.length > 0) score++;
  if (d.lightingColor) score++;
  return Math.round((score / total) * 100);
}

function calculatePhase6(d) {
  let score = 0, total = 2;
  if (d.confirmed) score++;
  if (d.signatureName) score++;
  return Math.round((score / total) * 100);
}
