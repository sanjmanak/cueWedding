export default function TextArea({ label, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <textarea
        className="w-full px-4 py-3 rounded-lg border border-stone-300 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent placeholder:text-stone-400 hover:border-stone-400 resize-none"
        rows={4}
        {...props}
      />
    </div>
  );
}
