import './AppHeader.css'

/**
 * The v2 navy header (Figma: 124px, #16356b) — a greeting and a scope line,
 * not a product title. Every one of the 48 screens carries it.
 *
 * Note this is a different navy and height from the two v1 frames, which is why
 * the tokens are versioned rather than overwritten.
 */
type Props = {
  /** "Hi, Sunita" — the greeting, not the screen name. */
  title: string
  /** "Science · Grades 9 & 10" for a teacher, "Class 9-B" for a student. */
  subtitle?: string
  /** Two-letter monogram shown at the right. */
  initials?: string
  onMenuClick?: () => void
  onAvatarClick?: () => void
}

export function AppHeader({ title, subtitle, initials, onMenuClick, onAvatarClick }: Props) {
  return (
    <header className="app-header">
      <div className="app-header__row">
        {onMenuClick && (
          <button type="button" className="app-header__menu" onClick={onMenuClick} aria-label="Open menu">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <div className="app-header__titles">
          <p className="app-header__title">{title}</p>
          {subtitle && <p className="app-header__subtitle">{subtitle.trim()}</p>}
        </div>

        {initials && (
          <button
            type="button"
            className="app-header__avatar"
            onClick={onAvatarClick}
            aria-label="Your profile"
          >
            {initials}
          </button>
        )}
      </div>
    </header>
  )
}
