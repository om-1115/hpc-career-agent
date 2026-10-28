import type { ReactNode } from 'react'
import './SectionHeader.css'

type Props = {
  title: string
  action?: { label: string; onClick: () => void }
  children?: ReactNode
}

export function SectionHeader({ title, action, children }: Props) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      {action && (
        <button type="button" className="section-header__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {children}
    </div>
  )
}
