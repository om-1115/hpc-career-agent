import { useEffect, useState } from 'react'
import type { Session } from '../auth/AuthProvider'
import { addReflection, describeError, passbook, type PassbookEntry } from '../auth/api'
import { SectionHeader } from '../components/SectionHeader'
import { TYPE_COPY } from '../../shared/report'
import { careerById } from './reportParts'
import './CareerTab.css'
import './test.css'

const MAX = 500
const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const careerTitles = (ids: string[]) => ids.map((id) => careerById(id)?.title ?? id).join(', ')

/**
 * The career passbook: like a bank passbook records every deposit, it records
 * every step of a student's career journey — each test, each plan and their
 * own reflections — so they can look back from Class 9 to 12 and see how they
 * have grown.
 */
export function Passbook({ session }: { session: Session }) {
  const [entries, setEntries] = useState<PassbookEntry[] | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    passbook(session.token)
      .then(({ entries }) => setEntries(entries))
      .catch(() => setEntries([]))
  }, [session.token])

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const { entry } = await addReflection(session.token, draft.trim())
      setEntries((current) => [entry, ...(current ?? [])])
      setDraft('')
    } catch (cause) {
      setError(describeError(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="screen__section">
      <SectionHeader title="Your career passbook" />
      <p className="passbook__intro">
        Every test, plan and reflection — your journey from Class 9 to 12, in one place. Look back and see how you’ve
        grown.
      </p>

      <div className="passbook__compose">
        <label htmlFor="reflection" className="career-report__label">
          Add a reflection
        </label>
        <textarea
          id="reflection"
          className="passbook__input"
          rows={3}
          maxLength={MAX}
          placeholder="What have you learnt about yourself lately? What do you enjoy more — or less — than before?"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="passbook__compose-row">
          <span className="passbook__count">{draft.length}/{MAX}</span>
          <button type="button" className="chip chip--active" disabled={busy || !draft.trim()} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Add to passbook'}
          </button>
        </div>
        {error && <p className="test-error">{error}</p>}
      </div>

      {entries === null && <div className="career-empty career-empty--loading">Loading…</div>}
      {entries?.length === 0 && (
        <div className="career-empty">
          <span className="career-empty__emoji" aria-hidden="true">📒</span>
          <p className="career-empty__title">Your passbook starts here</p>
          <p className="career-empty__body">Take the psychometric test or write your first reflection to begin your journey.</p>
        </div>
      )}
      {entries && entries.length > 0 && (
        <ol className="passbook__timeline">
          {entries.map((entry, index) => (
            <li key={`${entry.type}-${entry.at}-${index}`} className={`passbook__entry passbook__entry--${entry.type}`}>
              <span className="passbook__dot" aria-hidden="true">
                {entry.type === 'test' ? '🧠' : entry.type === 'plan' ? '🧭' : '✍️'}
              </span>
              <div className="passbook__body">
                <p className="passbook__meta">
                  {date(entry.at)} · {entry.type === 'test' ? 'Psychometric test' : entry.type === 'plan' ? 'Plan saved' : entry.source ? `Reflection · ${entry.source} survey` : 'Reflection'}
                </p>
                {entry.type === 'test' && (
                  <>
                    <p className="passbook__title">{entry.code.map((type) => TYPE_COPY[type].short).join(' · ')} <span className="job__code">{entry.code.join('')}</span></p>
                    <p className="passbook__detail">Top careers: {careerTitles(entry.careerIds)}</p>
                  </>
                )}
                {entry.type === 'plan' && (
                  <>
                    <p className="passbook__title">{entry.summary}</p>
                    <ul className="passbook__steps">
                      {entry.nextSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </>
                )}
                {entry.type === 'reflection' && <p className="passbook__quote">“{entry.text}”</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
