import BottomNav from './BottomNav'

export default function AppShell({ title, action, children }) {
  return (
    <div className="min-h-full bg-bg pb-[96px]">
      {title && (
        <header
          className="sticky top-0 z-10 flex items-center justify-between bg-bg/90 px-4 py-3 backdrop-blur"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          {action}
        </header>
      )}
      <main className="px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  )
}
