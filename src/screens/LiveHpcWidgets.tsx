import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '../auth/AuthProvider'
import { addReflection, describeError, surveyStatus, type PassbookEntry } from '../auth/api'
import { SURVEYS } from '../../shared/surveys'
import { RIASEC_ORDER, type TestResult } from '../../shared/scoring'
import { TYPE_COPY } from '../../shared/report'
import { TYPE_NAMES } from '../../shared/careers'
import { project, reflectionPrompts } from '../data/liveHpc'

/** Pieces the Live HPC pages share: insights, to-do lists, and a few charts of their own. */

export type Insight = { icon: string; title: string; text: string }

/** A few pointers worth noticing, each with an icon and one sentence. */
export function Insights({ items }: { items: Insight[] }) {
  return (
    <section className="hpc-insights" aria-label="Insights">
      <p className="hpc-insights__label">Insights</p>
      <ul className="hpc-insights__list">
        {items.map((item) => (
          <li key={item.title} className="hpc-insight">
            <span className="hpc-insight__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="hpc-insight__body">
              <span className="hpc-insight__title">{item.title}</span>
              <span className="hpc-insight__text">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

type Item = { id: string; text: string; done?: boolean }

/**
 * A to-do list the student ticks off. Ticks are kept on this device only
 * (browser storage, per student and list) — a convenience, not a record.
 */
export function Checklist({ title, owner, listId, items }: { title: string; owner: string; listId: string; items: Item[] }) {
  const key = `hpc_todo:${owner}:${listId}`
  const [ticked, setTicked] = useState<Record<string, boolean>>(() => {
    const start = Object.fromEntries(items.map((item) => [item.id, Boolean(item.done)]))
    try {
      return { ...start, ...(JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, boolean>) }
    } catch {
      return start
    }
  })

  const toggle = (id: string) =>
    setTicked((current) => {
      const next = { ...current, [id]: !current[id] }
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* this page only */
      }
      return next
    })

  const done = items.filter((item) => ticked[item.id]).length
  return (
    <section className="hpc-todo">
      <div className="hpc-todo__head">
        <p className="hpc-todo__title">{title}</p>
        <span className="hpc-todo__count">
          {done} of {items.length} done
        </span>
      </div>
      <div className="hpc-todo__bar" aria-hidden="true">
        <span style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="hpc-todo__list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={Boolean(ticked[item.id])}
              className={`hpc-todo__item${ticked[item.id] ? ' hpc-todo__item--done' : ''}`}
              onClick={() => toggle(item.id)}
            >
              <span className="hpc-todo__box" aria-hidden="true">
                {ticked[item.id] ? '✓' : ''}
              </span>
              <span>{item.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The student's six interest scores from their psychometric test (their own data). */
export function InterestBars({ result }: { result: TestResult }) {
  const top = new Set(result.code)
  return (
    <ul className="hpc-interests" aria-label="Interest scores from your psychometric test">
      {[...RIASEC_ORDER]
        .sort((a, b) => result.interests[b] - result.interests[a])
        .map((type) => (
          <li key={type} className="hpc-interests__row">
            <span className={`hpc-interests__name${top.has(type) ? ' hpc-interests__name--top' : ''}`}>
              {TYPE_COPY[type].short}
              <span className="hpc-interests__type" title={TYPE_NAMES[type]}>
                {' '}
                · {type}
              </span>
            </span>
            <span className="hpc-interests__track" aria-hidden="true">
              <span className={top.has(type) ? 'hpc-interests__fill hpc-interests__fill--top' : 'hpc-interests__fill'} style={{ width: `${Math.max(2, result.interests[type])}%` }} />
            </span>
            <span className="hpc-interests__value">{result.interests[type]}</span>
          </li>
        ))}
    </ul>
  )
}

/** The project's stages, done → now → next. */
export function ProjectTimeline() {
  return (
    <ol className="hpc-timeline">
      {project.steps.map((step, index) => (
        <li key={step.name} className={`hpc-timeline__step hpc-timeline__step--${step.state}`}>
          <span className="hpc-timeline__dot" aria-hidden="true">
            {step.state === 'done' ? '✓' : index + 1}
          </span>
          <span className="hpc-timeline__body">
            <span className="hpc-timeline__name">
              {step.name}
              {step.state === 'now' && <span className="hpc-timeline__now">Now</span>}
            </span>
            <span className="hpc-timeline__detail">{step.detail}</span>
            <span className="hpc-timeline__date">{step.date}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Hours each group member has put in, the student's own bar picked out. */
export function ContributionChart() {
  const most = Math.max(...project.contributions.map((member) => member.hours))
  const total = project.contributions.reduce((sum, member) => sum + member.hours, 0)
  return (
    <figure className="hpc-chart">
      <figcaption className="hpc-chart__title">Who has put in what</figcaption>
      <p className="hpc-chart__note">Hours on the project so far · {total} hours in all</p>
      <ul className="hpc-hbars">
        {project.contributions.map((member) => (
          <li key={member.name} className="hpc-hbars__row">
            <span className={`hpc-hbars__name${member.name === 'You' ? ' hpc-hbars__name--you' : ''}`}>{member.name}</span>
            <span className="hpc-hbars__track" aria-hidden="true">
              <span className={`hpc-hbars__fill${member.name === 'You' ? ' hpc-hbars__fill--you' : ''}`} style={{ width: `${(member.hours / most) * 100}%` }} />
            </span>
            <span className="hpc-hbars__value">{member.hours} h</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/** The term's surveys as a to-do list, from the student's real progress. */
export function SurveyTodo({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [done, setDone] = useState<Record<string, { completedAt: string }> | null>(null)
  useEffect(() => {
    surveyStatus(session.token)
      .then(({ surveys }) => setDone(surveys))
      .catch(() => setDone({}))
  }, [session.token])
  const count = done ? SURVEYS.filter((survey) => done[survey.id]).length : 0
  return (
    <section className="hpc-todo">
      <div className="hpc-todo__head">
        <p className="hpc-todo__title">Surveys this term</p>
        <span className="hpc-todo__count">
          {count} of {SURVEYS.length} done
        </span>
      </div>
      <div className="hpc-todo__bar" aria-hidden="true">
        <span style={{ width: `${(count / SURVEYS.length) * 100}%` }} />
      </div>
      <ul className="hpc-todo__list">
        {SURVEYS.map((survey) => {
          const finished = done?.[survey.id]
          return (
            <li key={survey.id}>
              <button
                type="button"
                className={`hpc-todo__item${finished ? ' hpc-todo__item--done' : ''}`}
                onClick={() => navigate(`/student/survey/${survey.id}`)}
              >
                <span className="hpc-todo__box" aria-hidden="true">
                  {finished ? '✓' : ''}
                </span>
                <span className="hpc-todo__text">
                  <span>
                    <span className="hpc-todo__emoji" aria-hidden="true">
                      {survey.emoji}
                    </span>
                    {survey.title}
                  </span>
                  <span className="hpc-todo__meta">
                    {finished
                      ? `Done ${new Date(finished.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · tap to retake`
                      : `About ${survey.minutes} minutes · ends with a reflection`}
                  </span>
                </span>
                {!finished && (
                  <span className="hpc-todo__go" aria-hidden="true">
                    ›
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const MAX = 500

/** Write a reflection here and now; tap a starter if a blank box is hard. */
export function ReflectionComposer({ session, onSaved }: { session: Session; onSaved: (entry: Extract<PassbookEntry, { type: 'reflection' }>) => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const { entry } = await addReflection(session.token, text.trim())
      if (entry.type === 'reflection') onSaved(entry)
      setText('')
    } catch (cause) {
      setError(describeError(cause))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="hpc-compose">
      <label htmlFor="hpc-reflection" className="hpc-todo__title">
        Write a reflection
      </label>
      <div className="hpc-compose__prompts">
        {reflectionPrompts.map((prompt) => (
          <button key={prompt} type="button" className="hpc-compose__prompt" onClick={() => setText((current) => (current.trim() ? `${current.trim()} ${prompt}` : prompt))}>
            {prompt}
          </button>
        ))}
      </div>
      <textarea
        id="hpc-reflection"
        className="survey-text"
        rows={3}
        maxLength={MAX}
        placeholder="Tap a starter above, or write anything about your week."
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="hpc-compose__foot">
        <span className="survey-count">
          {text.length} / {MAX}
        </span>
        <button type="button" className="hpc-compose__save" disabled={busy || !text.trim()} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && (
        <p className="test-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
