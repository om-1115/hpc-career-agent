import './PrimaryCta.css'

export function PrimaryCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="primary-cta" onClick={onClick}>
      <svg className="primary-cta__icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  )
}
