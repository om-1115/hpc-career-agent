import { useState, type ReactNode } from 'react'
import { activities, ATTENDANCE_NEEDED, attendanceByMonth, LEVELS, type Competency } from '../data/liveHpc'

/**
 * Live HPC's charts, in plain SVG. Thin marks with rounded data ends, a
 * recessive grid, values in text ink (never the series colour), a legend for
 * more than one series, a value readout on tap or hover, and a table for
 * screen readers under each chart.
 */

/** You, your group and your teacher: the first three categorical slots, validated together. */
export const VIEW_SERIES = [
  { key: 'self', label: 'You', color: '#1baf7a' },
  { key: 'peers', label: 'Your group', color: '#eb6834' },
  { key: 'teacher', label: 'Your teacher', color: '#2a78d6' },
] as const

const SHORT_LEVEL = ['Beginning', 'Developing', 'Proficient', 'Advanced']

function Figure({ title, note, readout, children, table }: { title: string; note?: string; readout: string; children: ReactNode; table: ReactNode }) {
  return (
    <figure className="hpc-chart">
      <figcaption className="hpc-chart__title">{title}</figcaption>
      {note && <p className="hpc-chart__note">{note}</p>}
      {children}
      <p className="hpc-chart__readout" aria-live="polite">
        {readout}
      </p>
      <table className="hpc-sr-only">{table}</table>
    </figure>
  )
}

