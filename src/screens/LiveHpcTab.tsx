import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '../auth/AuthProvider'
import { myResult, passbook, type PassbookEntry } from '../auth/api'
import { TYPE_COPY } from '../../shared/report'
import type { TestResult } from '../../shared/scoring'
import { activities, attendance, ATTENDANCE_NEEDED, attendanceByMonth, competencies, daysPresent, LEVELS, project, schoolDays, TERM, type Competency } from '../data/liveHpc'
import { ActivitiesChart, AttendanceChart, GrowthChart, ViewsChart, ViewsRow } from './LiveHpcCharts'
import { Checklist, ContributionChart, InterestBars, Insights, ProjectTimeline, ReflectionComposer, SurveyTodo, type Insight } from './LiveHpcWidgets'
import './LiveHpc.css'
import './Survey.css'

type View = 'record' | 'about' | 'said' | 'projects' | 'growing' | `competency:${string}`

const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const step = (competency: Competency) => LEVELS.indexOf(competency.level) + 1
const grewBy = (competency: Competency) => competency.history[competency.history.length - 1].step - competency.history[0].step
const percent = (month: (typeof attendanceByMonth)[number]) => Math.round((month.present / month.days) * 100)
const names = (items: Competency[]) => {
  const all = items.map((item) => item.name)
  return all.length < 2 ? (all[0] ?? '') : `${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}`
}
/** How the student's own rating compares with their group's and teacher's: + means they rate themselves higher. */
const selfGap = (competency: Competency) => competency.views.self - (competency.views.peers + competency.views.teacher) / 2

function attendanceInsights(): Insight[] {
  const sorted = [...attendanceByMonth].sort((a, b) => percent(b) - percent(a))
  const overall = Math.round((daysPresent / schoolDays) * 100)
  return [
    { icon: '📅', title: `${overall}% this term`, text: `${overall - ATTENDANCE_NEEDED} points above the ${ATTENDANCE_NEEDED}% most boards ask for.` },
    { icon: '⭐', title: `Best month: ${sorted[0].month}`, text: `${percent(sorted[0])}% — ${sorted[0].present} of ${sorted[0].days} days.` },
    { icon: '🔎', title: `Lowest month: ${sorted[sorted.length - 1].month}`, text: `${percent(sorted[sorted.length - 1])}%. ${sorted[sorted.length - 1].days - sorted[sorted.length - 1].present} days missed — worth checking you caught up.` },
  ]
}

function growthInsights(): Insight[] {
  const best = Math.max(...competencies.map(step))
  const fastest = Math.max(...competencies.map(grewBy))
  const gap = [...competencies].sort((a, b) => Math.abs(selfGap(b)) - Math.abs(selfGap(a)))[0]
  return [
    { icon: '💪', title: 'Your strengths', text: `${names(competencies.filter((item) => step(item) === best))} — ${LEVELS[best - 1]} now.` },
    {
      icon: '📈',
      title: 'Growing fastest',
      text: `${names(competencies.filter((item) => grewBy(item) === fastest))}: up ${fastest === 1 ? 'a full step' : `${fastest} steps`} since last year.`,
    },
    selfGap(gap) > 0
      ? { icon: '💬', title: 'Worth a conversation', text: `You rate your ${gap.name.toLowerCase()} higher than your group and teacher do. Ask your teacher what the next step would look like.` }
      : { icon: '🌱', title: 'Better than you think', text: `Your group and teacher rate your ${gap.name.toLowerCase()} higher than you do.` },
  ]
}

function competencyInsights(competency: Competency): Insight[] {
  const gap = selfGap(competency)
  const views: Insight =
    gap === 0
      ? { icon: '🤝', title: 'Everyone agrees', text: `You, your group and your teacher all see ${competency.level.toLowerCase()} ${competency.name.toLowerCase()}.` }
      : gap > 0
        ? { icon: '💬', title: 'You see it higher', text: 'You rate yourself above how your group and teacher see you. Ask them for one example of the next step.' }
        : { icon: '🌱', title: 'Others see it higher', text: 'Your group and teacher rate you higher than you rate yourself. Trust the evidence.' }
  const next = step(competency) < LEVELS.length ? LEVELS[step(competency)] : null
  return [
    views,
    {
      icon: '📈',
      title: grewBy(competency) >= 1 ? `Up ${grewBy(competency) === 1 ? 'a step' : `${grewBy(competency)} steps`} since last year` : grewBy(competency) > 0 ? 'Growing since last year' : 'Holding steady',
      text: competency.trend,
    },
    ...(next ? [{ icon: '🎯', title: `Next: ${next}`, text: 'The tips below are small ways to get there this month.' }] : []),
  ]
}

