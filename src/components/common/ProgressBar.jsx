export default function ProgressBar({ value = 0, max = 100, className = '', showLabel = true }) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-stone-500 min-w-[3ch]">{percentage}%</span>
      )}
    </div>
  );
}
