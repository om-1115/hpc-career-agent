import { useEffect } from 'react'
import './MenuDrawer.css'

export type DrawerProfile = {
  name: string
  detail: string
  emoji: string
}

type Props = {
  open: boolean
  onClose: () => void
  profile: DrawerProfile
  onSignOut: () => void
}

/** Who is signed in, and the way out. Roles are a sign-in choice now, not a switch. */
export function MenuDrawer({ open, onClose, profile, onSignOut }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`drawer${open ? ' drawer--open' : ''}`} inert={!open}>
      <button type="button" className="drawer__scrim" onClick={onClose}>
        <span className="sr-only">Close menu</span>
      </button>
      <aside className="drawer__panel" aria-label="Your profile">
        <p className="drawer__eyebrow">Signed in as</p>
        <div className="drawer__item drawer__item--active">
          <span className="drawer__item-emoji" aria-hidden="true">
            {profile.emoji}
          </span>
          <span className="drawer__item-text">
            <span className="drawer__item-label">{profile.name}</span>
            <span className="drawer__item-description">{profile.detail}</span>
          </span>
        </div>
        <button
          type="button"
          className="drawer__signout"
          onClick={() => {
            onClose()
            onSignOut()
          }}
        >
          Sign out
        </button>
      </aside>
    </div>
  )
}
