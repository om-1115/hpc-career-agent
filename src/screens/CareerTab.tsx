import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, type Session } from '../auth/AuthProvider'
import { ApiError, myResult } from '../auth/api'
import { useChat } from '../chat/ChatProvider'
import { SectionHeader } from '../components/SectionHeader'
import { Badge } from '../components/Badge'
import type { TestResult } from '../../shared/scoring'
import { careerById, CodeLetters, InterestBars, TraitLevels } from './reportParts'
import { Passbook } from './Passbook'
import './CareerTab.css'
import './test.css'

/** The career journey on the student's profile: the test, a summary of the report, and where to go next. */
export function CareerTab({ session }: { session: Session }) {
  const { signOut } = useAuth()
  const { openChat } = useChat()
  const navigate = useNavigate()
  const [result, setResult] = useState<TestResult | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const inProgress = (() => {
    try {
      return Boolean(sessionStorage.getItem('hpc_test_draft'))
    } catch {
      return false
    }
  })()

  useEffect(() => {
    myResult(session.token)
      .then(({ result }) => setResult(result))
      .catch((cause) => {
        if (cause instanceof ApiError && cause.status === 401) return signOut('Your session ended. Choose your profile again.')
        setError('Couldn’t load your results. Check your connection and try again.')
      })
  }, [session.token, signOut])

  const status = result ? 'done' : inProgress ? 'started' : 'new'
  const test = {
    done: { badge: 'Completed', tone: 'green' as const, text: 'Done. Open your report any time.', cta: 'Report', to: '/student/report' },
    started: { badge: 'In progress', tone: 'orange' as const, text: 'Pick up where you left off.', cta: 'Continue', to: '/student/test' },
    new: { badge: 'Not started', tone: 'neutral' as const, text: '56 quick questions, about 10 minutes. No right answers.', cta: 'Start', to: '/student/test' },
  }[status]

  return (
    <>
      <section className="screen__section">
        <SectionHeader title="Career test" />
        <button type="button" className="career-card career-card--test" onClick={() => navigate(test.to)}>
          <span className="career-card__emoji" aria-hidden="true">🧠</span>
          <span className="career-card__body">
            <span className="career-card__heading">
              <span className="career-card__title">Interests &amp; personality</span>
              {result !== undefined && <Badge tone={test.tone}>{test.badge}</Badge>}
            </span>
            <span className="career-card__description">{test.text}</span>
          </span>
          <span className="career-card__cta">{test.cta}</span>
        </button>
        {error && <p className="career-note career-note--error" role="alert">{error}</p>}
      </section>

      <section className="screen__section">
        <SectionHeader title="Your career profile" action={result ? { label: 'Full report', onClick: () => navigate('/student/report') } : undefined} />
        {result === undefined && !error && <div className="career-empty career-empty--loading">Loading…</div>}
        {result === null && (
          <div className="career-empty">
            <span className="career-empty__emoji" aria-hidden="true">🔒</span>
            <p className="career-empty__title">Finish the test to unlock your profile</p>
            <p className="career-empty__body">See what kind of work fits your interests and personality, and careers to explore.</p>
          </div>
        )}
        {result && (
          <div className="career-report">
            <div>
              <p className="career-report__label">Your interest code</p>
              <CodeLetters result={result} />
            </div>
            <div>
              <p className="career-report__label">Interests</p>
              <InterestBars result={result} />
            </div>
            <div>
              <p className="career-report__label">Personality</p>
              <TraitLevels result={result} />
            </div>
            <div>
              <p className="career-report__label">Top careers for you</p>
              <ol className="career-tracks">
                {result.matches.slice(0, 3).map(({ id }) => {
                  const career = careerById(id)
                  return career ? (
                    <li key={id}>
                      <span className="career-tracks__title">{career.emoji} {career.title}</span>
                      <span className="career-tracks__subtitle">{career.summary}</span>
                    </li>
                  ) : null
                })}
              </ol>
            </div>
            <button type="button" className="career-button" onClick={() => navigate('/student/report')}>
              Open full report
            </button>
          </div>
        )}
      </section>

      <Passbook session={session} />

      <section className="screen__section">
        <SectionHeader title="Explore" />
        <div className="screen__list">
          <button type="button" className="career-row" onClick={() => navigate('/student/careers')}>
            <span className="career-card__emoji" aria-hidden="true">🧭</span>
            <span className="career-card__body">
              <span className="career-card__title">Explore careers</span>
              <span className="career-card__description">36 jobs and how to get there from Class 10</span>
            </span>
          </button>
          <button type="button" className="career-row" onClick={openChat}>
            <span className="career-card__emoji" aria-hidden="true">💬</span>
            <span className="career-card__body">
              <span className="career-card__title">Talk to the counsellor</span>
              <span className="career-card__description">Subjects, streams, skills and what’s next</span>
            </span>
          </button>
        </div>
      </section>
    </>
  )
}
