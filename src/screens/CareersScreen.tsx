import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '../components/PageShell'
import { useAuth } from '../auth/AuthProvider'
import { myResult } from '../auth/api'
import { CAREERS, TYPE_NAMES } from '../../shared/careers'
import { careerFit, RIASEC_ORDER, type TestResult } from '../../shared/scoring'
import type { RiasecType } from '../../shared/test'
import { JobCard } from './reportParts'
import './CareerTab.css'
import './test.css'

type Filter = 'fit' | 'all' | RiasecType

/** Every career in the app. With a result, sorted by fit; otherwise filterable by type. */
export default function CareersScreen() {
  const { session } = useAuth()
  const [result, setResult] = useState<TestResult | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    if (!session) return
    myResult(session.token)
      .then(({ result }) => {
        setResult(result)
        if (result) setFilter('fit')
      })
      .catch(() => {})
  }, [session])

  const shown = useMemo(() => {
    if (filter === 'fit' && result) {
      return [...CAREERS].sort((a, b) => careerFit(b, result.interests) - careerFit(a, result.interests))
    }
    if (filter === 'all' || filter === 'fit') return CAREERS
    return CAREERS.filter((career) => career.code.includes(filter))
  }, [filter, result])

  const topIds = new Set(result?.matches.map((match) => match.id))

  return (
    <PageShell title="Explore careers" backTo="/student">
      <div className="chips" role="tablist" aria-label="Show careers">
        {result && (
          <button type="button" role="tab" aria-selected={filter === 'fit'} className={`chip${filter === 'fit' ? ' chip--active' : ''}`} onClick={() => setFilter('fit')}>
            Best fit for me
          </button>
        )}
        <button type="button" role="tab" aria-selected={filter === 'all'} className={`chip${filter === 'all' ? ' chip--active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        {RIASEC_ORDER.map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={filter === type}
            className={`chip${filter === type ? ' chip--active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {TYPE_NAMES[type]}
          </button>
        ))}
      </div>

      <div className="report-section">
        {shown.map((career) => (
          <JobCard key={career.id} career={career} match={topIds.has(career.id)} />
        ))}
      </div>

      <p className="report-fineprint">
        Routes shown are the common ones. Check current eligibility for a course or exam with your teacher or the
        official website before deciding.
      </p>
    </PageShell>
  )
}
