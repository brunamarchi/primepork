export default function Field({ label, required, hint, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'min-h-[44px] rounded-card border border-hairline bg-surface px-3 text-ink placeholder:text-muted focus:border-primary focus:outline-none'
