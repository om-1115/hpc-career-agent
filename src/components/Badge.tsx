import type { ReactNode } from 'react'
import './Badge.css'

export type BadgeTone = 'indigo' | 'solid' | 'green' | 'orange' | 'neutral'

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
