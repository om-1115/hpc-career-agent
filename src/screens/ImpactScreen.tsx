import { useEffect, useState } from 'react'
import { PageShell } from '../components/PageShell'
import { describeError, impact as fetchImpact } from '../auth/api'
import { useAppMode } from '../auth/useAppMode'
import type { Impact } from '../../shared/pilot'
import './test.css'
import './Survey.css'
import './Impact.css'

/**
 * The pilot's results, for anyone, no sign-in: how many students got through
 * each step and, once enough are paired, the before/after measures. Totals
 * only; the server holds back everything but counts below five paired students.
 */
export default function ImpactScreen() {
  const mode = useAppMode()
  const [data, setData] = useState<Impact | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchImpact()
      .then(setData)
      .catch((cause) => setError(describeError(cause)))
  }, [])

  const results = data?.results
  return (
    <PageShell title="Pilot results" backTo="/">
      <section className="impact-intro">
        <h2 className="impact-intro__title">Does HPC Career help?</h2>
        <p className="impact-intro__body">
          Students answer the same three questions before the psychometric test and again after reading their report, so each one is
          compared with themselves. These are the totals, live. No names, ever.
        </p>
        {mode === 'demo' && (
          <p className="impact-intro__note">This is the demo school, so there is nothing to measure here. A pilot runs on its own copy of the app.</p>
        )}
      </section>

      {error && (
        <p className="test-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p className="impact-muted">Loading…</p>}

      {data && (
        <>
          <dl className="impact-funnel" aria-label="How many students did each step">
            {[
              ['Students taking part', data.students],
              ['Answered the before questions', data.answeredBefore],
              ['Finished the psychometric test', data.finishedTest],
              ['Answered the after questions', data.answeredAfter],
              ['Did all three, in order', data.paired],
            ].map(([label, value]) => (
              <div key={label} className="impact-funnel__row">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {!results && (
            <p className="impact-muted">
              The before and after results appear once at least {data.minimum} students have done all three steps, so no one can be picked
              out of a small group.
            </p>
          )}

          {results && (
            <>
              <p className="survey-label">Before → after, {data.paired} students</p>
              <p className="impact-muted">Before the app, {results.hadGuidance}% said someone at school had talked with them about careers this year.</p>
              <ul className="impact-changes">
                <Change label="Careers they could write down" note="median per student" before={results.careersNamed.before} after={results.careersNamed.after} />
                <Change label="Know the steps to the work they want" before={results.knowsRoute.before} after={results.knowsRoute.after} unit="%" />
                <Change label="Sure about their Class 11 stream" note="average, 1 = not sure, 5 = very sure" before={results.streamSure.before} after={results.streamSure.after} />
              </ul>

              <p className="survey-label">About the report</p>
              <ul className="impact-changes">
                <li className="impact-stat">
                  <span className="impact-stat__value">{results.reportFitsWell}%</span>
                  <span className="impact-stat__label">say it describes them mostly or very well (average {results.reportFit} of 5)</span>
                </li>
                <li className="impact-stat">
                  <span className="impact-stat__value">{results.talkAtHome}%</span>
                  <span className="impact-stat__label">will show it or talk about it at home (yes or maybe)</span>
                </li>
              </ul>
            </>
          )}

          <p className="impact-muted">
            What students say about themselves, in one group, on the same day, with no comparison group — a first look, not proof.{' '}
            <a href="https://github.com/om-1115/hpc-career-agent/tree/main/docs/pilot">How it is measured</a>
          </p>
        </>
      )}
    </PageShell>
  )
}

function Change({ label, note, before, after, unit = '' }: { label: string; note?: string; before: number; after: number; unit?: string }) {
  return (
    <li className="impact-change">
      <span className="impact-change__label">
        {label}
        {note && <span className="impact-change__note">{note}</span>}
      </span>
      <span className="impact-change__values" aria-label={`before ${before}${unit}, after ${after}${unit}`}>
        <span className="impact-change__before">
          {before}
          {unit}
        </span>
        <span aria-hidden="true">→</span>
        <span className="impact-change__after">
          {after}
          {unit}
        </span>
      </span>
    </li>
  )
}
