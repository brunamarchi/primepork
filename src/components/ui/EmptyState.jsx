export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline px-6 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}
