import './ComingSoon.css'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="coming-soon">
      <span className="coming-soon__emoji" aria-hidden="true">
        🗂️
      </span>
      <p className="coming-soon__title">{title}</p>
      <p className="coming-soon__body">This tab isn’t part of the two screens in the Figma file yet.</p>
    </div>
  )
}
