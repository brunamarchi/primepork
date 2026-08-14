import { NavLink, useLocation } from 'react-router-dom'
import { IconHome, IconBox, IconFlame, IconCart, IconUsers, IconMap } from '../icons'

const TABS = [
  { to: '/', label: 'Painel', icon: IconHome },
  { to: '/estoque', label: 'Estoque', icon: IconBox },
  { to: '/producao', label: 'Produção', icon: IconFlame },
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
      className="fixed bottom-0 left-0 right-0 z-20 px-3 lg:hidden"
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
