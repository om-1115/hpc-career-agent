import './ClassOverviewCard.css'

export type ClassStat = {
  label: string
  value: string
  tone: 'success' | 'warning' | 'muted'
}

export type ClassOverview = {
  id: string
  avatar: string
  name: string
  studentCount: number
  stats: ClassStat[]
}

export function ClassOverviewCard({ data, onClick }: { data: ClassOverview; onClick: () => void }) {
  return (
    <button type="button" className="class-card" onClick={onClick}>
      <span className="class-card__head">
        <img className="class-card__avatar" src={data.avatar} alt="" />
        <span className="class-card__identity">
          <span className="class-card__name">{data.name}</span>
          <span className="class-card__meta">{data.studentCount} Students</span>
        </span>
        <img className="class-card__caret" src="/assets/icon-caret.svg" alt="" />
      </span>

      <span className="class-card__rule" />

      <span className="class-card__stats">
        {data.stats.map((stat, index) => (
          <span className="class-card__stat-group" key={stat.label}>
            {index > 0 && <span className="class-card__divider" />}
            <span className="class-card__stat">
              <span className="class-card__stat-label">{stat.label}</span>
              <span className={`class-card__stat-value class-card__stat-value--${stat.tone}`}>{stat.value}</span>
            </span>
          </span>
        ))}
      </span>
    </button>
  )
}
