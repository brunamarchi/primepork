export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-card border border-hairline bg-surface p-4 shadow-[0_2px_16px_rgba(22,33,58,0.06)] transition-shadow duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
