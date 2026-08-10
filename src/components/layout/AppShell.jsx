import BottomNav from './BottomNav'

export default function AppShell({ title, action, children }) {
  return (
    <div className="min-h-full bg-bg pb-[72px]">
      {title && (
        <header
          className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-surface/95 px-4 py-3 backdrop-blur"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
          {action}
        </header>
      )}
      <main className="px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  )
}
