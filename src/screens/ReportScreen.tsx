import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { useAuth } from '../auth/AuthProvider'
import { ApiError, clearResult, describeError, myResult } from '../auth/api'
import { useChat } from '../chat/ChatProvider'
import { TYPE_NAMES } from '../../shared/careers'
import { nextSteps, TYPE_COPY } from '../../shared/report'
import type { TestResult } from '../../shared/scoring'
import { careerById, CodeLetters, InterestBars, JobCard, TraitLevels } from './reportParts'
import './CareerTab.css'
import './test.css'

/** The student's full career report, read back from the server. Printable for parents. */
export default function ReportScreen() {
  const { session, signOut } = useAuth()
  const { openChat } = useChat()
  const navigate = useNavigate()
  const [result, setResult] = useState<TestResult | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [confirmRetake, setConfirmRetake] = useState(false)

  useEffect(() => {
    if (!session) return
    myResult(session.token)
      .then(({ result }) => setResult(result))
      .catch((cause) => {
        if (cause instanceof ApiError && cause.status === 401) return signOut('Your session ended. Choose your profile again.')
        setError(describeError(cause))
      })
  }, [session, signOut])

  const retake = async () => {
    if (!session) return
    try {
      await clearResult(session.token)
      navigate('/student/test', { replace: true })
    } catch (cause) {
      setConfirmRetake(false)
      setError(describeError(cause))
    }
  }

  if (!session) return null
  const [first, second] = result?.code ?? []

  return (
    <PageShell title="Your career report" backTo="/student">
      {error && <p className="test-error">{error}</p>}
      {result === undefined && !error && <div className="career-empty career-empty--loading">Loading your report…</div>}

      {result === null && (
        <section className="test-card test-card--center">
          <span className="test-card__emoji" aria-hidden="true">🔒</span>
          <h2 className="test-card__title">No report yet</h2>
          <p className="test-card__body">Take the career test and your report will appear here.</p>
          <Link className="career-button" to="/student/test" style={{ display: 'grid', placeItems: 'center' }}>
            Take the test
          </Link>
        </section>
      )}

      {result && (
        <>
          <section className="report-hero">
            <p className="report-hero__eyebrow">
              {session.name} · {new Date(result.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="report-hero__title">
              You’re a {TYPE_COPY[first].short} and a {TYPE_COPY[second].short}
            </h2>
            <p className="report-hero__body">
              You most enjoy {TYPE_COPY[first].enjoys}, and also {TYPE_COPY[second].enjoys}.
            </p>
            <CodeLetters result={result} />
          </section>

          {(result.sameAnswerThroughout || result.broad) && (
            <p className="report-notice">
              {result.sameAnswerThroughout
                ? 'You chose the same answer for every question, so this report may not reflect you. Consider taking the test again.'
                : 'Your interests are spread quite evenly — no single area stands out. That keeps lots of options open.'}
            </p>
          )}

          <section className="report-section">
            <p className="career-report__label">What you like doing</p>
            <InterestBars result={result} />
            <p className="report-fineprint">
              Your interest code is {result.code.map((type) => TYPE_NAMES[type]).join(', ')} — your three strongest
              areas, based on Holland’s RIASEC model.
            </p>
          </section>

          <section className="report-section">
            <p className="career-report__label">How you usually are</p>
            <TraitLevels result={result} withCopy />
          </section>

          <section className="report-section">
            <p className="career-report__label">Careers that fit your interests</p>
            {result.matches.map(({ id }) => {
              const career = careerById(id)
              return career ? <JobCard key={id} career={career} match /> : null
            })}
            <Link className="test-link no-print" to="/student/careers">
              Explore all careers →
            </Link>
          </section>

          <section className="report-section">
            <p className="career-report__label">What to do next</p>
            <ol className="report-steps">
              {nextSteps(result).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="report-section no-print">
            <button type="button" className="career-button" onClick={() => window.print()}>
              Print or save as PDF
            </button>
            <button type="button" className="dialog__cancel" onClick={openChat}>
              Talk to the counsellor
            </button>
            <button type="button" className="test-link" onClick={() => setConfirmRetake(true)}>
              Take the test again
            </button>
          </div>

          <p className="report-fineprint">
            This report is a starting point for a conversation, not a diagnosis. The interest questions were written for
            this app and are not a validated test; the personality questions are the Mini-IPIP (public domain). Scores show
            more or less for you, not a comparison with other students.
          </p>
        </>
      )}

      {confirmRetake && (
        <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="retake-title">
          <div className="dialog__panel">
            <h2 id="retake-title" className="dialog__title">Take the test again?</h2>
            <p className="dialog__body">This report will be replaced by your new answers.</p>
            <div className="dialog__actions">
              <button type="button" className="dialog__cancel" onClick={() => setConfirmRetake(false)}>
                Keep this report
              </button>
              <button type="button" className="career-button" style={{ marginTop: 0 }} onClick={() => void retake()}>
                Start again
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
