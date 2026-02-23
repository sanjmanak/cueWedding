import { useState } from 'react';

const validators = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  tel: {
    pattern: /^[\d\s()+-]{7,}$/,
    message: 'Please enter a valid phone number',
  },
};

export default function Input({
  label,
  error: externalError,
  validate,
  className = '',
  type,
  ...props
}) {
  const [touched, setTouched] = useState(false);

  const shouldValidate = validate !== false && type && validators[type];
  const value = props.value || '';
  let validationError = null;

  if (shouldValidate && touched && value && !validators[type].pattern.test(value)) {
    validationError = validators[type].message;
  }

  const error = externalError || validationError;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <input
        type={type}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent placeholder:text-stone-400 ${
          error ? 'border-red-300 focus:ring-red-400' : 'border-stone-300 hover:border-stone-400'
        }`}
        onBlur={() => setTouched(true)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
