import './TopAppBar.css'

type Props = {
  title: string
  onMenuClick: () => void
}

export function TopAppBar({ title, onMenuClick }: Props) {
  return (
    <div className="top-app-bar">
      <button type="button" className="top-app-bar__menu" onClick={onMenuClick} aria-label="Open menu">
        <img src="/assets/icon-menu.svg" alt="" width={16} height={16} />
      </button>
      <h1 className="top-app-bar__title">{title}</h1>
    </div>
  )
}
