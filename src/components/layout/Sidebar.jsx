import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { IconHome, IconBox, IconCart, IconUsers, IconMap, IconLogout } from '../icons'

const TABS = [
  { to: '/', label: 'Painel', icon: IconHome },
  { to: '/estoque', label: 'Estoque', icon: IconBox },
  { to: '/vendas', label: 'Vendas', icon: IconCart },
  { to: '/clientes', label: 'Clientes', icon: IconUsers },
  { to: '/mapa', label: 'Mapa', icon: IconMap },
]

export default function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-hairline lg:bg-surface lg:px-4 lg:py-6">
      <div className="flex items-center gap-3 px-2">
        <span className="hero-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
          PP
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">Prime Pork</p>
          <p className="truncate text-xs text-muted">Painel de controle</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive ? 'bg-primary text-white shadow-[0_2px_8px_rgba(22,39,77,0.25)]' : 'text-muted hover:bg-bg hover:text-ink'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={signOut}
        className="mt-auto flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium text-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
      >
        <IconLogout />
        Sair
      </button>
    </aside>
  )
}
