import type { ReactNode } from 'react'
import './EmptyState.css'

/**
 * The one empty-state component (Figma screen-48 catalogues three patterns of
 * it, deliberately so the team builds one rather than three).
 *
 * Anatomy is fixed: 64px illustration, title, one muted explanatory line, then
 * a single recovery action — either a full-width primary button or a text link.
 * The "PATTERN N:" eyebrows in the Figma frame are catalogue scaffolding and do
 * not ship.
 */
export type EmptyStateAction = {
  label: string
  onClick: () => void
  /** Buttons carry the primary path; links carry the lesser one. */
  variant?: 'button' | 'link'
}

type Props = {
  illustration: string
  title: string
  body: string
  action?: EmptyStateAction
  children?: ReactNode
}

export function EmptyState({ illustration, title, body, action, children }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__figure">
        <img className="empty-state__illustration" src={illustration} alt="" />
        <p className="empty-state__title">{title}</p>
        <p className="empty-state__body">{body}</p>
      </div>

      {action &&
        (action.variant === 'link' ? (
          <button type="button" className="empty-state__link" onClick={action.onClick}>
            {action.label}
          </button>
        ) : (
          <button type="button" className="empty-state__button" onClick={action.onClick}>
            {action.label}
          </button>
        ))}

      {children}
    </div>
  )
}
