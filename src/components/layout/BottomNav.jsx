import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Painel', icon: IconHome },
  { to: '/estoque', label: 'Estoque', icon: IconBox },
  { to: '/vendas', label: 'Vendas', icon: IconCart },
  { to: '/clientes', label: 'Clientes', icon: IconUsers },
  { to: '/mapa', label: 'Mapa', icon: IconMap },
]

function getActiveIndex(pathname) {
  const idx = TABS.findIndex((t) => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to)))
  return idx === -1 ? 0 : idx
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const activeIndex = getActiveIndex(pathname)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 px-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
    >
      <div className="relative mx-auto flex max-w-md items-center overflow-hidden rounded-[28px] border border-white/60 bg-white/65 px-2 py-2 shadow-[0_8px_32px_rgba(22,33,58,0.22)] backdrop-blur-xl backdrop-saturate-150">
        {/* liquid glass sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <div className="pointer-events-none absolute -inset-x-4 -top-10 h-20 rounded-full bg-white/40 blur-2xl" />

        {/* liquid indicator that glides to the active tab */}
        <div
          className="absolute inset-y-2 left-2 rounded-[20px] bg-white/70 shadow-[0_2px_16px_rgba(22,33,58,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{
            width: `calc((100% - 16px) / ${TABS.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="relative z-10 flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium text-muted transition-transform duration-150 ease-out active:scale-90"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ease-out ${
                    isActive ? 'scale-100 bg-accent text-white shadow-[0_2px_8px_rgba(255,106,61,0.5)]' : 'scale-90 text-muted'
                  }`}
                >
                  <Icon />
                </span>
                <span className={`transition-colors duration-150 ${isActive ? 'font-semibold text-ink' : ''}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v8" strokeLinecap="round" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2l2.6 12.6a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" strokeLinecap="round" />
      <path d="M16 4.6c1.6.5 2.8 2 2.8 3.7 0 1.7-1.2 3.2-2.8 3.7" strokeLinecap="round" />
      <path d="M15 14c2.9.5 4.8 2.5 4.8 6" strokeLinecap="round" />
    </svg>
  )
}

function IconMap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4v13M15 6.5v13" strokeLinecap="round" />
    </svg>
  )
}
