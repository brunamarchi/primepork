import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-primary text-white active:bg-primary-dark',
  secondary: 'bg-surface text-ink border border-hairline active:bg-bg',
  danger: 'bg-danger text-white active:opacity-90',
  ghost: 'text-primary active:bg-bg',
}

export default function Button({
  as,
  to,
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const classes = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-card px-4 text-sm font-semibold disabled:opacity-50 ${VARIANTS[variant]} ${className}`

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