/**
 * The student's live Holistic Progress Card (Figma "Student · My Record"):
 * parts A–F of the term so far, and how each competency is growing.
 */
export function LiveHpcTab({ session, onOpenCareer }: { session: Session; onOpenCareer: () => void }) {
  const [view, setView] = useState<View>('record')
  const [result, setResult] = useState<TestResult | null | undefined>(undefined)
  const [reflections, setReflections] = useState<Extract<PassbookEntry, { type: 'reflection' }>[] | null>(null)

  useEffect(() => {
    myResult(session.token)
      .then(({ result }) => setResult(result))
      .catch(() => setResult(null))
    passbook(session.token)
      .then(({ entries }) => setReflections(entries.filter((entry) => entry.type === 'reflection')))
      .catch(() => setReflections([]))
  }, [session.token])

  const back = () => setView(view.startsWith('competency:') ? 'growing' : 'record')
  const interestCode = result ? result.code.map((type) => TYPE_COPY[type].short).join(' · ') : null

  if (view === 'about') {
    return (
      <Detail title="About me" subtitle="Part A" onBack={back}>
        <Panel label="Interests">
          {interestCode ? (
            <p className="hpc-record__panel-text">
              From your psychometric test: <strong>{interestCode}</strong>.
            </p>
          ) : (
            <p className="hpc-record__panel-text">Take the psychometric test to add your interests here.</p>
          )}
          <button type="button" className="hpc-record__link" onClick={onOpenCareer}>
            {interestCode ? 'See your career profile' : 'Take the psychometric test'}
          </button>
        </Panel>
        {result && <InterestBars result={result} />}
        <Insights items={attendanceInsights()} />
        <Panel label="Attendance">
          <p className="hpc-record__panel-text">{attendance}</p>
        </Panel>
        <AttendanceChart />
        <ActivitiesChart />
        <Checklist
          title="To do"
          owner={session.code}
          listId="about"
          items={[
            ...(result ? [] : [{ id: 'test', text: 'Take the psychometric test to add your interests' }]),
            { id: 'attendance', text: `Keep attendance above 90% in November` },
            { id: 'activity', text: 'Try one new club or activity this term' },
            { id: 'share', text: 'Show this page to someone at home' },
          ]}
        />
      </Detail>
    )
  }

  if (view === 'said') {
    return (
      <Detail title="What I said" subtitle="Part B · your reflections" onBack={back}>
        {reflections && (
          <Insights
            items={[
              { icon: '✍️', title: `${reflections.length} reflection${reflections.length === 1 ? '' : 's'}`, text: reflections.length ? `The latest on ${date(reflections[0].at)}.` : 'Your first one can be a single sentence.' },
              {
                icon: '📋',
                title: `${reflections.filter((reflection) => reflection.source).length} from surveys`,
                text: 'Each survey ends with a reflection written from your answers, which you can edit.',
              },
            ]}
          />
        )}
        <ReflectionComposer session={session} onSaved={(entry) => setReflections((current) => [entry, ...(current ?? [])])} />
        <SurveyTodo session={session} />
        <p className="hpc-record__eyebrow">Your reflections</p>
        {reflections?.length ? (
          <ul className="hpc-record__sources">
            {reflections.map((reflection) => (
              <li key={reflection.at} className="hpc-record__source hpc-record__source--text">
                <span className="hpc-record__source-title">{reflection.text}</span>
                <span className="hpc-record__source-meta">
                  {reflection.source ? `${reflection.source} survey · ` : ''}
                  {date(reflection.at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hpc-record__panel-text">No reflections yet this term. Each survey on your Home screen ends with one, or write a short note in your passbook.</p>
        )}
        <button type="button" className="hpc-record__link" onClick={onOpenCareer}>
          See them all in your career passbook
        </button>
      </Detail>
    )
  }

  if (view === 'projects') {
    return (
      <Detail title="My projects" subtitle="Part C" onBack={back}>
        <Panel label={project.title}>
          <p className="hpc-record__panel-text">{project.question}</p>
          <Steps step={project.stage} of={project.stages} tone="action" />
          <p className="hpc-record__panel-text">
            Stage {project.stage} of {project.stages} · {project.role} · {project.group}
          </p>
        </Panel>
        <Insights
          items={[
            { icon: '⏳', title: `Next deadline: ${project.steps[project.stage - 1].date.replace('Due ', '')}`, text: `${project.steps[project.stage - 1].name} — ${project.steps[project.stage - 1].detail.toLowerCase()}.` },
            (() => {
              const total = project.contributions.reduce((sum, member) => sum + member.hours, 0)
              const mine = project.contributions.find((member) => member.name === 'You')!.hours
              return { icon: '🤝', title: `${Math.round((mine / total) * 100)}% of the group’s hours`, text: `${mine} of ${total} hours — a fair share for a group of ${project.contributions.length}.` }
            })(),
            { icon: '📝', title: `Your role: ${project.role}`, text: 'You keep the group’s readings in one place, so everyone works from the same numbers.' },
          ]}
        />
        <ProjectTimeline />
        <Checklist title="My tasks" owner={session.code} listId="project" items={project.tasks} />
        <ContributionChart />
      </Detail>
    )
  }

  if (view === 'growing') {
    return (
      <Detail title="How I'm growing" subtitle="Part D · 4 competencies" onBack={back}>
        <Insights items={growthInsights()} />
        <p className="hpc-record__eyebrow">Tap one to see more</p>
        <div className="hpc-record__list">
          {competencies.map((competency) => (
            <button
              key={competency.id}
              type="button"
              className="hpc-record__competency"
              onClick={() => setView(`competency:${competency.id}`)}
            >
              <span className="hpc-record__competency-head">
                <span className="hpc-record__competency-name">{competency.name}</span>
                <span className={`hpc-record__level hpc-record__level--${competency.level.toLowerCase()}`}>
                  {competency.level}
                </span>
              </span>
              <Steps step={step(competency)} of={LEVELS.length} tone={competency.level === 'Developing' ? 'warning' : 'success'} />
            </button>
          ))}
        </div>
        <GrowthChart rows={competencies} />
        <ViewsChart rows={competencies} />
        <Checklist
          title="This month’s focus"
          owner={session.code}
          listId="growing"
          items={competencies
            .filter((item) => item.level === 'Developing' || item.level === 'Beginning')
            .flatMap((item) => item.tips.slice(0, 2).map((tip, index) => ({ id: `${item.id}-${index}`, text: `${item.name}: ${tip}` })))}
        />
        <Note />
      </Detail>
    )
  }

  if (view.startsWith('competency:')) {
    const competency = competencies.find((item) => `competency:${item.id}` === view)
    if (!competency) return null
    return (
      <Detail title={competency.name} subtitle="Part D · how I'm growing" onBack={back}>
        <Insights items={competencyInsights(competency)} />
        <p className="hpc-record__eyebrow">Right now</p>
        <div className="hpc-record__panel">
          <div className="hpc-record__now-head">
            <span className={`hpc-record__now-level hpc-record__now-level--${competency.level.toLowerCase()}`}>
              {competency.level}
            </span>
            <span className="hpc-record__step-chip">
              Step {step(competency)}/{LEVELS.length}
            </span>
          </div>
          <Steps step={step(competency)} of={LEVELS.length} tone={competency.level === 'Developing' ? 'warning' : 'success'} />
          <p className="hpc-record__panel-text">{competency.now}</p>
        </div>

        <p className="hpc-record__eyebrow">How others see it</p>
        <div className="hpc-record__panel">
          <ViewsRow competency={competency} />
        </div>

        <p className="hpc-record__eyebrow">Over time</p>
        <div className="hpc-record__panel">
          <div className="hpc-record__chart" role="img" aria-label={`${competency.name} over three terms: ${competency.trend}`}>
            {competency.history.map((term, index) => {
              const latest = index === competency.history.length - 1
              return (
                <div key={term.term} className="hpc-record__bar-col">
                  <div className="hpc-record__bar-track">
                    <div
                      className={`hpc-record__bar${latest ? ' hpc-record__bar--latest' : ''}`}
                      style={{ height: `${(term.step / LEVELS.length) * 100}%` }}
                    />
                  </div>
                  <span className={`hpc-record__bar-label${latest ? ' hpc-record__bar-label--latest' : ''}`}>
                    {term.term}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="hpc-record__panel-text hpc-record__trend">{competency.trend}</p>
        </div>

        <Checklist
          title="Try this month"
          owner={session.code}
          listId={`tips-${competency.id}`}
          items={competency.tips.map((tip, index) => ({ id: String(index), text: tip }))}
        />

        <p className="hpc-record__eyebrow">Where this comes from · {competency.sources.length}</p>
        <ul className="hpc-record__sources">
          {competency.sources.map((source) => (
            <li key={source.title + source.date} className="hpc-record__source">
              <span className="hpc-record__source-title">{source.title}</span>
              <span className="hpc-record__source-meta">
                {source.who} · {source.date}
              </span>
            </li>
          ))}
        </ul>
      </Detail>
    )
  }

  const toWrite = reflections !== null && reflections.length === 0
  return (
    <div className="hpc-record">
      <p className="screen__greeting">Your progress card</p>
      <p className="hpc-record__term">{TERM}</p>

      <div className="hpc-tiles">
        <Tile value={`${Math.round((daysPresent / schoolDays) * 100)}%`} label="Attendance" detail={`${daysPresent} of ${schoolDays} days`} />
        <Tile
          value={`${competencies.filter((competency) => competency.level === 'Proficient' || competency.level === 'Advanced').length} of ${competencies.length}`}
          label="Competencies proficient"
          detail={`${competencies.filter((competency) => competency.history[competency.history.length - 1].step > competency.history[0].step).length} grew since last year`}
        />
        <Tile value={`${project.stage} of ${project.stages}`} label="Project stage" detail={project.title} />
        <Tile value={`${activities.reduce((sum, activity) => sum + activity.hours, 0)} h`} label="Beyond the classroom" detail={`${activities.length} activities`} />
      </div>

      <div className="hpc-record__list">
        <Part letter="A" title="About me" detail="Interests, attendance" onClick={() => setView('about')} />
        <Part
          letter="B"
          title="What I said"
          detail={
            toWrite
              ? '1 reflection to write'
              : reflections
                ? `${reflections.length} reflection${reflections.length === 1 ? '' : 's'}`
                : 'Your reflections'
          }
          tone={toWrite ? 'warning' : undefined}
          onClick={() => setView('said')}
        />
        <Part
          letter="C"
          title="My projects"
          detail={`1 project · Stage ${project.stage} of ${project.stages}`}
          onClick={() => setView('projects')}
        />
        <Part letter="D" title="How I'm growing" detail="4 competencies" tone="active" onClick={() => setView('growing')} />
        <Part letter="E" title="What my teacher said" detail="Not recorded yet" />
        <Part letter="F" title="Summary" detail="Ready when the term closes" />
      </div>

      <Note />

      <h2 className="hpc-record__section">Your term in charts</h2>
      <p className="hpc-record__sample">Sample data for the demo school.</p>
      <AttendanceChart />
      <GrowthChart rows={competencies} />
      <ViewsChart rows={competencies} />
      <ActivitiesChart />
    </div>
  )
}

function Part({
  letter,
  title,
  detail,
  tone,
  onClick,
}: {
  letter: string
  title: string
  detail: string
  tone?: 'warning' | 'active'
  onClick?: () => void
}) {
  const className = ['hpc-record__part', tone && `hpc-record__part--${tone}`].filter(Boolean).join(' ')
  return (
    <button type="button" className={className} disabled={!onClick} onClick={onClick}>
      <span className="hpc-record__letter" aria-hidden="true">
        {letter}
      </span>
      <span className="hpc-record__part-text">
        <span className="hpc-record__part-title">{title}</span>
        <span className="hpc-record__part-detail">
          {tone === 'warning' && <WarningIcon />}
          {detail}
        </span>
      </span>
      <span className="hpc-record__chevron" aria-hidden="true">
        ›
      </span>
    </button>
  )
}

function Tile({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div className="hpc-tile">
      <span className="hpc-tile__value">{value}</span>
      <span className="hpc-tile__label">{label}</span>
      <span className="hpc-tile__detail">{detail}</span>
    </div>
  )
}

function Detail({ title, subtitle, onBack, children }: { title: string; subtitle: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="hpc-record">
      <div className="hpc-record__detail-head">
        <button type="button" className="hpc-record__back" aria-label="Back" onClick={onBack}>
          ←
        </button>
        <div>
          <h2 className="hpc-record__detail-title">{title}</h2>
          <p className="hpc-record__detail-subtitle">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="hpc-record__panel">
      <p className="hpc-record__panel-label">{label}</p>
      {children}
    </div>
  )
}

function Steps({ step, of, tone }: { step: number; of: number; tone: 'success' | 'warning' | 'action' }) {
  return (
    <div className={`hpc-record__steps hpc-record__steps--${tone}`} aria-hidden="true">
      {Array.from({ length: of }, (_, index) => (
        <span key={index} className={`hpc-record__step${index < step ? ' hpc-record__step--done' : ''}`} />
      ))}
    </div>
  )
}

function Note() {
  return (
    <p className="hpc-record__note">
      <InfoIcon />
      Nothing here is a grade or a rank. It's a picture of your year so far.
    </p>
  )
}

function WarningIcon() {
  return (
    <svg className="hpc-record__icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3 2 17h16L10 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 8.5v3.5M10 14.5v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg className="hpc-record__icon hpc-record__icon--info" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v5M10 6.2v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
