import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { useAuth } from '../auth/AuthProvider'
import { ApiError, describeError, submitAnswers } from '../auth/api'
import { ALL_ITEMS, INTEREST_ITEMS, INTEREST_SCALE, PERSONALITY_ITEMS, PERSONALITY_SCALE, type Answers } from '../../shared/test'
import './CareerTab.css'
import './test.css'

/** The unfinished test, kept for this tab so a reload or a phone call costs nothing. */
const DRAFT_KEY = 'hpc_test_draft'

type Step = { kind: 'intro'; section: 'interest' | 'personality' } | { kind: 'item'; index: number } | { kind: 'review' }

const STEPS: Step[] = [
  { kind: 'intro', section: 'interest' },
  ...INTEREST_ITEMS.map((_, index) => ({ kind: 'item' as const, index })),
  { kind: 'intro', section: 'personality' },
  ...PERSONALITY_ITEMS.map((_, index) => ({ kind: 'item' as const, index: INTEREST_ITEMS.length + index })),
  { kind: 'review' },
]

function loadDraft(): { answers: Answers; step: number } {
  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null') as { answers: Answers; step: number } | null
    if (draft && typeof draft.step === 'number' && draft.answers) return draft
  } catch {
    /* no draft */
  }
  return { answers: {}, step: 0 }
}

/**
 * The psychometric test: an intro, the 36 interest items, an intro, the 20
 * personality items, then a review. One question per screen; choosing an
 * answer moves on. Nothing is scored here — the answers go to the server.
 */
export default function TestScreen() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [{ answers, step }, setDraft] = useState(loadDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, step }))
    } catch {
      /* memory only */
    }
  }, [answers, step])

  const current = STEPS[step]
  const answered = Object.keys(answers).length
  const missing = useMemo(() => ALL_ITEMS.filter((item) => answers[item.id] === undefined), [answers])

  const go = (next: number) => setDraft((draft) => ({ ...draft, step: Math.max(0, Math.min(STEPS.length - 1, next)) }))

  const choose = (itemId: string, value: number) => {
    setDraft((draft) => ({ answers: { ...draft.answers, [itemId]: value }, step: draft.step }))
    // A beat to see the choice land, then on to the next question.
    window.setTimeout(() => go(step + 1), 180)
  }

  const submit = async () => {
    if (!session) return
    setBusy(true)
    setError(null)
    try {
      await submitAnswers(session.token, answers)
      sessionStorage.removeItem(DRAFT_KEY)
      navigate('/student/report', { replace: true })
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) return signOut('Your session ended. Choose your profile again — your answers were kept on this tab only until now.')
      setError(describeError(cause))
      setBusy(false)
    }
  }

  return (
    <PageShell
      title="Psychometric test"
      backTo="/student"
      progress={answered / ALL_ITEMS.length}
      footer={
        current.kind === 'item' ? (
          <>
            <button type="button" className="test-nav" onClick={() => go(step - 1)}>
              Back
            </button>
            <span className="test-count">
              {current.index + 1} of {ALL_ITEMS.length}
            </span>
            <button
              type="button"
              className="test-nav"
              disabled={answers[ALL_ITEMS[current.index].id] === undefined}
              onClick={() => go(step + 1)}
            >
              Next
            </button>
          </>
        ) : undefined
      }
    >
      {current.kind === 'intro' && current.section === 'interest' && (
        <Intro
          emoji="🧭"
          title="Part 1 · What you like doing"
          body="You’ll see 36 activities. For each one, choose how much you would like doing it. Don’t worry about whether you are good at it, or how much it pays — just how much you’d enjoy it."
          meta="About 6 minutes · No right or wrong answers"
          onStart={() => go(step + 1)}
        />
      )}

      {current.kind === 'intro' && current.section === 'personality' && (
        <Intro
          emoji="🪞"
          title="Part 2 · How you usually are"
          body="Now 20 short sentences. Choose how well each one describes you as you usually are — not how you’d like to be. Answer honestly; every kind of person suits some kind of work."
          meta="About 3 minutes"
          onStart={() => go(step + 1)}
        />
      )}

      {current.kind === 'item' && <Question index={current.index} value={answers[ALL_ITEMS[current.index].id]} onChoose={choose} />}

      {current.kind === 'review' && (
        <section className="test-card test-card--center">
          <span className="test-card__emoji" aria-hidden="true">
            {missing.length ? '📝' : '🎉'}
          </span>
          <h2 className="test-card__title">{missing.length ? 'A few questions left' : 'All done!'}</h2>
          <p className="test-card__body">
            {missing.length
              ? `You skipped ${missing.length} question${missing.length > 1 ? 's' : ''}. Answer ${missing.length > 1 ? 'them' : 'it'} to see your report.`
              : 'Send your answers to see your career report.'}
          </p>
          {error && (
            <p className="test-error" role="alert">
              {error}
            </p>
          )}
          {missing.length ? (
            <button
              type="button"
              className="career-button"
              onClick={() => go(STEPS.findIndex((s) => s.kind === 'item' && ALL_ITEMS[s.index].id === missing[0].id))}
            >
              Go to the first one
            </button>
          ) : (
            <button type="button" className="career-button" disabled={busy} onClick={() => void submit()}>
              {busy ? 'Working out your results…' : 'See my report'}
            </button>
          )}
          <button type="button" className="test-link" onClick={() => go(step - 1)}>
            Back to the last question
          </button>
        </section>
      )}
    </PageShell>
  )
}

function Intro({ emoji, title, body, meta, onStart }: { emoji: string; title: string; body: string; meta: string; onStart: () => void }) {
  return (
    <section className="test-card test-card--center">
      <span className="test-card__emoji" aria-hidden="true">
        {emoji}
      </span>
      <h2 className="test-card__title">{title}</h2>
      <p className="test-card__body">{body}</p>
      <p className="test-card__meta">{meta}</p>
      <button type="button" className="career-button" onClick={onStart}>
        Start
      </button>
    </section>
  )
}

function Question({ index, value, onChoose }: { index: number; value: number | undefined; onChoose: (id: string, value: number) => void }) {
  const item = ALL_ITEMS[index]

  if (item.section === 'interest') {
    return (
      <section className="test-card" aria-labelledby={`q-${item.id}`}>
        <p className="test-card__prompt">How much would you like to…</p>
        <span className="test-card__emoji test-card__emoji--big" aria-hidden="true">
          {item.emoji}
        </span>
        <h2 id={`q-${item.id}`} className="test-card__question">
          {item.text}?
        </h2>
        <div className="test-options" role="radiogroup" aria-labelledby={`q-${item.id}`}>
          {INTEREST_SCALE.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={value === option.value}
              className={`test-option${value === option.value ? ' test-option--chosen' : ''}`}
              onClick={() => onChoose(item.id, option.value)}
            >
              <span aria-hidden="true">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="test-card" aria-labelledby={`q-${item.id}`}>
      <p className="test-card__prompt">How well does this describe you?</p>
      <h2 id={`q-${item.id}`} className="test-card__question test-card__question--statement">
        “{item.text}”
      </h2>
      <div className="test-options" role="radiogroup" aria-labelledby={`q-${item.id}`}>
        {PERSONALITY_SCALE.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={`test-option${value === option.value ? ' test-option--chosen' : ''}`}
            onClick={() => onChoose(item.id, option.value)}
          >
            <span className="test-option__dot" aria-hidden="true" />
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )
}
