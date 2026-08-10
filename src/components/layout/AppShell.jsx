import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppShell({ title, action, children }) {
  return (
    <div className="min-h-full bg-bg lg:flex">
      <Sidebar />
      <div className="min-h-full flex-1 pb-[96px] lg:pb-0">
        {title && (
          <header
            className="sticky top-0 z-10 flex items-center justify-between bg-bg/90 px-4 py-3 backdrop-blur lg:px-10 lg:py-6"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
          >
            <h1 className="text-xl font-bold text-ink lg:text-2xl">{title}</h1>
            {action}
          </header>
        )}
        <main className="animate-page-in px-4 py-4 lg:mx-auto lg:max-w-6xl lg:px-10 lg:py-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
