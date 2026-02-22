export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent placeholder:text-stone-400 ${
          error ? 'border-red-300 focus:ring-red-400' : 'border-stone-300 hover:border-stone-400'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
