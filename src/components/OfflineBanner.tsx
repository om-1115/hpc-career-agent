import './OfflineBanner.css'

/**
 * Global connectivity strip (Figma screen-48, pattern set).
 *
 * The architecture is explicit that "offline is a normal state, not an error
 * state" — schools often lack persistent connectivity — so this is a standing
 * shell element rather than an error surface, and the copy reassures rather
 * than warns.
 */
export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null
  return (
    <div className="offline-banner" role="status">
      <svg className="offline-banner__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 18.5h.01M4.5 9.5a10.6 10.6 0 0 1 15 0M7.8 13a6 6 0 0 1 8.4 0M3 3l18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <p className="offline-banner__text">You’re offline. Your work is saved and will sync automatically.</p>
    </div>
  )
}
