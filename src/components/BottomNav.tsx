import './BottomNav.css'

export type NavItem = {
  id: string
  label: string
  icon: string
}

type Props = {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function BottomNav({ items, activeId, onSelect }: Props) {
  return (
    <div className="menubar">
      <nav className="menubar__bar" aria-label="Primary">
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              type="button"
              key={item.id}
              className={`nav-button${isActive ? ' nav-button--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(item.id)}
            >
              <img className="nav-button__icon" src={item.icon} alt="" width={24} height={24} />
              <span className="nav-button__label">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
