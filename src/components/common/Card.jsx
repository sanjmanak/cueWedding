export default function Card({
  children,
  className = '',
  selected = false,
  onClick,
  hoverable = false,
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 ${
        selected
          ? 'border-gold-500 ring-2 ring-gold-200 shadow-sm'
          : 'border-stone-200'
      } ${
        hoverable || onClick ? 'hover:border-stone-300 hover:shadow-md cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
