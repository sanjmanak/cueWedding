export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 focus:ring-stone-500',
    secondary: 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 focus:ring-stone-300',
    gold: 'bg-gold-600 text-white hover:bg-gold-700 focus:ring-gold-400',
    ghost: 'text-stone-600 hover:bg-stone-100 focus:ring-stone-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
