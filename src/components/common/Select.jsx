export default function Select({ label, options = [], groupedOptions, placeholder = 'Select...', className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <select
        className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-sm bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent hover:border-stone-400 cursor-pointer"
        {...props}
      >
        <option value="">{placeholder}</option>
        {groupedOptions ? (
          <>
            {groupedOptions.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
            <option value="__other">Other</option>
          </>
        ) : (
          options.map((opt) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