function Legend({ items }: { items: { label: string; color: string; hollow?: boolean }[] }) {
  return (
    <ul className="hpc-chart__legend">
      {items.map((item) => (
        <li key={item.label}>
          <span
            className="hpc-chart__swatch"
            style={item.hollow ? { borderColor: item.color, background: 'transparent' } : { background: item.color, borderColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/** A bar with a rounded top and a square base on the baseline. */
const topRounded = (x: number, y: number, width: number, height: number, r = 4) => {
  const radius = Math.min(r, height, width / 2)
  return `M${x},${y + height}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + width - radius}Q${x + width},${y} ${x + width},${y + radius}V${y + height}Z`
}

/** Attendance, month by month, against the 75% most boards ask for. */
export function AttendanceChart() {
  const [active, setActive] = useState(attendanceByMonth.length - 1)
  const W = 320
  const H = 150
  const left = 34
  const right = 8
  const top = 12
  const bottom = 26
  const plotH = H - top - bottom
  const band = (W - left - right) / attendanceByMonth.length
  const y = (percent: number) => top + plotH * (1 - percent / 100)
  const pct = (month: (typeof attendanceByMonth)[number]) => Math.round((month.present / month.days) * 100)
  const current = attendanceByMonth[active]

  return (
    <Figure
      title="Attendance by month"
      note={`The dashed line is the ${ATTENDANCE_NEEDED}% most boards ask for.`}
      readout={`${current.month}: ${pct(current)}% — ${current.present} of ${current.days} days`}
      table={
        <>
          <caption>Attendance by month</caption>
          <tbody>
            {attendanceByMonth.map((month) => (
              <tr key={month.month}>
                <th scope="row">{month.month}</th>
                <td>
                  {pct(month)}% ({month.present} of {month.days} days)
                </td>
              </tr>
            ))}
          </tbody>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="hpc-chart__svg" aria-hidden="true">
        {[0, 50, 100].map((tick) => (
          <g key={tick}>
            <line x1={left} x2={W - right} y1={y(tick)} y2={y(tick)} className="hpc-chart__grid" />
            <text x={left - 6} y={y(tick) + 3.5} textAnchor="end" className="hpc-chart__tick">
              {tick}%
            </text>
          </g>
        ))}
        {attendanceByMonth.map((month, index) => {
          const barW = Math.min(30, band - 14)
          const x = left + band * index + (band - barW) / 2
          return (
            <g key={month.month} className="hpc-chart__hit" onMouseEnter={() => setActive(index)} onClick={() => setActive(index)}>
              <rect x={left + band * index} y={top} width={band} height={plotH + bottom} fill="transparent" />
              <path d={topRounded(x, y(pct(month)), barW, y(0) - y(pct(month)))} fill={index === active ? '#2a78d6' : '#9ec5f0'} />
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" className={`hpc-chart__tick${index === active ? ' hpc-chart__tick--active' : ''}`}>
                {month.month}
              </text>
            </g>
          )
        })}
        <line x1={left} x2={W - right} y1={y(ATTENDANCE_NEEDED)} y2={y(ATTENDANCE_NEEDED)} className="hpc-chart__reference" />
      </svg>
    </Figure>
  )
}

/** Rows of competencies on the four-step scale, shared by the two dot charts. */
function StepRows({
  rows,
  marks,
  onActive,
  rowH = 30,
}: {
  rows: Competency[]
  marks: (competency: Competency, x: (step: number) => number, rowY: number) => ReactNode
  onActive: (competency: Competency) => void
  rowH?: number
}) {
  const W = 320
  const nameW = 92
  const right = 14
  const top = 8
  const axisH = 22
  const H = top + rows.length * rowH + axisH
  // Inset so each level's name fits centred under its step.
  const inset = 26
  const x = (step: number) => nameW + inset + ((step - 1) / 3) * (W - nameW - right - 2 * inset)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hpc-chart__svg" aria-hidden="true">
      {[1, 2, 3, 4].map((step) => (
        <line key={step} x1={x(step)} x2={x(step)} y1={top} y2={top + rows.length * rowH} className="hpc-chart__grid" />
      ))}
      {rows.map((competency, index) => {
        const rowY = top + index * rowH + rowH / 2
        return (
          <g key={competency.id} className="hpc-chart__hit" onMouseEnter={() => onActive(competency)} onClick={() => onActive(competency)}>
            <rect x={0} y={rowY - rowH / 2} width={W} height={rowH} fill="transparent" />
            {index > 0 && <line x1={0} x2={W - right} y1={rowY - rowH / 2} y2={rowY - rowH / 2} className="hpc-chart__grid" />}
            <text x={0} y={rowY + 4} className="hpc-chart__label">
              {competency.name}
            </text>
            {marks(competency, x, rowY)}
          </g>
        )
      })}
      {[1, 2, 3, 4].map((step) => (
        <text key={step} x={x(step)} y={H - 6} textAnchor="middle" className="hpc-chart__tick">
          {SHORT_LEVEL[step - 1]}
        </text>
      ))}
    </svg>
  )
}

/** Each competency last year and now: a dumbbell from then to now. */
export function GrowthChart({ rows }: { rows: Competency[] }) {
  const [active, setActive] = useState(rows[0])
  const first = (competency: Competency) => competency.history[0]
  const last = (competency: Competency) => competency.history[competency.history.length - 1]
  const describe = (competency: Competency) => {
    const change = last(competency).step - first(competency).step
    return `${competency.name}: ${change > 0 ? `up ${change === 1 ? 'one step' : `${change} steps`}` : 'the same'} since ${first(competency).term}, now ${competency.level}`
  }
  return (
    <Figure
      title="How I've grown since last year"
      readout={describe(active)}
      table={
        <>
          <caption>Each competency last year and now</caption>
          <thead>
            <tr>
              <th scope="col">Competency</th>
              <th scope="col">{first(rows[0]).term}</th>
              <th scope="col">Now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((competency) => (
              <tr key={competency.id}>
                <th scope="row">{competency.name}</th>
                <td>Step {first(competency).step} of 4</td>
                <td>{competency.level}</td>
              </tr>
            ))}
          </tbody>
        </>
      }
    >
      <Legend
        items={[
          { label: `Last year (${first(rows[0]).term})`, color: '#2a78d6', hollow: true },
          { label: `Now (${last(rows[0]).term})`, color: '#2a78d6' },
        ]}
      />
      <StepRows
        rows={rows}
        onActive={setActive}
        marks={(competency, x, rowY) => (
          <>
            <line x1={x(first(competency).step)} x2={x(last(competency).step)} y1={rowY} y2={rowY} stroke="#9ec5f0" strokeWidth={2} strokeLinecap="round" />
            <circle cx={x(first(competency).step)} cy={rowY} r={5} fill="#fff" stroke="#2a78d6" strokeWidth={2} />
            <circle cx={x(last(competency).step)} cy={rowY} r={6} fill="#2a78d6" stroke="#fff" strokeWidth={2} />
          </>
        )}
      />
    </Figure>
  )
}

/** The 360° view: how the student, their group and their teacher rated each competency. */
export function ViewsChart({ rows }: { rows: Competency[] }) {
  const [active, setActive] = useState(rows[0])
  const describe = (competency: Competency) =>
    `${competency.name}: ${VIEW_SERIES.map((series) => `${series.label.toLowerCase()} ${SHORT_LEVEL[competency.views[series.key] - 1].toLowerCase()}`).join(', ')}`
  return (
    <Figure
      title="How you, your group and your teacher see it"
      note="Different views are normal. Where they differ is a good thing to talk about."
      readout={describe(active)}
      table={
        <>
          <caption>Ratings by viewpoint</caption>
          <thead>
            <tr>
              <th scope="col">Competency</th>
              {VIEW_SERIES.map((series) => (
                <th key={series.key} scope="col">
                  {series.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((competency) => (
              <tr key={competency.id}>
                <th scope="row">{competency.name}</th>
                {VIEW_SERIES.map((series) => (
                  <td key={series.key}>{LEVELS[competency.views[series.key] - 1]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </>
      }
    >
      <Legend items={VIEW_SERIES.map((series) => ({ label: series.label, color: series.color }))} />
      <StepRows
        rows={rows}
        rowH={40}
        onActive={setActive}
        marks={(competency, x, rowY) =>
          VIEW_SERIES.map((series, index) => (
            // Stacked a little apart so equal ratings stay visible; a surface ring separates overlaps.
            <circle key={series.key} cx={x(competency.views[series.key])} cy={rowY + (index - 1) * 10} r={5} fill={series.color} stroke="#fff" strokeWidth={2} />
          ))
        }
      />
    </Figure>
  )
}

/** Hours outside lessons this term. */
export function ActivitiesChart() {
  const [active, setActive] = useState(0)
  const W = 320
  const nameW = 118
  const valueW = 36
  const rowH = 26
  const barH = 12
  const most = Math.max(...activities.map((activity) => activity.hours))
  const H = activities.length * rowH
  const total = activities.reduce((sum, activity) => sum + activity.hours, 0)
  return (
    <Figure
      title="Beyond the classroom"
      readout={`${activities[active].name}: ${activities[active].hours} hours this term · ${total} hours in all`}
      table={
        <>
          <caption>Hours this term outside lessons</caption>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.name}>
                <th scope="row">{activity.name}</th>
                <td>{activity.hours} hours</td>
              </tr>
            ))}
          </tbody>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="hpc-chart__svg" aria-hidden="true">
        {activities.map((activity, index) => {
          const width = ((W - nameW - valueW) * activity.hours) / most
          const rowY = index * rowH + rowH / 2
          return (
            <g key={activity.name} className="hpc-chart__hit" onMouseEnter={() => setActive(index)} onClick={() => setActive(index)}>
              <rect x={0} y={rowY - rowH / 2} width={W} height={rowH} fill="transparent" />
              <text x={0} y={rowY + 4} className="hpc-chart__label">
                {activity.name}
              </text>
              <rect x={nameW} y={rowY - barH / 2} width={width} height={barH} rx={4} fill={index === active ? '#2a78d6' : '#9ec5f0'} />
              <text x={nameW + width + 6} y={rowY + 4} className="hpc-chart__tick">
                {activity.hours} h
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/** One competency's three views, for its detail page. */
export function ViewsRow({ competency }: { competency: Competency }) {
  return (
    <ul className="hpc-views">
      {VIEW_SERIES.map((series) => (
        <li key={series.key} className="hpc-views__item">
          <span className="hpc-chart__swatch" style={{ background: series.color, borderColor: series.color }} aria-hidden="true" />
          <span className="hpc-views__who">{series.label}</span>
          <span className="hpc-views__level">{LEVELS[competency.views[series.key] - 1]}</span>
        </li>
      ))}
    </ul>
  )
}
