import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import './PageShell.css'

type Props = {
  title: string
  /** Where Back goes. Defaults to the previous page. */
  backTo?: string
  /** 0–1; shows a thin progress bar under the header. */
  progress?: number
  children: ReactNode
  /** Pinned under the content, e.g. the test's Back / Next. */
  footer?: ReactNode
}

/** A full page in v1's chrome — the navy header without the tab bar, for flows like the test. */
export function PageShell({ title, backTo, progress, children, footer }: Props) {
  const navigate = useNavigate()
  return (
    <div className="screen page">
      <header className="page__header">
        <div className="screen__header-pattern" aria-hidden="true">
          <img src="/assets/header-pattern.svg" alt="" />
        </div>
        <button
          type="button"
          className="page__back"
          aria-label="Back"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12 4 6 10l6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="page__title">{title}</h1>
        {progress !== undefined && (
          <div
            className="page__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
          </div>
        )}
      </header>
      <main className="page__content">{children}</main>
      {footer && <div className="page__footer">{footer}</div>}
    </div>
  )
}
