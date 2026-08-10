import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'rounded-card bg-primary text-white shadow-[0_2px_8px_rgba(22,39,77,0.25)] active:bg-primary-dark',
  secondary: 'rounded-card bg-surface text-ink border border-hairline active:bg-bg',
  danger: 'rounded-card bg-danger text-white active:opacity-90',
  ghost: 'rounded-card text-primary active:bg-bg',
  pill: 'rounded-[var(--radius-pill)] bg-white text-ink shadow-[0_2px_10px_rgba(0,0,0,0.12)] active:bg-bg',
  accent: 'rounded-[var(--radius-pill)] bg-accent text-white active:opacity-90',
  success: 'rounded-[var(--radius-pill)] bg-success text-white shadow-[0_4px_14px_rgba(47,158,88,0.45)] active:opacity-90',
}

export default function Button({
  as,
  to,
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const classes = `inline-flex min-h-[44px] items-center justify-center gap-2 px-4 text-sm font-semibold transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  const Component = as || 'button'
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}
