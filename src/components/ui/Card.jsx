export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-card border border-hairline bg-surface p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
