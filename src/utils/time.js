// Shared time formatting helpers.

// Accepts a Firestore Timestamp (with .toDate), a Date, an ISO string, or a
// number of ms. Returns a human-friendly relative string or null for invalid
// input.
export function formatRelativeTime(value) {
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
