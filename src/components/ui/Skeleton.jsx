export default function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-card ${className}`} />
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-card border border-hairline bg-surface p-4 ${className}`}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-5 w-32" />
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-2 h-3 w-48" />
        </div>
      ))}
    </div>
  )
}
