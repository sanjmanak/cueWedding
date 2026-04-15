/**
 * Circular couple avatar. Falls back to stacked initials on a gold gradient
 * when no photo exists.
 */
export default function Avatar({
  photoUrl,
  brideName = '',
  groomName = '',
  size = 40,
  className = '',
  title,
}) {
  const dimension = { width: size, height: size };
  const initials = getInitials(brideName, groomName);
  const altText = title || formatCoupleName(brideName, groomName);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={altText}
        title={title}
        width={size}
        height={size}
        style={dimension}
        className={`rounded-full object-cover border border-stone-200 bg-stone-100 ${className}`}
      />
    );
  }

  return (
    <div
      style={dimension}
      title={title || altText}
      className={`rounded-full border border-stone-200 bg-gradient-to-br from-gold-100 to-gold-300 flex items-center justify-center text-gold-800 font-semibold select-none ${className}`}
    >
      <span style={{ fontSize: Math.max(10, Math.round(size * 0.38)) }}>{initials || '♡'}</span>
    </div>
  );
}

function getInitials(bride, groom) {
  const b = (bride || '').trim().charAt(0).toUpperCase();
  const g = (groom || '').trim().charAt(0).toUpperCase();
  return `${b}${g}`;
}

function formatCoupleName(bride, groom) {
  const parts = [bride, groom].filter(Boolean);
  return parts.length ? parts.join(' & ') : 'Couple photo';
}
