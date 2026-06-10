import { Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import type { Theme } from '../useAppTheme'

type CoreHeaderProps = {
  title: string
  theme: Theme
  onToggleTheme: () => void
  primaryActionTo: string
  primaryActionLabel: string
  PrimaryActionIcon: LucideIcon
}

function CoreHeader({
  title,
  theme,
  onToggleTheme,
  primaryActionTo,
  primaryActionLabel,
  PrimaryActionIcon,
}: CoreHeaderProps) {
  const nextTheme = theme === 'light' ? 'dark' : 'light'

  return (
    <header className="topbar reveal reveal-1">
      <h1 className="brand-title">{title}</h1>
      <div className="topbar-actions">
        <Link
          className="topbar-icon-btn"
          to={primaryActionTo}
          aria-label={primaryActionLabel}
          title={primaryActionLabel}
        >
          <PrimaryActionIcon size={18} />
        </Link>
        <button
          type="button"
          className="theme-toggle topbar-icon-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  )
}

export default CoreHeader
