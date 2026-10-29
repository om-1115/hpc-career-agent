import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '../auth/AuthProvider'
import { myResult, surveyStatus } from '../auth/api'
import './LiveHpc.css'

type Status = { before: boolean; test: boolean; after: boolean }

/**
 * A pilot's three steps, in order, on the student's Home: the before
 * questions, the psychometric test and report, then the after questions.
 * Each opens only when the one before it is done, so "before" really is
 * before (docs/pilot/session-plan.md).
 */
export function PilotSteps({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    Promise.all([surveyStatus(session.token), myResult(session.token)])
      .then(([{ surveys }, { result }]) => setStatus({ before: Boolean(surveys['pilot-before']), test: Boolean(result), after: Boolean(surveys['pilot-after']) }))
      .catch(() => setStatus({ before: false, test: false, after: false }))
  }, [session.token])

  const steps = [
    { id: 'before', done: status?.before, open: true, title: 'Before you start', meta: '4 questions · about 3 minutes', to: '/student/survey/pilot-before' },
    { id: 'test', done: status?.test, open: status?.before, title: 'Psychometric test and your report', meta: '56 questions · about 10 minutes, then read your report', to: status?.test ? '/student/report' : '/student/test' },
    { id: 'after', done: status?.after, open: status?.before && status?.test, title: 'After your report', meta: '6 questions · about 4 minutes', to: '/student/survey/pilot-after' },
  ]
  const count = steps.filter((step) => step.done).length

  return (
    <section className="hpc-todo" aria-label="Today’s pilot steps">
      <div className="hpc-todo__head">
        <p className="hpc-todo__title">Today’s steps</p>
        <span className="hpc-todo__count">
          {count} of {steps.length} done
        </span>
      </div>
      <div className="hpc-todo__bar" aria-hidden="true">
        <span style={{ width: `${(count / steps.length) * 100}%` }} />
      </div>
      <ol className="hpc-todo__list">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              className={`hpc-todo__item${step.done ? ' hpc-todo__item--done' : ''}${step.open ? '' : ' hpc-todo__item--locked'}`}
              disabled={!status || !step.open || (step.done && step.id !== 'test')}
              onClick={() => navigate(step.to)}
            >
              <span className="hpc-todo__box" aria-hidden="true">
                {step.done ? '✓' : ''}
              </span>
              <span className="hpc-todo__text">
                <span>
                  {index + 1}. {step.title}
                </span>
                <span className="hpc-todo__meta">
                  {step.done ? (step.id === 'test' ? 'Done · tap to read your report again' : 'Done · thank you') : step.open ? step.meta : `After step ${index}`}
                </span>
              </span>
              {step.open && !step.done && (
                <span className="hpc-todo__go" aria-hidden="true">
                  ›
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
      {count === steps.length && <p className="hpc-todo__meta">All three done. Thank you for helping make HPC Career better!</p>}
    </section>
  )
}
