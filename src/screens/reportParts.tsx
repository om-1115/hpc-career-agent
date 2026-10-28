/** Pieces of a result, shared by the profile summary and the full report. */

import { CAREERS, TYPE_NAMES, type Career } from '../../shared/careers'
import { TRAIT_COPY, TYPE_COPY } from '../../shared/report'
import { RIASEC_ORDER, type TestResult, type TraitKey } from '../../shared/scoring'

const LEVEL_LABEL = { low: 'Lower', moderate: 'In the middle', high: 'Higher' } as const

export function CodeLetters({ result }: { result: TestResult }) {
  return (
    <div className="career-report__letters">
      {result.code.map((type) => (
        <span key={type} className="career-report__letter">
          <strong>{type}</strong>
          {TYPE_COPY[type].short}
        </span>
      ))}
    </div>
  )
}

export function InterestBars({ result }: { result: TestResult }) {
  const ranked = [...RIASEC_ORDER].sort((a, b) => result.interests[b] - result.interests[a])
  return (
    <ul className="career-bars">
      {ranked.map((type) => (
        <li key={type} className="career-bars__row">
          <span className="career-bars__name">{TYPE_NAMES[type]}</span>
          <span className="career-bars__track" aria-label={`${result.interests[type]} out of 100`}>
            <span className="career-bars__fill" style={{ width: `${result.interests[type]}%` }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

export function TraitLevels({ result, withCopy = false }: { result: TestResult; withCopy?: boolean }) {
  const traits = Object.keys(TRAIT_COPY) as TraitKey[]
  if (!withCopy) {
    return (
      <ul className="career-traits">
        {traits.map((trait) => (
          <li key={trait} className="career-traits__row">
            <span>{TRAIT_COPY[trait].name}</span>
            <span className={`career-traits__level career-traits__level--${result.personality[trait].band}`}>
              {LEVEL_LABEL[result.personality[trait].band]}
            </span>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="report-section">
      {traits.map((trait) => {
        const { band } = result.personality[trait]
        return (
          <div key={trait} className="report-trait">
            <div className="report-trait__head">
              {TRAIT_COPY[trait].name}
              <span className={`career-traits__level career-traits__level--${band}`}>{LEVEL_LABEL[band]}</span>
            </div>
            <p className="report-trait__body">{TRAIT_COPY[trait].levels[band]}</p>
          </div>
        )
      })}
    </div>
  )
}

export const careerById = (id: string): Career | undefined => CAREERS.find((career) => career.id === id)

export function JobCard({ career, match = false }: { career: Career; match?: boolean }) {
  return (
    <article className={`job${match ? ' job--match' : ''}`}>
      <div className="job__head">
        <span className="job__emoji" aria-hidden="true">
          {career.emoji}
        </span>
        <h3 className="job__title">{career.title}</h3>
        <span className="job__code" title={career.code.map((type) => TYPE_NAMES[type]).join(', ')}>
          {career.code.join('')}
        </span>
      </div>
      <p className="job__summary">{career.summary}</p>
      <p className="job__route">
        <strong>How to get there: </strong>
        {career.route}
      </p>
    </article>
  )
}
